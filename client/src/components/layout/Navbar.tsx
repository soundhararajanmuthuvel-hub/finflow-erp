import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  CheckCheck,
  Settings,
  Calendar,
  AlertTriangle,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { formatRole, formatDate } from '../../utils/formatters';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showNotifications, setShowNotifications] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'REPAYMENTS' | 'DEALS' | 'SYSTEM'>('ALL');

  // Query notifications
  const { data: rawNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res: any = await apiClient.get('/notifications');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const notificationsList: any[] = Array.isArray(rawNotifs)
    ? rawNotifs
    : rawNotifs?.notifications || [];

  const unreadCount: number =
    rawNotifs?.unreadCount !== undefined
      ? rawNotifs.unreadCount
      : notificationsList.filter((n: any) => !n.isRead).length;

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Handle click on notification item
  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      markAsReadMutation.mutate(n.id);
    }
    setShowNotifications(false);

    // Route depending on entity
    if (n.entityType === 'REPAYMENT_SCHEDULE' || n.entityType === 'REPAYMENT') {
      navigate('/repayments');
    } else if (n.entityType === 'DEAL' && n.entityId) {
      navigate(`/deals/${n.entityId}`);
    } else if (n.entityType === 'DEAL') {
      navigate('/deals');
    } else if (n.entityType === 'INVESTOR') {
      navigate('/investors');
    } else if (n.entityType === 'PARTNER') {
      navigate('/partners');
    } else {
      navigate('/dashboard');
    }
  };

  // Filtered notifications
  const filteredNotifications = notificationsList.filter((n: any) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'REPAYMENTS') {
      return (
        n.type?.includes('REPAYMENT') ||
        n.type?.includes('PAYMENT') ||
        n.entityType?.includes('REPAYMENT')
      );
    }
    if (filterCategory === 'DEALS') {
      return n.type?.includes('DEAL') || n.entityType?.includes('DEAL');
    }
    if (filterCategory === 'SYSTEM') {
      return n.type?.includes('SYSTEM') || n.type?.includes('ALERT');
    }
    return true;
  });

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
            placeholder="Search deals, clients, investors, receipts..."
            className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Area: Alerts, PWA Install, User Session, and Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* PWA Install Button (Unobtrusive) */}
        <PWAInstallButton className="hidden sm:inline-flex" />

        {/* In-App Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative h-10 px-3 rounded-xl border flex items-center gap-2 font-medium text-xs sm:text-sm transition-all cursor-pointer ${
              unreadCount > 0
                ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            aria-label="Notifications"
          >
            <Bell className={`h-4 w-4 stroke-[2] ${unreadCount > 0 ? 'text-rose-700 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Alerts</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center bg-rose-700 text-white text-[11px] font-black rounded-full h-5 min-w-[20px] px-1 shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[420px] rounded-2xl bg-white border border-slate-200 shadow-modal p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Notifications & Financial Alerts
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                      className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 pt-2 pb-1 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'REPAYMENTS', label: 'Repayments' },
                  { id: 'DEALS', label: 'Deals' },
                  { id: 'SYSTEM', label: 'System' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id as any)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      filterCategory === cat.id
                        ? 'bg-rose-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="mt-2 space-y-1.5 max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.slice(0, 15).map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        !n.isRead
                          ? 'bg-rose-50/60 border border-rose-200/60 hover:bg-rose-100/60'
                          : 'bg-white hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                          )}
                          <p className={`text-xs truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {n.title}
                          </p>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs font-medium text-slate-500">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1 stroke-[2]" />
                    No notifications in this category
                  </div>
                )}
              </div>

              {/* Footer with Notification Settings Link */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">PWA Real-time Push Active</span>
                <Link
                  to="/settings"
                  onClick={() => setShowNotifications(false)}
                  className="font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Notification Settings
                </Link>
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
