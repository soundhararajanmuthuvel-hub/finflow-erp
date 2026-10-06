import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Receipt, Search, Plus, Trash2, Calendar, CreditCard, User } from 'lucide-react';
import apiClient from '../../api/client';
import { RecordRepaymentModal } from './RecordRepaymentModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  AccessibleButton,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const RepaymentList: React.FC = () => {
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Repayments & Collections
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
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
      <div className="hidden md:block rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-4 px-6 text-sm uppercase">Receipt #</th>
                <th className="py-4 px-6 text-sm uppercase">Deal #</th>
                <th className="py-4 px-6 text-sm uppercase">Client Name</th>
                <th className="py-4 px-6 text-sm uppercase">Payment Date</th>
                <th className="py-4 px-6 text-sm uppercase">Total Received</th>
                <th className="py-4 px-6 text-sm uppercase">Principal Split</th>
                <th className="py-4 px-6 text-sm uppercase">Interest Split</th>
                <th className="py-4 px-6 text-sm uppercase">Payment Mode</th>
                <th className="py-4 px-6 text-sm uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-lg font-bold text-[#52525B]">
                    Loading repayments...
                  </td>
                </tr>
              ) : repayments?.length > 0 ? (
                repayments.map((r: any, index: number) => (
                  <tr
                    key={r.repaymentId}
                    className={`hover:bg-[#FAF7F2] transition-colors ${
                      index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
                  >
                    <td className="py-5 px-6 font-mono font-bold text-[#8B1A1A] text-lg flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-[#8B1A1A] shrink-0 stroke-[2.3]" />
                      <span>{r.receiptNumber}</span>
                    </td>
                    <td className="py-5 px-6 font-mono font-bold text-[#1A1A1A] text-lg">
                      {r.dealNumber}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1A1A1A]">
                      {r.clientName}
                    </td>
                    <td className="py-5 px-6 text-[#52525B] font-semibold">
                      {formatDate(r.paymentDate)}
                    </td>
                    <td className="py-5 px-6 font-extrabold text-xl text-[#1F6B3A]">
                      {formatCurrency(r.amountReceived)}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1A1A1A]">
                      {formatCurrency(r.principalPortion)}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1F6B3A]">
                      {formatCurrency(r.interestPortion)}
                    </td>
                    <td className="py-5 px-6">
                      <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#D6CFC4] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button
                        title="Void / Reverse Repayment"
                        onClick={(e) => handleOpenDelete(r, e)}
                        className="h-11 px-3 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#FECACA] hover:border-[#B91C1C] font-bold text-sm inline-flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Trash2 className="h-4 w-4 stroke-[2.3]" />
                        <span>Void</span>
                      </button>
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
          <div className="p-8 text-center text-lg font-bold text-[#52525B]">
            Loading repayments...
          </div>
        ) : repayments?.length > 0 ? (
          repayments.map((r: any) => (
            <AccessibleCard key={r.repaymentId} className="p-5">
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#EDE7DE]">
                <div>
                  <span className="font-mono text-base font-bold text-[#8B1A1A] block">
                    {r.receiptNumber}
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mt-0.5">{r.clientName}</h3>
                  <p className="text-sm font-semibold text-[#52525B] mt-0.5">
                    Deal #{r.dealNumber} • Paid: {formatDate(r.paymentDate)}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#D6CFC4] text-xs font-bold text-[#1A1A1A] uppercase">
                  {r.paymentMethod}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-[#EDE7DE] text-base">
                <div>
                  <p className="text-sm font-bold text-[#1F6B3A] uppercase">Total Received</p>
                  <p className="text-xl font-extrabold text-[#1F6B3A] mt-0.5">
                    {formatCurrency(r.amountReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Principal Portion</p>
                  <p className="text-lg font-bold text-[#1A1A1A] mt-0.5">
                    {formatCurrency(r.principalPortion)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1F6B3A] uppercase">Interest Portion</p>
                  <p className="text-lg font-bold text-[#1F6B3A] mt-0.5">
                    {formatCurrency(r.interestPortion)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Recorded By</p>
                  <p className="text-base font-semibold text-[#1A1A1A] mt-0.5">
                    {r.recordedBy || 'Admin'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  onClick={(e) => handleOpenDelete(r, e)}
                  className="h-12 px-5 rounded-xl bg-white border-2 border-[#FECACA] text-[#B91C1C] font-bold text-base flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="h-5 w-5" />
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
