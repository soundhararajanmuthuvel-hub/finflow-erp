import React from 'react';
import { Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { AccessibleButton } from './AccessibleComponents';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissForever?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onDismissForever,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install FinFlow on iPhone / iPad"
      subtitle="Access FinFlow anytime directly from your Home Screen with fast standalone performance"
      maxWidth="md"
    >
      <div className="space-y-5 py-2">
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex items-center gap-3.5">
          <img
            src="/brand/finflow-logo.svg"
            alt="FinFlow App Icon"
            className="h-12 w-12 rounded-xl object-contain shadow-sm shrink-0"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.endsWith('.svg')) {
                target.src = '/brand/pwa-192x192.png';
              }
            }}
          />
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">FinFlow ERP</h4>
            <p className="text-xs text-purple-900 font-medium mt-0.5">
              Private Finance Management • Product by MSR Solutions
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick 3-Step Safari Installation:
          </p>

          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="h-7 w-7 rounded-lg bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="text-xs sm:text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Tap the Share Button</p>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                At the bottom of your Safari browser, tap the <Share className="h-4 w-4 inline text-blue-600" /> Share icon.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="h-7 w-7 rounded-lg bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="text-xs sm:text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Select "Add to Home Screen"</p>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                Scroll down in the share menu and tap <PlusSquare className="h-4 w-4 inline text-slate-800" /> <span className="font-semibold">Add to Home Screen</span>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="h-7 w-7 rounded-lg bg-[#8B1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="text-xs sm:text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Confirm by Tapping "Add"</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Tap <span className="font-bold text-blue-600">Add</span> in the top-right corner. FinFlow will appear as an app icon on your home screen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <AccessibleButton
            variant="outline"
            size="normal"
            onClick={onDismissForever || onClose}
          >
            Don't show again
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            size="normal"
            onClick={onClose}
          >
            Got it
          </AccessibleButton>
        </div>
      </div>
    </Modal>
  );
};

export default PWAInstallModal;
