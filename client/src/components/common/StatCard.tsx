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
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'maroon',
  onClick,
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
          cardBorder: 'border-[#D6CFC4] hover:border-[#B91C1C]',
          iconBg: 'bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#FECACA]',
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
        'relative bg-white rounded-2xl p-6 border-2 shadow-warm transition-all duration-200 flex flex-col justify-between overflow-hidden',
        colors.cardBorder,
        onClick && 'cursor-pointer hover:shadow-warm-lg'
      )}
    >
      {/* Top Accent Strip */}
      <div className={clsx('absolute top-0 left-0 right-0 h-1.5', colors.accentBar)} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-lg font-bold text-[#3F3F46] tracking-wide uppercase leading-snug">
            {title}
          </p>
          <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight truncate leading-tight">
            {value}
          </div>
          {subtitle && (
            <p className="mt-2 text-base font-semibold text-[#52525B] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className={clsx('rounded-xl p-3.5 shrink-0 shadow-sm', colors.iconBg)}>
          <Icon className="h-7 w-7 stroke-[2.2]" aria-hidden="true" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-[#EDE7DE] flex items-center gap-2 text-base font-bold">
          {trend.isPositive ? (
            <span className="inline-flex items-center text-[#1F6B3A] gap-1 bg-[#EAF5EE] px-2 py-0.5 rounded-md">
              <ArrowUpRight className="h-5 w-5" />
              {trend.value}
            </span>
          ) : (
            <span className="inline-flex items-center text-[#B91C1C] gap-1 bg-[#FEE2E2] px-2 py-0.5 rounded-md">
              <ArrowDownRight className="h-5 w-5" />
              {trend.value}
            </span>
          )}
          <span className="text-[#52525B] font-medium">vs last period</span>
        </div>
      )}
    </div>
  );
};
