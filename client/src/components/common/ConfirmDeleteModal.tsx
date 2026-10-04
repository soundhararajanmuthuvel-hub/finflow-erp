import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">{message}</p>
        </div>

        {itemDescription && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300">
            {itemDescription}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
