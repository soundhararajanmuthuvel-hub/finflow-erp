import React, { useState } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res: any = await apiClient.get('/notifications');
      return res.data || [];
    },
    refetchInterval: 30000,
  });

  const unreadCount = notificationsData?.filter((n: any) => !n.isRead).length || 0;

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Global Quick Search */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search deals, clients, investors, receipts..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* In-App Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {notificationsData && notificationsData.length > 0 ? (
                  notificationsData.slice(0, 5).map((n: any) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                      <p className="font-semibold text-slate-200">{n.title}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No recent notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user?.fullName}</p>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
