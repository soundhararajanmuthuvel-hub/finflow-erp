import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Receipt, Search, Plus, Trash2, Edit2, Calendar, CreditCard, User } from 'lucide-react';
import apiClient from '../../api/client';
import { RecordRepaymentModal } from './RecordRepaymentModal';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const RepaymentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repaymentToDelete, setRepaymentToDelete] = useState<any>(null);
  const [repaymentToEdit, setRepaymentToEdit] = useState<any>(null);

  // Edit form state
  const [editPaymentMethod, setEditPaymentMethod] = useState('BANK_TRANSFER');
  const [editReferenceNumber, setEditReferenceNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: repayments, isLoading, refetch } = useQuery({
    queryKey: ['repayments', searchTerm],
    queryFn: async () => {
      const res: any = await apiClient.get(`/reports/collections`);
      return res.data || [];
    },
  });

  const updateRepaymentMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/repayments/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setRepaymentToEdit(null);
      refetch();
    },
  });

  const deleteRepaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/repayments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setRepaymentToDelete(null);
      refetch();
    },
  });

  const handleOpenEdit = (r: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRepaymentToEdit(r);
    setEditPaymentMethod(r.paymentMethod || 'BANK_TRANSFER');
    setEditReferenceNumber(r.referenceNumber || '');
    setEditNotes(r.notes || '');
  };

  const handleOpenDelete = (r: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRepaymentToDelete(r);
  };

  const handleUpdateRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentToEdit) return;
    updateRepaymentMutation.mutate({
      id: repaymentToEdit.repaymentId,
      payload: {
        paymentMethod: editPaymentMethod,
        referenceNumber: editReferenceNumber,
        notes: editNotes,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Repayments & Collections
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Browse collected client receipts, principal/interest splits, and void payment entries
          </p>
        </div>
        <AccessibleButton
          variant="primary"
          size="normal"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Record Repayment
        </AccessibleButton>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Receipt #</th>
                <th className="py-3 px-5">Deal #</th>
                <th className="py-3 px-5">Client Name</th>
                <th className="py-3 px-5">Payment Date</th>
                <th className="py-3 px-5">Total Received</th>
                <th className="py-3 px-5">Principal Split</th>
                <th className="py-3 px-5">Interest Split</th>
                <th className="py-3 px-5">Payment Mode</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm font-medium text-slate-500">
                    Loading repayments...
                  </td>
                </tr>
              ) : repayments?.length > 0 ? (
                repayments.map((r: any) => (
                  <tr
                    key={r.repaymentId}
                    className="hover:bg-slate-50/80 transition-colors bg-white"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#8B1A1A] text-sm flex items-center gap-2 whitespace-nowrap">
                      <Receipt className="h-4 w-4 text-[#8B1A1A] shrink-0" />
                      <span>{r.receiptNumber}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-800 text-sm whitespace-nowrap">
                      {r.dealNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-slate-900">
                      {r.clientName}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs sm:text-sm whitespace-nowrap">
                      {formatDate(r.paymentDate)}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-sm text-emerald-700 whitespace-nowrap">
                      {formatCurrency(r.amountReceived)}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-sm text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.principalPortion)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-emerald-700 whitespace-nowrap">
                      {formatCurrency(r.interestPortion)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Edit Repayment Metadata"
                          onClick={(e) => handleOpenEdit(r, e)}
                          className="h-8 px-2.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-300 font-medium text-xs inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Void / Reverse Repayment"
                          onClick={(e) => handleOpenDelete(r, e)}
                          className="h-8 px-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-medium text-xs inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Void</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12">
                    <AccessibleEmptyState
                      icon={Receipt}
                      title="No repayments collected yet"
                      description="Record incoming weekly or monthly client repayments."
                      actionText="Record Repayment"
                      onAction={() => setIsModalOpen(true)}
                      actionIcon={Plus}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Card View (<768px) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-sm font-medium text-slate-500">
            Loading repayments...
          </div>
        ) : repayments?.length > 0 ? (
          repayments.map((r: any) => (
            <AccessibleCard key={r.repaymentId} className="p-5">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-semibold text-[#8B1A1A] block">
                    {r.receiptNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{r.clientName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deal #{r.dealNumber} • Paid: {formatDate(r.paymentDate)}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                  {r.paymentMethod}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 py-3.5 border-b border-slate-100 text-sm">
                <div>
                  <p className="text-xs font-medium text-emerald-700">Total Received</p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(r.amountReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Principal Portion</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 whitespace-nowrap">
                    {formatCurrency(r.principalPortion)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700">Interest Portion</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(r.interestPortion)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Recorded By</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {r.recordedBy || 'Admin'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={(e) => handleOpenEdit(r, e)}
                  className="h-9 px-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-stone-50"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => handleOpenDelete(r, e)}
                  className="h-9 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Void Payment</span>
                </button>
              </div>
            </AccessibleCard>
          ))
        ) : (
          <AccessibleEmptyState
            icon={Receipt}
            title="No repayments found"
            description="Record incoming client repayments."
            actionText="Record Repayment"
            onAction={() => setIsModalOpen(true)}
            actionIcon={Plus}
          />
        )}
      </div>

      <RecordRepaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />

      {/* Edit Repayment Metadata Modal */}
      {repaymentToEdit && (
        <Modal
          isOpen={!!repaymentToEdit}
          onClose={() => setRepaymentToEdit(null)}
          title={`Edit Repayment Details — ${repaymentToEdit.receiptNumber}`}
          subtitle={`Deal ${repaymentToEdit.dealNumber} • Collected: ${formatCurrency(repaymentToEdit.amountReceived)}`}
        >
          <form onSubmit={handleUpdateRepayment} className="space-y-5">
            <AccessibleSelect
              label="Payment Method / Mode"
              value={editPaymentMethod}
              onChange={(e) => setEditPaymentMethod(e.target.value)}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT / IMPS' },
                { value: 'UPI', label: 'UPI' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />

            <AccessibleInput
              label="Transaction Reference / Cheque #"
              value={editReferenceNumber}
              onChange={(e) => setEditReferenceNumber(e.target.value)}
              placeholder="UTR / Ref Number"
            />

            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1.5">
                Notes & Remarks
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Collection notes..."
                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
              <AccessibleButton
                type="button"
                variant="outline"
                onClick={() => setRepaymentToEdit(null)}
              >
                Cancel
              </AccessibleButton>
              <AccessibleButton
                type="submit"
                variant="primary"
                isLoading={updateRepaymentMutation.isPending}
              >
                Save Changes
              </AccessibleButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Void Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!repaymentToDelete}
        onClose={() => setRepaymentToDelete(null)}
        onConfirm={() => deleteRepaymentMutation.mutate(repaymentToDelete?.repaymentId)}
        isLoading={deleteRepaymentMutation.isPending}
        title="Void & Reverse Repayment"
        message="Are you sure you want to void this repayment? The schedule balances, contract outstanding totals, and general ledger journal transactions will be automatically reversed."
        itemDescription={
          repaymentToDelete
            ? `Receipt ${repaymentToDelete.receiptNumber}: ${formatCurrency(
                repaymentToDelete.amountReceived
              )} for Deal ${repaymentToDelete.dealNumber}`
            : undefined
        }
      />
    </div>
  );
};

export default RepaymentList;
