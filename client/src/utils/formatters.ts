import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: number | string | undefined | null, symbol = '₹'): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return `${symbol}0.00`;
  const num = Number(amount);
  return `${symbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString?: string | Date | null, formatStr = 'dd MMM yyyy'): string => {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(d, formatStr);
  } catch (error) {
    return String(dateString);
  }
};

export const formatPercentage = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || isNaN(Number(val))) return '0.00%';
  return `${Number(val).toFixed(2)}%`;
};

export const formatRole = (role?: string | null): string => {
  if (!role) return '—';
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

