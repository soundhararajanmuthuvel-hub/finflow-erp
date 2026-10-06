import React, { useState } from 'react';
import { Bell, Search, LogOut, Menu, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

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
    <header className="h-20 bg-white border-b-2 border-[#D6CFC4] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-sm">
      {/* Left Area: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden h-12 w-12 rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4] hover:border-[#8B1A1A] flex items-center justify-center text-[#1A1A1A] shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-6 w-6 stroke-[2.3]" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#52525B] stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search deals, clients, investors..."
            className="w-full h-12 bg-[#FAF7F2] border-2 border-[#D6CFC4] rounded-xl pl-12 pr-4 text-base text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:border-[#8B1A1A] focus:ring-3 focus:ring-[#8B1A1A]/20 transition-all"
          />
        </div>
      </div>

      {/* Right Area: In-App Notifications & Sign Out */}
      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        {/* In-App Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-12 px-3 sm:px-4 rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4] hover:border-[#8B1A1A] text-[#1A1A1A] flex items-center gap-2 font-bold text-base transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-[#8B1A1A] stroke-[2.3]" />
            <span className="hidden sm:inline">Alerts</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center bg-[#B91C1C] text-white text-xs font-black rounded-full h-6 min-w-[24px] px-1.5 shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-84 sm:w-96 rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-modal p-5 z-50">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#EDE7DE]">
                <h4 className="text-base font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Notifications & Alerts
                </h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-[#52525B] hover:text-[#1A1A1A]"
                >
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto">
                {notificationsData && notificationsData.length > 0 ? (
                  notificationsData.slice(0, 6).map((n: any) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-[#FAF7F2] border-2 border-[#EDE7DE] text-base"
                    >
                      <p className="font-bold text-[#1A1A1A]">{n.title}</p>
                      <p className="text-[#52525B] text-sm font-medium mt-1">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-base font-semibold text-[#52525B]">
                    <CheckCircle2 className="h-8 w-8 text-[#1F6B3A] mx-auto mb-2 stroke-[2]" />
                    No unread notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Prominent Sign Out Button */}
        <div className="flex items-center gap-3 border-l-2 border-[#EDE7DE] pl-3 sm:pl-4">
          <div className="text-right hidden md:block">
            <p className="text-base font-bold text-[#1A1A1A] leading-tight">{user?.fullName}</p>
            <p className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider">{user?.role}</p>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="h-12 px-4 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#FECACA] hover:border-[#B91C1C] font-bold text-base flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5 stroke-[2.5]" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
