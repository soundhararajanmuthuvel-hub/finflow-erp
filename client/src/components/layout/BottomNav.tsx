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
      className="lg:hidden fixed bottom-0 left-0 right-0 h-18 bg-white border-t-2 border-[#D6CFC4] shadow-lg flex items-center justify-around z-40 px-2"
    >
      {primaryMobileNav.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none',
              isActive
                ? 'text-[#8B1A1A] font-extrabold'
                : 'text-[#52525B] hover:text-[#1A1A1A] font-semibold'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={clsx(
                  'p-1 rounded-lg flex items-center justify-center transition-all',
                  isActive && 'bg-[#FDF2F2]'
                )}
              >
                <item.icon className="h-6 w-6 stroke-[2.3]" aria-hidden="true" />
              </div>
              <span className="text-xs sm:text-sm mt-0.5 leading-tight">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* More / Menu Drawer Toggle */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[#52525B] hover:text-[#1A1A1A] font-semibold select-none"
      >
        <div className="p-1 rounded-lg flex items-center justify-center">
          <Menu className="h-6 w-6 stroke-[2.3]" aria-hidden="true" />
        </div>
        <span className="text-xs sm:text-sm mt-0.5 leading-tight">More</span>
      </button>
    </nav>
  );
};
