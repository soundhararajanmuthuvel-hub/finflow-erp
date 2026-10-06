import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  itemDescription?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  itemDescription,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FEE2E2] border-2 border-[#FECACA] text-[#B91C1C]">
          <AlertTriangle className="h-8 w-8 shrink-0 stroke-[2.2] mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#B91C1C]">Warning: Destructive Action</h3>
            <p className="mt-1 text-base font-semibold leading-relaxed text-[#7F1D1D]">{message}</p>
          </div>
        </div>

        {itemDescription && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4] text-base font-semibold text-[#1A1A1A]">
            <span className="text-sm font-bold text-[#52525B] block mb-1">Target Record:</span>
            {itemDescription}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t-2 border-[#EDE7DE]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-14 px-6 rounded-xl text-base font-bold text-[#1A1A1A] bg-white hover:bg-[#FAF7F2] border-2 border-[#D6CFC4] shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
            <span>Cancel (Keep Safe)</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-14 px-7 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 stroke-[2.5]" />
            <span>{isLoading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
