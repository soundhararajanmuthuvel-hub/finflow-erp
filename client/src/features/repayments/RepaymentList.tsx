import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Receipt, Search, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { RecordRepaymentModal } from './RecordRepaymentModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const RepaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repaymentToDelete, setRepaymentToDelete] = useState<any>(null);

  const { data: repayments, isLoading, refetch } = useQuery({
    queryKey: ['repayments', searchTerm],
    queryFn: async () => {
      const res: any = await apiClient.get(`/reports/collections`);
      return res.data || [];
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

  const handleOpenDelete = (r: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRepaymentToDelete(r);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Repayments & Collections</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse collected receipts, principal/interest splits, and manage/void payments
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Record Repayment</span>
        </button>
      </div>

      {/* Repayments Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Receipt Number</th>
                <th className="py-3.5 px-5">Deal Number</th>
                <th className="py-3.5 px-5">Client Name</th>
                <th className="py-3.5 px-5">Payment Date</th>
                <th className="py-3.5 px-5">Total Received</th>
                <th className="py-3.5 px-5">Principal Settled</th>
                <th className="py-3.5 px-5">Interest Collected</th>
                <th className="py-3.5 px-5">Method</th>
                <th className="py-3.5 px-5">Recorded By</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Loading repayments...
                  </td>
                </tr>
              ) : repayments?.length > 0 ? (
                repayments.map((r: any) => (
                  <tr key={r.repaymentId} className="hover:bg-slate-950/40">
                    <td className="py-4 px-5 font-mono font-bold text-emerald-400 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-400" />
                      <span>{r.receiptNumber}</span>
                    </td>
                    <td className="py-4 px-5 font-mono font-semibold text-white">{r.dealNumber}</td>
                    <td className="py-4 px-5 font-bold text-white">{r.clientName}</td>
                    <td className="py-4 px-5">{formatDate(r.paymentDate)}</td>
                    <td className="py-4 px-5 font-bold text-white">{formatCurrency(r.amountReceived)}</td>
                    <td className="py-4 px-5 text-slate-300">{formatCurrency(r.principalPortion)}</td>
                    <td className="py-4 px-5 text-emerald-400 font-semibold">{formatCurrency(r.interestPortion)}</td>
                    <td className="py-4 px-5 uppercase text-slate-400">{r.paymentMethod}</td>
                    <td className="py-4 px-5 text-slate-400">{r.recordedBy}</td>
                    <td className="py-4 px-5 text-right">
                      <button
                        title="Void / Delete Repayment"
                        onClick={(e) => handleOpenDelete(r, e)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No repayments collected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordRepaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />

      {/* Delete / Void Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!repaymentToDelete}
        onClose={() => setRepaymentToDelete(null)}
        onConfirm={() => deleteRepaymentMutation.mutate(repaymentToDelete?.repaymentId)}
        isLoading={deleteRepaymentMutation.isPending}
        title="Void & Reverse Repayment"
        message="Are you sure you want to void this repayment? The schedule balances, contract outstanding totals, and general ledger journal transactions will be automatically reversed."
        itemDescription={repaymentToDelete ? `Receipt ${repaymentToDelete.receiptNumber}: ${formatCurrency(repaymentToDelete.amountReceived)} for Deal ${repaymentToDelete.dealNumber}` : undefined}
      />
    </div>
  );
};
