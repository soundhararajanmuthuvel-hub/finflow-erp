import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className }) => {
  const getStyle = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'PROCESSED':
      case 'DISBURSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'APPROVED':
      case 'COMMITTED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PENDING_APPROVAL':
      case 'DUE':
      case 'UPCOMING':
      case 'PARTIALLY_PAID':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OVERDUE':
      case 'DEFAULTED':
      case 'FLAGGED':
      case 'BLOCKED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'COMPLETED':
      case 'SETTLED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DRAFT':
      case 'CANCELLED':
      case 'WAIVED':
      case 'INACTIVE':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formatText = (st: string) => {
    if (!st) return '—';
    return st.replace(/_/g, ' ');
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider',
        getStyle(status),
        className
      )}
    >
      {formatText(status)}
    </span>
  );
};
