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
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Finance Deals', href: '/deals', icon: Briefcase },
  { name: 'Investors', href: '/investors', icon: TrendingUp },
  { name: 'Partners', href: '/partners', icon: Landmark },
  { name: 'Repayments', href: '/repayments', icon: Receipt },
  { name: 'Ledger Journal', href: '/ledger', icon: BookOpen },
  { name: 'Financial Reports', href: '/reports', icon: FileSpreadsheet },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { company } = useCompanyProfile();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-3">
        <div className="flex items-center gap-3">
          <img
            src="/brand/apple-touch-icon.png"
            alt="FinFlow Logo"
            className="h-11 w-11 rounded-xl object-contain shadow-md shrink-0 bg-[#072661] p-0.5 border border-slate-700/60"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">
              FinFlow
            </h1>
            <p className="text-[11px] text-emerald-400 font-semibold tracking-wide">
              Private Finance Management
            </p>
          </div>
        </div>

        {/* Dynamic Client Company Profile Box */}
        <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Company Entity
          </span>
          <p className="text-xs font-bold text-slate-200 truncate mt-0.5" title={company?.name || 'My Finance Company'}>
            {company?.name || 'Sri Lakshmi Finance'}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Core Operations
        </div>
        {navigation.map((item) => {
          if (item.roles && user && !item.roles.includes(user.role)) return null;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={clsx(
                      'h-5 w-5 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Product By MSR Solutions Footer & User Session */}
      <div className="border-t border-slate-800 bg-slate-950/60 space-y-2.5 p-3.5">
        {user && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800/80">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 uppercase shrink-0">
              {user.fullName.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        )}

        <div className="text-center pt-1">
          <p className="text-[10px] font-semibold text-slate-400 tracking-wider">
            Product by <span className="text-slate-200 font-bold">MSR Solutions</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
