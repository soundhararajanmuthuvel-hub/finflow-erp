import React from 'react';
import { LucideIcon, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

// ==========================================
// ACCESSIBLE BUTTON (56px touch target, 18px text, Icon+Label)
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'subtle';
  size?: 'normal' | 'large' | 'compact';
  icon?: LucideIcon | React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const AccessibleButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'normal',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#8B1A1A] hover:bg-[#781414] active:bg-[#630E0E] text-white border border-[#8B1A1A] shadow-sm';
      case 'secondary':
        return 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm hover:border-slate-300';
      case 'outline':
        return 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:border-[#8B1A1A] hover:text-[#8B1A1A]';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-600 shadow-sm';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-600 shadow-sm';
      case 'subtle':
        return 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-transparent';
      default:
        return 'bg-[#8B1A1A] text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'large':
        return 'h-12 px-5 text-base font-semibold gap-2 rounded-xl';
      case 'compact':
        return 'h-9 px-3 text-xs sm:text-sm font-semibold gap-1.5 rounded-lg';
      case 'normal':
      default:
        return 'h-11 px-4 text-sm font-semibold gap-2 rounded-xl';
    }
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComp = Icon as LucideIcon;
    return <IconComp className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 stroke-[2.2]" aria-hidden="true" />;
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        iconPosition === 'left' && renderIcon()
      )}
      <span>{children}</span>
      {!isLoading && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

// ==========================================
// ACCESSIBLE INPUT FIELD (44px, visible label)
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: LucideIcon;
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, icon: Icon, className, id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-600 text-xs font-bold ml-0.5">*</span>}
          </label>
        </div>

        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Icon className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={clsx(
              'w-full h-11 bg-white text-slate-900 text-sm sm:text-base font-medium rounded-xl border transition-all duration-150',
              'placeholder:text-slate-400 placeholder:font-normal',
              'focus:outline-none focus:ring-3 focus:ring-[#8B1A1A]/15 focus:border-[#8B1A1A]',
              Icon ? 'pl-10 pr-3.5' : 'px-3.5',
              error ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// ==========================================
// ACCESSIBLE SELECT FIELD
// ==========================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const AccessibleSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, children, className, id, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1.5">
        <label htmlFor={selectId} className="block text-xs sm:text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-600 text-xs font-bold ml-0.5">*</span>}
        </label>

        <select
          id={selectId}
          ref={ref}
          required={required}
          aria-invalid={!!error}
          className={clsx(
            'w-full h-11 bg-white text-slate-900 text-sm sm:text-base font-medium rounded-xl border px-3.5 transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:ring-3 focus:ring-[#8B1A1A]/15 focus:border-[#8B1A1A]',
            error ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-sm py-1">
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

// ==========================================
// ACCESSIBLE CARD
// ==========================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  withTopAccent?: boolean;
  onClick?: () => void;
}

export const AccessibleCard: React.FC<CardProps> = ({
  children,
  className,
  withTopAccent = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 lg:p-6 shadow-sm transition-all duration-200',
        withTopAccent && 'tamil-accent-top',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-card-hover',
        className
      )}
    >
      {children}
    </div>
  );
};

// ==========================================
// ACCESSIBLE BANNER
// ==========================================
interface BannerProps {
  type?: 'success' | 'warning' | 'danger' | 'info';
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

export const AccessibleBanner: React.FC<BannerProps> = ({
  type,
  variant = 'info',
  title,
  message,
  className,
  onClose,
}) => {
  const actualType = type || variant;
  const getConfig = () => {
    switch (actualType) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      case 'danger':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900',
          icon: AlertCircle,
          iconColor: 'text-red-600',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: Info,
          iconColor: 'text-blue-600',
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start justify-between gap-3 p-4 sm:p-5 rounded-2xl border shadow-sm',
        config.bg,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={clsx('h-5 w-5 shrink-0 stroke-[2.2] mt-0.5', config.iconColor)} aria-hidden="true" />
        <div>
          {title && <h4 className="text-sm sm:text-base font-bold leading-snug">{title}</h4>}
          <p className="text-xs sm:text-sm font-medium leading-relaxed mt-0.5 opacity-90">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors font-bold text-sm text-slate-500"
          aria-label="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ==========================================
// ACCESSIBLE EMPTY STATE
// ==========================================
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const AccessibleEmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 my-4">
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[#8B1A1A] mb-3.5 shadow-sm">
        <Icon className="h-8 w-8 stroke-[1.8]" aria-hidden="true" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <div className="mt-5">
          <AccessibleButton variant="primary" icon={actionIcon} onClick={onAction}>
            {actionText}
          </AccessibleButton>
        </div>
      )}
    </div>
  );
};
