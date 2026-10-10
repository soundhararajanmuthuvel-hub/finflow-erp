import React, { useState } from 'react';
import { Bell, Search, LogOut, Menu, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { formatRole } from '../../utils/formatters';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
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
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs gap-4">
      {/* Left Area: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-lg">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-700 shrink-0 cursor-pointer transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5 stroke-[2]" />
          </button>
        )}

        <div className="relative w-full min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2]" />
          <input
            type="text"
            placeholder="Search deals, clients, investors..."
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#8B1A1A] focus:ring-3 focus:ring-[#8B1A1A]/10 transition-all"
          />
          <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-200/60 rounded">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right Area: Alerts, User Session, and Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* In-App Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-slate-500 stroke-[2]" />
            <span className="hidden sm:inline">Alerts</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center bg-red-600 text-white text-[11px] font-bold rounded-full h-4.5 min-w-[18px] px-1 shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-modal p-4 z-50">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  Notifications & Alerts
                </h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4 stroke-[2]" />
                </button>
              </div>

              <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto">
                {notificationsData && notificationsData.length > 0 ? (
                  notificationsData.slice(0, 6).map((n: any) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm"
                    >
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 text-xs sm:text-sm font-medium text-slate-500">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1 stroke-[2]" />
                    No unread notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Prominent Sign Out Button */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-3">
          <div className="text-right hidden md:block">
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{user?.fullName}</p>
            <p className="text-[11px] font-semibold text-[#8B1A1A] mt-0.5 leading-tight">{formatRole(user?.role)}</p>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="h-10 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
