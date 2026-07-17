import { toast } from "react-hot-toast";
import React, { useMemo, useState, useEffect } from 'react';
import { Order } from '../types';
import { User as UserIcon, Mail, Phone, Calendar, Package, Search, Edit2, Check, X, Loader2, UserCheck } from 'lucide-react';
import { updateClientMobileByEmail } from '../services/storageService';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface AdminClientsProps {
  orders: Order[];
}

export const AdminClients: React.FC<AdminClientsProps> = ({ orders }) => {
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => doc.data());
      setRegisteredUsers(usersList);
    }, (error) => {
      console.warn("Could not listen to registered users:", error);
    });
    return () => unsubscribe();
  }, []);

  const clients = useMemo(() => {
    const clientsMap = new Map<string, any>();

    // 1. Add all registered users first (handles registered users who haven't placed orders yet!)
    registeredUsers.forEach(u => {
      const email = u.email || '';
      if (!email) return;
      const emailKey = email.toLowerCase();
      
      clientsMap.set(emailKey, {
        name: u.name || 'Anonymous User',
        email: email,
        mobiles: new Set<string>(u.mobiles || []),
        joined: u.createdAt || new Date().toISOString(),
        totalOrders: 0,
        totalSpent: 0,
        categories: {} as Record<string, number>,
        allOrders: [] as Order[],
        isRegisteredUser: true,
        provider: u.provider || 'email'
      });
    });

    // 2. Process all orders to aggregate stats and include any client emails not in registeredUsers
    orders.forEach(o => {
      const email = o.email || o.clientEmail || '';
      if (!email) return;
      const emailKey = email.toLowerCase();

      const existing = clientsMap.get(emailKey) || {
        name: o.clientName || 'Unknown',
        email: email,
        mobiles: new Set<string>(),
        joined: o.createdAt,
        totalOrders: 0,
        totalSpent: 0,
        categories: {} as Record<string, number>,
        allOrders: [] as Order[],
        isRegisteredUser: false
      };

      if (o.mobile) {
        if (Array.isArray(o.mobile)) {
          o.mobile.forEach((m: string) => existing.mobiles.add(m));
        } else {
          existing.mobiles.add(o.mobile as string);
        }
      }
      existing.totalOrders++;
      if (o.status === 'Completed' && o.price) {
         existing.totalSpent += o.price;
      }
      
      const cat = o.serviceType || 'Other';
      existing.categories[cat] = (existing.categories[cat] || 0) + 1;
      
      if (new Date(o.createdAt) < new Date(existing.joined)) {
        existing.joined = o.createdAt;
      }
      
      existing.allOrders.push(o);
      clientsMap.set(emailKey, existing);
    });
    
    return Array.from(clientsMap.values()).sort((a, b) => {
      // Sort by registered users/active order count
      if (b.totalOrders !== a.totalOrders) {
        return b.totalOrders - a.totalOrders;
      }
      return new Date(b.joined).getTime() - new Date(a.joined).getTime();
    });
  }, [orders, registeredUsers]);

  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editMobileValue, setEditMobileValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Array.from(c.mobiles).some((m: any) => m.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditMobile = (client: any) => {
    setEditingEmail(client.email);
    // Take the first available mobile or empty string
    setEditMobileValue(client.mobiles.size > 0 ? Array.from(client.mobiles).join(', ') : '');
  };

  const handleSaveMobile = async (email: string) => {
    try {
      setIsUpdating(true);
      await updateClientMobileByEmail(email, editMobileValue);
      setEditingEmail(null);
      setEditMobileValue('');
    } catch (e) {
      toast("Failed to update mobile number");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmail(null);
    setEditMobileValue('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="text-blue-500" />
            Client Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Detailed information about all {clients.length} unique clients.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)}
             type="text" 
             placeholder="Search clients..." 
             className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200"
           />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="p-4 whitespace-nowrap">Client</th>
              <th className="p-4 whitespace-nowrap">Contact Details</th>
              <th className="p-4 whitespace-nowrap">Joined</th>
              <th className="p-4 whitespace-nowrap text-center">Orders</th>
              <th className="p-4 whitespace-nowrap text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredClients.length > 0 ? filteredClients.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-slate-100 text-base">{c.name}</span>
                    {c.isRegisteredUser && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30">
                        <UserCheck size={10} /> Registered User
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                     Top service: {Object.entries(c.categories).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <Mail size={14} className="text-gray-400" /> {c.email}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <Phone size={14} className="text-gray-400 mt-0.5" /> 
                      {editingEmail === c.email ? (
                        <div className="flex items-center gap-2">
                           <input 
                              type="text" 
                              value={editMobileValue}
                              onChange={(e) => setEditMobileValue(e.target.value)}
                              placeholder="Multiple numbers? Separate by comma"
                              className="px-2 py-1 border border-gray-200 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200"
                              autoFocus
                           />
                           <button 
                             onClick={() => handleSaveMobile(c.email)} 
                             disabled={isUpdating}
                             className="p-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                             title="Save"
                           >
                             {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                           </button>
                           <button 
                             onClick={handleCancelEdit} 
                             disabled={isUpdating}
                             className="p-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                             title="Cancel"
                           >
                             <X size={12} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleEditMobile(c)}>
                           <div className="flex flex-col">
                             {c.mobiles.size > 0 ? (
                               Array.from(c.mobiles).flatMap((m: any) => m.split(',')).map(m => m.trim()).filter(Boolean).map((m: any, idx) => (
                                 <span key={idx} className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] mb-1 mr-1 inline-block">{m}</span>
                               ))
                             ) : (
                               <span className="text-gray-400 italic">No number</span>
                             )}
                           </div>
                           <button className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Edit2 size={12} />
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                     <Calendar size={14} /> {new Date(c.joined).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                    <Package size={12} className="mr-1" /> {c.totalOrders}
                  </span>
                </td>
                <td className="p-4 text-right font-medium text-gray-900 dark:text-slate-100">
                  LKR {c.totalSpent.toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr>
                 <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-slate-400">
                    No clients found matching your search.
                 </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
