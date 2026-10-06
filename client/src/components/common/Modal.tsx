import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* High contrast Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={clsx(
          'relative w-full overflow-hidden rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-modal transition-all my-6 z-10 flex flex-col max-h-[92vh]',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Tamil Culture Decorative Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B1A1A] via-[#8B1A1A] to-[#B7791F]" />

        {/* Header with High-Contrast Clear Labeled Close Button */}
        <div className="flex items-center justify-between border-b-2 border-[#EDE7DE] px-6 py-5 bg-[#FAF7F2] shrink-0">
          <div className="pr-4">
            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-base font-semibold text-[#52525B] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F3EFEA] text-[#1A1A1A] font-bold text-base border-2 border-[#D6CFC4] hover:border-[#8B1A1A] shadow-sm transition-all shrink-0 min-h-[44px]"
          >
            <X className="h-5 w-5 text-[#8B1A1A] stroke-[2.5]" />
            <span>Close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto text-base text-[#1A1A1A] leading-relaxed bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};
