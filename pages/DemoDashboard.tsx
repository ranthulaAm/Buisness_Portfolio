import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  Menu, 
  X, 
  ChevronRight, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Data types
interface ClientItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  revenue: number;
  date: string;
}

const mockClients: ClientItem[] = [
  { id: '1', name: 'Ranthula Senmith', email: 'ranthula@example.com', status: 'active', revenue: 1250, date: '2026-08-01' },
  { id: '2', name: 'Darshana Senali', email: 'darshana@example.com', status: 'active', revenue: 950, date: '2026-08-03' },
  { id: '3', name: 'Dineth Theekshana', email: 'dineth@example.com', status: 'pending', revenue: 450, date: '2026-08-04' },
  { id: '4', name: 'Cricket Lover', email: 'cricket@example.com', status: 'active', revenue: 1800, date: '2026-08-05' },
  { id: '5', name: 'Aruna Kumara', email: 'aruna@example.com', status: 'inactive', revenue: 0, date: '2026-07-28' },
  { id: '6', name: 'Kavindu Dilshan', email: 'kavindu@example.com', status: 'active', revenue: 2100, date: '2026-08-06' },
  { id: '7', name: 'Sanduni Perera', email: 'sanduni@example.com', status: 'pending', revenue: 300, date: '2026-08-06' },
];

export const DemoDashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Container dimension state for immediate boundary checks
  const [containerWidth, setContainerWidth] = useState<number>(1024);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(true); // default to stacking first
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof ClientItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ResizeObserver for immediate parent container boundary check
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setContainerWidth(width);
        // Force single-column stacking for mobile viewports (< 768px)
        setIsMobileViewport(width < 768);
      }
    });

    observer.observe(containerRef.current);
    
    // Initial size check
    const initialWidth = containerRef.current.getBoundingClientRect().width;
    setContainerWidth(initialWidth);
    setIsMobileViewport(initialWidth < 768);

    return () => observer.disconnect();
  }, []);

  // Sidebar navigation menu options
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Clients', icon: Users },
    { name: 'Revenue', icon: DollarSign },
    { name: 'Analytics', icon: TrendingUp },
    { name: 'Settings', icon: Settings },
  ];

  // Sorting handler
  const handleSort = (field: keyof ClientItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort the client list
  const filteredClients = mockClients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            client.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : client.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      
      return 0;
    });

  // Derived metrics for stat cards
  const totalRevenue = mockClients.reduce((sum, client) => sum + client.revenue, 0);
  const activeCount = mockClients.filter(c => c.status === 'active').length;
  const averageDealSize = mockClients.length ? Math.round(totalRevenue / mockClients.length) : 0;

  return (
    <div id="demo_dashboard_page" className="w-full bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors duration-200">
      <Helmet>
        <title>Responsive Core Dashboard</title>
      </Helmet>

      {/* Main outer container using parent control scrolling to strictly prevent nested vertical scrollbars */}
      <div 
        ref={containerRef} 
        className="w-full max-w-[1440px] mx-auto min-h-screen flex flex-col md:flex-row relative"
      >
        {/* Responsive Mobile Drawer Header */}
        {isMobileViewport && (
          <header id="mobile_navbar" className="w-full bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-700 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white">Admin Engine</span>
            </div>
            <button 
              id="mobile_sidebar_toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/50 dark:border-zinc-700"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>
        )}

        {/* Sidebar Menu - Collapsible overlay on mobile viewport, permanent on desktop viewport */}
        <AnimatePresence mode="wait">
          {(!isMobileViewport || isSidebarOpen) && (
            <motion.aside
              id="sidebar_menu"
              initial={isMobileViewport ? { x: -280, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobileViewport ? { x: -280, opacity: 0 } : undefined}
              transition={{ type: 'tween', duration: 0.25 }}
              className={`
                shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-700
                flex flex-col z-50
                ${isMobileViewport 
                  ? 'fixed top-[65px] left-0 bottom-0 w-[260px]' 
                  : 'w-[250px] min-h-screen sticky top-0 h-screen'
                }
              `}
            >
              {/* Sidebar Header for Desktop */}
              {!isMobileViewport && (
                <div className="p-6 border-b border-slate-100 dark:border-zinc-700/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    R
                  </div>
                  <div>
                    <h2 className="font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Admin Engine</h2>
                    <p className="text-[10px] text-slate-400 font-medium">v1.2.0 • Pro</p>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="flex-grow p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        if (isMobileViewport) setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                        ${isActive 
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 rounded-l-none' 
                          : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />
                        <span className="whitespace-nowrap">{item.name}</span>
                      </div>
                      {!isMobileViewport && (
                        <ChevronRight size={14} className={`opacity-0 transition-opacity ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* User Identity Info Footer in Sidebar */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-700/60">
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-zinc-800/40 rounded-xl">
                  <img 
                    src="https://api.dicebear.com/7.x/shapes/svg?seed=Ranthula" 
                    alt="User profile avatar" 
                    className="w-9 h-9 rounded-full border border-indigo-500/20"
                  />
                  <div className="min-w-0 flex-grow">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Ranthula Senmith</p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate font-semibold">Administrator</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar Overlay for Mobile Viewport */}
        {isMobileViewport && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 top-[65px]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Panel Content - Ensures no nested vertical scrollbars inside child items */}
        <main className="flex-grow p-5 sm:p-8 flex flex-col gap-6 md:gap-8 overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">System Overview</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Responsive Control Engine
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {}}
                className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-zinc-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 transition-all shadow-sm active:scale-95 whitespace-nowrap"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Sync Data
              </button>
            </div>
          </div>

          {/* Three Stat Cards Grid - Enforces responsive stacking layout dynamically assessed */}
          <div className={`grid gap-4 md:gap-6 ${isMobileViewport ? 'grid-cols-1' : 'grid-cols-3'}`}>
            
            {/* Stat Card 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Active Clients</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {activeCount}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                  +12% vs last week
                </span>
              </div>
              <div className="mt-4 text-xs text-slate-400 dark:text-gray-500 font-medium">
                Clients currently receiving dynamic live tracking updates.
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ${totalRevenue.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Goal 85% reached
                </span>
              </div>
              <div className="mt-4 text-xs text-slate-400 dark:text-gray-500 font-medium">
                Aggregated billing pipeline generated from milestone releases.
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Average Deal Value</span>
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ${averageDealSize.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Healthy tier range
                </span>
              </div>
              <div className="mt-4 text-xs text-slate-400 dark:text-gray-500 font-medium">
                Estimated average margin scoped across active digital deliverables.
              </div>
            </div>

          </div>

          {/* Interactive Core Data Table Section */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            
            {/* Table Control Bar */}
            <div className="p-5 border-b border-slate-150 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-grow max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search client records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Filtering Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Table Content Area - Unified scrolling to prevent double scrollbars */}
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-zinc-800/20 border-b border-slate-150 dark:border-zinc-700">
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider select-none cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        Client Identity
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </div>
                    </th>
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider select-none cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">
                        Status Code
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </div>
                    </th>
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider select-none cursor-pointer" onClick={() => handleSort('revenue')}>
                      <div className="flex items-center gap-1.5 justify-end">
                        Volume (USD)
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </div>
                    </th>
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider select-none cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1.5">
                        Log Date
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </div>
                    </th>
                    <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">
                      Operations
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <AnimatePresence>
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <tr 
                          key={client.id}
                          className="hover:bg-slate-50/55 dark:hover:bg-slate-800/10 transition-colors"
                        >
                          {/* Client Detail Column */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-700 dark:text-gray-300 text-xs">
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{client.name}</p>
                                <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{client.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge Column */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`
                              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                              ${client.status === 'active' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10' 
                                : client.status === 'pending'
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-500/10'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 border border-slate-500/10'
                              }
                            `}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                client.status === 'active' ? 'bg-emerald-500' : client.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                              }`} />
                              {client.status}
                            </span>
                          </td>

                          {/* Revenue Value Column */}
                          <td className="py-4 px-6 font-bold text-right text-slate-900 dark:text-white whitespace-nowrap">
                            ${client.revenue.toLocaleString()}
                          </td>

                          {/* Date Column */}
                          <td className="py-4 px-6 text-slate-500 dark:text-gray-400 whitespace-nowrap font-medium text-xs">
                            {new Date(client.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Action Button Operations Column */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                title="Inspect Record"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Purge Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-gray-500 font-medium">
                          No matching records located in pipeline search scope.
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="p-5 border-t border-slate-150 dark:border-zinc-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
              <span className="font-semibold">Showing {filteredClients.length} of {mockClients.length} clients</span>
              <div className="flex items-center gap-2">
                <button 
                  disabled 
                  className="px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed font-bold"
                >
                  Prev
                </button>
                <button 
                  disabled 
                  className="px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed font-bold"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};
