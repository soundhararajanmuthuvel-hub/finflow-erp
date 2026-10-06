import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'maroon' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'maroon',
  onClick,
  className,
}) => {
  const getColors = () => {
    switch (colorScheme) {
      case 'maroon':
        return {
          cardBorder: 'border-[#D6CFC4] hover:border-[#8B1A1A]',
          iconBg: 'bg-[#FDF2F2] text-[#8B1A1A] border-2 border-[#F8CFCF]',
          accentBar: 'bg-[#8B1A1A]',
        };
      case 'emerald':
        return {
          cardBorder: 'border-[#D6CFC4] hover:border-[#1F6B3A]',
          iconBg: 'bg-[#EAF5EE] text-[#1F6B3A] border-2 border-[#A7D9B7]',
          accentBar: 'bg-[#1F6B3A]',
        };
      case 'blue':
        return {
          cardBorder: 'border-[#D6CFC4] hover:border-[#1E3A8A]',
          iconBg: 'bg-[#EFF6FF] text-[#1E3A8A] border-2 border-[#BFDBFE]',
          accentBar: 'bg-[#1E3A8A]',
        };
      case 'purple':
        return {
          cardBorder: 'border-[#D6CFC4] hover:border-[#6B21A8]',
          iconBg: 'bg-[#F3E8FF] text-[#6B21A8] border-2 border-[#D8B4FE]',
          accentBar: 'bg-[#6B21A8]',
        };
      case 'amber':
        return {
          cardBorder: 'border-[#D6CFC4] hover:border-[#B45309]',
          iconBg: 'bg-[#FEF3C7] text-[#B45309] border-2 border-[#FDE68A]',
          accentBar: 'bg-[#B45309]',
        };
      case 'rose':
        return {
          cardBorder: 'border-[#FECACA] hover:border-[#B91C1C] bg-[#FEF2F2]',
          iconBg: 'bg-white text-[#B91C1C] border-2 border-[#FECACA]',
          accentBar: 'bg-[#B91C1C]',
        };
      default:
        return {
          cardBorder: 'border-[#D6CFC4] hover:border-[#3F3F46]',
          iconBg: 'bg-[#F4F4F5] text-[#18181B] border-2 border-[#D4D4D8]',
          accentBar: 'bg-[#3F3F46]',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative bg-white rounded-2xl p-6 border-2 shadow-warm transition-all duration-200 flex flex-col justify-between min-h-[190px]',
        colors.cardBorder,
        onClick && 'cursor-pointer hover:shadow-warm-lg',
        className
      )}
    >
      {/* Top Accent Strip */}
      <div className={clsx('absolute top-0 left-0 right-0 h-1.5', colors.accentBar)} />

      {/* Top Line: Icon badge (44px) placed beside the label */}
      <div className="flex items-center gap-3.5">
        <div className={clsx('h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm', colors.iconBg)}>
          <Icon className="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
        </div>
        <p className="text-[1.125rem] sm:text-[1.1875rem] font-semibold text-[#1A1A1A] leading-snug">
          {title}
        </p>
      </div>

      {/* Full-width Big Amount on its own line: 40px bold, never wrapped, never truncated */}
      <div className="mt-4 my-1">
        <div className="text-[2.25rem] sm:text-[2.5rem] font-bold text-[#1A1A1A] tracking-tight whitespace-nowrap leading-none">
          {value}
        </div>
      </div>

      {/* Helper text below: 17px, normal weight, dark gray #3F3F46 */}
      {subtitle && (
        <p className="mt-2 text-[1.0625rem] font-normal text-[#3F3F46] leading-relaxed">
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#EDE7DE] flex items-center gap-2 text-base font-semibold">
          {trend.isPositive ? (
            <span className="inline-flex items-center text-[#1F6B3A] gap-1 bg-[#EAF5EE] px-2.5 py-1 rounded-lg border border-[#A7D9B7]">
              <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
              {trend.value}
            </span>
          ) : (
            <span className="inline-flex items-center text-[#B91C1C] gap-1 bg-[#FEE2E2] px-2.5 py-1 rounded-lg border border-[#FECACA]">
              <ArrowDownRight className="h-5 w-5 stroke-[2.5]" />
              {trend.value}
            </span>
          )}
          <span className="text-[#3F3F46]">vs last period</span>
        </div>
      )}
    </div>
  );
};
