import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  Landmark,
  Receipt,
  BookOpen,
  FileSpreadsheet,
  History,
  Settings,
  X,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { formatRole } from '../../utils/formatters';

export const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, section: 'Core' },
  { name: 'Clients', href: '/clients', icon: Users, section: 'Directory' },
  { name: 'Finance Deals', href: '/deals', icon: Briefcase, section: 'Finance' },
  { name: 'Investors', href: '/investors', icon: TrendingUp, section: 'Directory' },
  { name: 'Partners', href: '/partners', icon: Landmark, section: 'Directory' },
  { name: 'Repayments', href: '/repayments', icon: Receipt, section: 'Finance' },
  { name: 'Ledger Journal', href: '/ledger', icon: BookOpen, section: 'Finance' },
  { name: 'Financial Reports', href: '/reports', icon: FileSpreadsheet, section: 'Reports' },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'ADMIN'], section: 'System' },
  { name: 'Settings', href: '/settings', icon: Settings, section: 'System' },
];

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, isMobile = false }) => {
  const { user } = useAuth();
  const { company } = useCompanyProfile();

  return (
    <aside
      className={clsx(
        'bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen select-none',
        isMobile ? 'w-full max-w-xs' : 'w-64 hidden lg:flex'
      )}
    >
      {/* Brand Accent Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#8B1A1A] via-[#8B1A1A] to-[#EA580C]" />

      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/apple-touch-icon.png"
              alt="FinFlow Logo"
              className="h-9 w-9 rounded-xl object-contain shadow-sm shrink-0 bg-[#072661] p-0.5 border border-[#8B1A1A]/20"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-slate-900 text-lg tracking-tight leading-tight">
                FinFlow
              </h1>
              <p className="text-xs font-semibold text-[#8B1A1A] leading-tight">
                Private Finance Management
              </p>
            </div>
          </div>

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 stroke-[2]" />
            </button>
          )}
        </div>

        {/* Dynamic Client Company Profile Box */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#8B1A1A] shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Operating Company
            </span>
          </div>
          <p
            className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-snug break-words"
            title={company?.name || 'Sri Lakshmi Finance'}
          >
            {company?.name || 'Sri Lakshmi Finance'}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        <div className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>

        {navigationItems.map((item) => {
          if (item.roles && user && !item.roles.includes(user.role)) return null;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group min-h-[44px]',
                  isActive
                    ? 'bg-[#8B1A1A] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={clsx(
                      'h-4.5 w-4.5 shrink-0 transition-colors stroke-[2]',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Product By MSR Solutions Footer & User Session */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">{user.fullName}</p>
              <p className="text-[11px] text-[#8B1A1A] font-semibold leading-tight">{formatRole(user.role)}</p>
            </div>
          </div>
        )}

        <div className="text-center pt-0.5">
          <p className="text-[11px] font-medium text-slate-400">
            Product by <span className="text-slate-700 font-bold">MSR Solutions</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
