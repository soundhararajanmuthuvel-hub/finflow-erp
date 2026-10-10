import React from 'react';
import clsx from 'clsx';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCheck,
  Ban,
} from 'lucide-react';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className, size = 'md' }) => {
  const getBadgeConfig = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'PROCESSED':
      case 'DISBURSED':
        return {
          icon: CheckCircle2,
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          symbol: '✓',
        };
      case 'APPROVED':
      case 'COMMITTED':
        return {
          icon: ShieldCheck,
          style: 'bg-blue-50 text-blue-700 border-blue-200/80',
          symbol: '✓',
        };
      case 'PENDING_APPROVAL':
      case 'DUE':
      case 'UPCOMING':
      case 'PARTIALLY_PAID':
      case 'FUNDING_PENDING':
      case 'READY_FOR_APPROVAL':
        return {
          icon: Clock,
          style: 'bg-amber-50 text-amber-700 border-amber-200/80',
          symbol: '⏱',
        };
      case 'OVERDUE':
      case 'DEFAULTED':
      case 'FLAGGED':
      case 'BLOCKED':
        return {
          icon: AlertTriangle,
          style: 'bg-rose-50 text-rose-700 border-rose-200/80',
          symbol: '!',
        };
      case 'COMPLETED':
      case 'SETTLED':
      case 'CLOSED':
        return {
          icon: CheckCheck,
          style: 'bg-purple-50 text-purple-700 border-purple-200/80',
          symbol: '✓✓',
        };
      case 'DRAFT':
        return {
          icon: FileText,
          style: 'bg-slate-100 text-slate-700 border-slate-200',
          symbol: '✎',
        };
      case 'CANCELLED':
      case 'WAIVED':
      case 'INACTIVE':
      default:
        return {
          icon: Ban,
          style: 'bg-slate-100 text-slate-600 border-slate-200',
          symbol: '✕',
        };
    }
  };

  const formatText = (st: string) => {
    if (!st) return '—';
    return st
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const config = getBadgeConfig(status);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold border select-none whitespace-nowrap',
        config.style,
        sizeClasses[size],
        className
      )}
    >
      <IconComponent className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" aria-hidden="true" />
      <span>{formatText(status)}</span>
    </span>
  );
};
