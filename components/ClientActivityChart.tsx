import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { Order } from '../types';

interface ClientActivityChartProps {
  orders: Order[];
}

export const ClientActivityChart: React.FC<ClientActivityChartProps> = ({ orders }) => {
  const data = useMemo(() => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d,
        displayDate: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        fullDate: d.toISOString().split('T')[0],
        orders: 0
      };
    });

    const dateMap = new Map(last30Days.map(d => [d.fullDate, d]));

    orders.forEach(order => {
      if (order.createdAt) {
        const d = new Date(order.createdAt);
        const dateStr = d.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
          dateMap.get(dateStr)!.orders += 1;
        }
      }
    });

    return last30Days.map(d => ({
      name: d.displayDate,
      orders: d.orders
    }));
  }, [orders]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Client Activity (Last 30 Days)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} allowDecimals={false} />
            <RechartsTooltip cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            <Area type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
