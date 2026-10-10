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
      <div className="space-y-5">
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0 stroke-[2] mt-0.5 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900">Warning: Destructive Action</h3>
            <p className="mt-0.5 text-xs sm:text-sm font-medium leading-relaxed text-red-700">{message}</p>
          </div>
        </div>

        {itemDescription && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800">
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Target Record:</span>
            {itemDescription}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4 stroke-[2]" />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 stroke-[2]" />
            <span>{isLoading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
