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
          style: 'bg-[#EAF5EE] text-[#1F6B3A] border-[#A7D9B7]',
          symbol: '✓',
        };
      case 'APPROVED':
      case 'COMMITTED':
        return {
          icon: ShieldCheck,
          style: 'bg-[#EFF6FF] text-[#1E3A8A] border-[#BFDBFE]',
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
          style: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
          symbol: '⏱',
        };
      case 'OVERDUE':
      case 'DEFAULTED':
      case 'FLAGGED':
      case 'BLOCKED':
        return {
          icon: AlertTriangle,
          style: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
          symbol: '!',
        };
      case 'COMPLETED':
      case 'SETTLED':
      case 'CLOSED':
        return {
          icon: CheckCheck,
          style: 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]',
          symbol: '✓✓',
        };
      case 'DRAFT':
        return {
          icon: FileText,
          style: 'bg-[#F4F4F5] text-[#3F3F46] border-[#D4D4D8]',
          symbol: '✎',
        };
      case 'CANCELLED':
      case 'WAIVED':
      case 'INACTIVE':
      default:
        return {
          icon: Ban,
          style: 'bg-[#F4F4F5] text-[#52525B] border-[#D4D4D8]',
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
    sm: 'text-sm px-2.5 py-1 gap-1.5',
    md: 'text-base px-3.5 py-1.5 gap-2',
    lg: 'text-lg px-4 py-2 gap-2.5',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-lg font-bold border-2 shadow-sm select-none whitespace-nowrap',
        config.style,
        sizeClasses[size],
        className
      )}
    >
      <IconComponent className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
      <span>{formatText(status)}</span>
    </span>
  );
};
