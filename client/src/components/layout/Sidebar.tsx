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
        'bg-white border-r-2 border-[#D6CFC4] flex flex-col shrink-0 min-h-screen select-none',
        isMobile ? 'w-full max-w-xs' : 'w-60 hidden lg:flex'
      )}
    >
      {/* Tamil Culture Decorative Accent Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#8B1A1A] via-[#8B1A1A] to-[#B7791F]" />

      {/* Brand Header */}
      <div className="p-4 border-b-2 border-[#EDE7DE] bg-[#FAF7F2] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/apple-touch-icon.png"
              alt="FinFlow Logo"
              className="h-9 w-9 rounded-xl object-contain shadow-sm shrink-0 bg-[#072661] p-0.5 border-2 border-[#8B1A1A]/30"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-[#1A1A1A] text-lg tracking-tight leading-tight">
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
              className="p-1.5 rounded-xl bg-white border-2 border-[#D6CFC4] text-[#1A1A1A] hover:bg-[#F3EFEA]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Dynamic Client Company Profile Box (wraps without truncation) */}
        <div className="p-2.5 rounded-xl bg-white border-2 border-[#D6CFC4] shadow-sm">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#8B1A1A] shrink-0" />
            <span className="text-xs font-bold text-[#3F3F46] block">
              Operating Company
            </span>
          </div>
          <p
            className="text-sm font-bold text-[#1A1A1A] mt-0.5 leading-snug break-words"
            title={company?.name || 'Sri Lakshmi Finance'}
          >
            {company?.name || 'Sri Lakshmi Finance'}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        <div className="px-2 pb-1 text-xs font-bold text-[#3F3F46]">
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
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold transition-all duration-150 group min-h-[44px]',
                  isActive
                    ? 'bg-[#8B1A1A] text-white shadow-md shadow-[#8B1A1A]/20 border-2 border-[#8B1A1A]'
                    : 'text-[#1A1A1A] hover:bg-[#FAF7F2] hover:text-[#8B1A1A] border-2 border-transparent hover:border-[#D6CFC4]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={clsx(
                      'h-5 w-5 shrink-0 transition-colors stroke-[2.2]',
                      isActive ? 'text-white' : 'text-[#8B1A1A] group-hover:text-[#6E1414]'
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
      <div className="border-t-2 border-[#EDE7DE] bg-[#FAF7F2] p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border-2 border-[#D6CFC4] shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {user.fullName.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1A1A] leading-tight break-words">{user.fullName}</p>
              <p className="text-xs text-[#8B1A1A] font-semibold mt-0.5 leading-tight">{formatRole(user.role)}</p>
            </div>
          </div>
        )}

        <div className="text-center pt-0.5">
          <p className="text-xs font-medium text-[#3F3F46]">
            Product by <span className="text-[#1A1A1A] font-bold">MSR Solutions</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
