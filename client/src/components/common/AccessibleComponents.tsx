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
        return 'bg-[#8B1A1A] hover:bg-[#6E1414] active:bg-[#4A0B0B] text-white border-2 border-[#8B1A1A] shadow-md shadow-[#8B1A1A]/20';
      case 'secondary':
        return 'bg-white hover:bg-[#FAF7F2] active:bg-[#F3EFEA] text-[#1A1A1A] border-2 border-[#8B1A1A] shadow-sm';
      case 'outline':
        return 'bg-white hover:bg-[#FAF7F2] active:bg-[#F3EFEA] text-[#1A1A1A] border-2 border-[#D6CFC4] shadow-sm hover:border-[#8B1A1A]';
      case 'danger':
        return 'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white border-2 border-[#B91C1C] shadow-md shadow-[#B91C1C]/20';
      case 'success':
        return 'bg-[#1F6B3A] hover:bg-[#16532D] active:bg-[#14532D] text-white border-2 border-[#1F6B3A] shadow-md shadow-[#1F6B3A]/20';
      case 'subtle':
        return 'bg-[#EDE7DE] hover:bg-[#D6CFC4] text-[#1A1A1A] border-2 border-transparent';
      default:
        return 'bg-[#8B1A1A] text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'large':
        return 'h-16 px-8 text-xl font-bold gap-3 rounded-2xl';
      case 'compact':
        return 'min-h-[48px] px-4 py-2 text-base font-bold gap-2 rounded-xl';
      case 'normal':
      default:
        return 'h-14 px-6 text-lg font-bold gap-2.5 rounded-xl';
    }
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComp = Icon as LucideIcon;
    return <IconComp className="h-6 w-6 shrink-0 stroke-[2.3]" aria-hidden="true" />;
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
        <span className="inline-block h-6 w-6 border-3 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        iconPosition === 'left' && renderIcon()
      )}
      <span>{children}</span>
      {!isLoading && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

// ==========================================
// ACCESSIBLE INPUT FIELD (56px, visible label, 2px border)
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
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-base sm:text-lg font-bold text-[#1A1A1A]">
            {label} {required && <span className="text-[#B91C1C] text-sm font-bold ml-1">(Required)</span>}
          </label>
        </div>

        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#52525B]">
              <Icon className="h-6 w-6 stroke-[2]" aria-hidden="true" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={clsx(
              'w-full h-14 bg-white text-[#1A1A1A] text-lg font-medium rounded-xl border-2 transition-all duration-150',
              'placeholder:text-[#71717A] placeholder:font-normal',
              'focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]',
              Icon ? 'pl-13 pr-4' : 'px-4',
              error ? 'border-[#B91C1C] bg-[#FEF2F2]' : 'border-[#A8A29E] hover:border-[#52525B]',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="flex items-center gap-1.5 text-base font-bold text-[#B91C1C]">
            <AlertCircle className="h-5 w-5 shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm font-semibold text-[#52525B]">
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
      <div className="w-full space-y-2">
        <label htmlFor={selectId} className="block text-base sm:text-lg font-bold text-[#1A1A1A]">
          {label} {required && <span className="text-[#B91C1C] text-sm font-bold ml-1">(Required)</span>}
        </label>

        <select
          id={selectId}
          ref={ref}
          required={required}
          aria-invalid={!!error}
          className={clsx(
            'w-full h-14 bg-white text-[#1A1A1A] text-lg font-medium rounded-xl border-2 px-4 transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]',
            error ? 'border-[#B91C1C] bg-[#FEF2F2]' : 'border-[#A8A29E] hover:border-[#52525B]',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-lg py-2">
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error && (
          <p className="flex items-center gap-1.5 text-base font-bold text-[#B91C1C]">
            <AlertCircle className="h-5 w-5 shrink-0 stroke-[2.5]" />
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
        'relative bg-white rounded-2xl border-2 border-[#D6CFC4] p-6 sm:p-8 shadow-warm transition-all duration-200',
        withTopAccent && 'tamil-accent-top',
        onClick && 'cursor-pointer hover:border-[#8B1A1A] hover:shadow-warm-lg',
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
          bg: 'bg-[#EAF5EE] border-[#A7D9B7] text-[#1F6B3A]',
          icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]',
          icon: AlertTriangle,
        };
      case 'danger':
        return {
          bg: 'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]',
          icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E3A8A]',
          icon: Info,
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start justify-between gap-3.5 p-5 rounded-2xl border-2 shadow-sm',
        config.bg,
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <IconComponent className="h-7 w-7 shrink-0 stroke-[2.3] mt-0.5" aria-hidden="true" />
        <div>
          {title && <h4 className="text-lg font-bold leading-snug">{title}</h4>}
          <p className="text-base font-semibold leading-relaxed mt-0.5">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors font-bold text-base"
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
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-2xl border-2 border-dashed border-[#D6CFC4] my-4">
      <div className="p-4 rounded-2xl bg-[#FAF7F2] border-2 border-[#EDE7DE] text-[#8B1A1A] mb-4 shadow-sm">
        <Icon className="h-10 w-10 stroke-[2]" aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{title}</h3>
      <p className="mt-2 text-base sm:text-lg font-medium text-[#52525B] max-w-md leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <div className="mt-6">
          <AccessibleButton variant="primary" icon={actionIcon} onClick={onAction}>
            {actionText}
          </AccessibleButton>
        </div>
      )}
    </div>
  );
};
