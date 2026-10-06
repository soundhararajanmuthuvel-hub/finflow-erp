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
        isMobile ? 'w-full max-w-xs sm:max-w-sm' : 'w-72 hidden lg:flex'
      )}
    >
      {/* Tamil Culture Decorative Accent Top Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#8B1A1A] via-[#8B1A1A] to-[#B7791F]" />

      {/* Brand Header */}
      <div className="p-5 border-b-2 border-[#EDE7DE] bg-[#FAF7F2] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/brand/apple-touch-icon.png"
              alt="FinFlow Logo"
              className="h-12 w-12 rounded-xl object-contain shadow-md shrink-0 bg-[#072661] p-0.5 border-2 border-[#8B1A1A]/30"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-[#1A1A1A] text-xl tracking-tight leading-tight">
                FinFlow
              </h1>
              <p className="text-sm font-semibold text-[#8B1A1A] leading-tight">
                Private Finance Management
              </p>
            </div>
          </div>

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-xl bg-white border-2 border-[#D6CFC4] text-[#1A1A1A] hover:bg-[#F3EFEA]"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Dynamic Client Company Profile Box (wraps without truncation) */}
        <div className="p-3.5 rounded-xl bg-white border-2 border-[#D6CFC4] shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#8B1A1A] shrink-0" />
            <span className="text-sm font-bold text-[#3F3F46] block">
              Operating Company
            </span>
          </div>
          <p
            className="text-[1.0625rem] font-bold text-[#1A1A1A] mt-1 leading-snug break-words"
            title={company?.name || 'Sri Lakshmi Finance'}
          >
            {company?.name || 'Sri Lakshmi Finance'}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto" aria-label="Main Navigation">
        <div className="px-3 pb-1 text-sm font-bold text-[#3F3F46]">
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
                  'flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[1.125rem] font-semibold transition-all duration-150 group min-h-[56px]',
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
                      'h-6 w-6 shrink-0 transition-colors stroke-[2.3]',
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
      <div className="border-t-2 border-[#EDE7DE] bg-[#FAF7F2] p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-[#D6CFC4] shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              {user.fullName.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-[#1A1A1A] leading-tight break-words">{user.fullName}</p>
              <p className="text-sm text-[#8B1A1A] font-semibold mt-0.5 leading-tight">{formatRole(user.role)}</p>
            </div>
          </div>
        )}

        <div className="text-center pt-1">
          <p className="text-sm font-medium text-[#3F3F46]">
            Product by <span className="text-[#1A1A1A] font-bold">MSR Solutions</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
