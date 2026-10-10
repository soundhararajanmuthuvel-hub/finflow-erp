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
          iconBg: 'bg-red-50 text-[#8B1A1A] border border-red-100',
          accentBar: 'bg-[#8B1A1A]',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
          accentBar: 'bg-emerald-600',
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-50 text-blue-700 border border-blue-100',
          accentBar: 'bg-blue-600',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-700 border border-purple-100',
          accentBar: 'bg-purple-600',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border border-amber-100',
          accentBar: 'bg-amber-600',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-700 border border-rose-100',
          accentBar: 'bg-rose-600',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
          accentBar: 'bg-slate-700',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[148px]',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-card-hover group',
        className
      )}
    >
      {/* Top Header: Label & Icon Badge */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-snug">
          {title}
        </p>
        <div className={clsx('h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', colors.iconBg)}>
          <Icon className="h-4.5 w-4.5 stroke-[2]" aria-hidden="true" />
        </div>
      </div>

      {/* Prominent Amount */}
      <div className="mt-3 my-1">
        <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight whitespace-nowrap leading-tight">
          {value}
        </div>
      </div>

      {/* Helper Subtitle or Trend */}
      {subtitle && (
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 leading-relaxed truncate">
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold">
          {trend.isPositive ? (
            <span className="inline-flex items-center text-emerald-700 gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              {trend.value}
            </span>
          ) : (
            <span className="inline-flex items-center text-rose-700 gap-1 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
              {trend.value}
            </span>
          )}
          <span className="text-slate-400">vs last period</span>
        </div>
      )}
    </div>
  );
};
