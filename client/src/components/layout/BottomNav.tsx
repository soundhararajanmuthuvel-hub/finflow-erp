import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  Users,
  Menu,
} from 'lucide-react';
import clsx from 'clsx';

interface BottomNavProps {
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMore }) => {
  const primaryMobileNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Deals', href: '/deals', icon: Briefcase },
    { name: 'Repayments', href: '/repayments', icon: Receipt },
    { name: 'Clients', href: '/clients', icon: Users },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg flex items-center justify-around z-40 px-2"
    >
      {primaryMobileNav.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none',
              isActive
                ? 'text-[#8B1A1A] font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={clsx(
                  'p-1 rounded-xl flex items-center justify-center transition-all',
                  isActive && 'bg-red-50 text-[#8B1A1A]'
                )}
              >
                <item.icon className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-semibold mt-0.5 leading-tight">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* More / Menu Drawer Toggle */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-900 font-medium select-none"
      >
        <div className="p-1 rounded-xl flex items-center justify-center">
          <Menu className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
        </div>
        <span className="text-[11px] font-semibold mt-0.5 leading-tight">More</span>
      </button>
    </nav>
  );
};
