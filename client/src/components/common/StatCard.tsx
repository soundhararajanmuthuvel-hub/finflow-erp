import React from 'react';
import { LucideIcon } from 'lucide-react';
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
  colorScheme?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'emerald',
}) => {
  const getColors = () => {
    switch (colorScheme) {
      case 'emerald':
        return {
          bg: 'from-emerald-500/10 to-transparent border-emerald-500/20',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
        };
      case 'blue':
        return {
          bg: 'from-blue-500/10 to-transparent border-blue-500/20',
          iconBg: 'bg-blue-500/20 text-blue-400',
        };
      case 'purple':
        return {
          bg: 'from-purple-500/10 to-transparent border-purple-500/20',
          iconBg: 'bg-purple-500/20 text-purple-400',
        };
      case 'amber':
        return {
          bg: 'from-amber-500/10 to-transparent border-amber-500/20',
          iconBg: 'bg-amber-500/20 text-amber-400',
        };
      case 'rose':
        return {
          bg: 'from-rose-500/10 to-transparent border-rose-500/20',
          iconBg: 'bg-rose-500/20 text-rose-400',
        };
      default:
        return {
          bg: 'from-slate-500/10 to-transparent border-slate-700/50',
          iconBg: 'bg-slate-800 text-slate-300',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-gradient-to-b p-5 border shadow-card transition-all duration-300 hover:border-slate-600 bg-slate-900/60 backdrop-blur-md',
        colors.bg
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={clsx('rounded-xl p-3 shadow-inner', colors.iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.value}
          </span>
          <span className="text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
};
