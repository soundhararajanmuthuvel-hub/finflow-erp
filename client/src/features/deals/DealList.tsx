import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Briefcase,
  Edit2,
  Trash2,
  Receipt,
  User,
  Clock,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';
import { formatCurrency } from '../../utils/formatters';

export const DealList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<any>(null);
  const [dealToDelete, setDealToDelete] = useState<any>(null);

  // Edit form state
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  const { data: deals, isLoading, refetch } = useQuery({
    queryKey: ['deals', statusFilter, searchTerm],
    queryFn: async () => {
      let url = '/deals?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      const res: any = await apiClient.get(url);
      return res.data || [];
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/deals/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setDealToEdit(null);
      refetch();
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/deals/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setDealToDelete(null);
      refetch();
    },
  });

  const handleOpenEdit = (deal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDealToEdit(deal);
    setPurpose(deal.purpose || '');
    setNotes(deal.notes || '');
    setStatus(deal.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (deal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDealToDelete(deal);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealToEdit) return;
    updateDealMutation.mutate({
      id: dealToEdit.id,
      payload: {
        purpose,
        notes,
        status,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Finance Deals Master
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Manage syndication contracts, funding sources, and collection status
          </p>
        </div>
        <AccessibleButton
          variant="primary"
          size="normal"
          icon={Plus}
          onClick={() => navigate('/deals/new')}
        >
          New Finance Deal
        </AccessibleButton>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search by Deal #, Client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 rounded-xl pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-500 shrink-0 stroke-[2.2]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#8B1A1A] rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer w-full md:w-auto outline-none"
          >
            <option value="">All Deal Statuses</option>
            <option value="ACTIVE">Active Deals</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Desktop / Tablet High-Contrast Table */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Deal Number</th>
                <th className="py-3 px-5">Client Name</th>
                <th className="py-3 px-5">Finance Amount</th>
                <th className="py-3 px-5">Total Repaid</th>
                <th className="py-3 px-5">Outstanding</th>
                <th className="py-3 px-5">Installment</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm font-medium text-slate-500">
                    Loading finance deals...
                  </td>
                </tr>
              ) : deals?.length > 0 ? (
                deals.map((d: any, index: number) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors bg-white"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#8B1A1A] text-sm flex items-center gap-2 whitespace-nowrap">
                      <Briefcase className="h-4 w-4 text-[#8B1A1A] shrink-0" />
                      <span>{d.dealNumber}</span>
                      {(d.notes?.includes('DEMO') || d.purpose?.includes('DEMO') || d.dealNumber === 'FIN-000001') && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Demo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-sm text-slate-900">{d.client?.fullName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.client?.businessName || d.client?.phone}
                      </p>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-slate-900 whitespace-nowrap">
                      {formatCurrency(d.financeAmountApproved)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-emerald-700 whitespace-nowrap">
                      {formatCurrency(Number(d.totalPrincipalRepaid || 0) + Number(d.totalInterestRepaid || 0))}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-sm text-amber-700 whitespace-nowrap">
                      {formatCurrency(d.outstandingTotal)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-900 font-medium text-sm whitespace-nowrap">
                      {formatCurrency(d.installmentAmount)}
                      <span className="text-xs text-slate-500 block">
                        /{d.repaymentFrequency?.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="Edit Deal"
                          onClick={(e) => handleOpenEdit(d, e)}
                          className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete Deal"
                          onClick={(e) => handleOpenDelete(d, e)}
                          className="h-8 px-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12">
                    <AccessibleEmptyState
                      icon={Briefcase}
                      title="No finance deals found"
                      description="Create your first finance deal to structure funding and repayment schedules."
                      actionText="Create Finance Deal"
                      onAction={() => navigate('/deals/new')}
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
            Loading deals...
          </div>
        ) : deals?.length > 0 ? (
          deals.map((d: any) => (
            <AccessibleCard
              key={d.id}
              onClick={() => navigate(`/deals/${d.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#8B1A1A]">
                      {d.dealNumber}
                    </span>
                    {(d.notes?.includes('DEMO') || d.purpose?.includes('DEMO') || d.dealNumber === 'FIN-000001') && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        DEMO
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{d.client?.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    {d.client?.businessName || d.client?.phone}
                  </p>
                </div>
                <StatusBadge status={d.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3.5 py-3.5 border-b border-slate-100 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">Finance Amount</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 whitespace-nowrap">
                    {formatCurrency(d.financeAmountApproved)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700">Outstanding</p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(d.outstandingTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700">Total Repaid</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(Number(d.totalPrincipalRepaid || 0) + Number(d.totalInterestRepaid || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Installment</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5 whitespace-nowrap">
                    {formatCurrency(d.installmentAmount)} / {d.repaymentFrequency?.toLowerCase()}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-2 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(d, e)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(d, e)}
                    className="h-9 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <AccessibleButton
                  variant="secondary"
                  size="compact"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate(`/deals/${d.id}`)}
                >
                  View Deal
                </AccessibleButton>
              </div>
            </AccessibleCard>
          ))
        ) : (
          <AccessibleEmptyState
            icon={Briefcase}
            title="No finance deals found"
            description="Create your first finance deal to structure funding."
            actionText="Create Finance Deal"
            onAction={() => navigate('/deals/new')}
            actionIcon={Plus}
          />
        )}
      </div>

      {/* Edit Deal Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Finance Deal"
        subtitle={`Updating status and metadata for ${dealToEdit?.dealNumber}`}
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <AccessibleInput
            label="Deal Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Working Capital / Inventory Purchase"
          />

          <AccessibleSelect
            label="Deal Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'DRAFT', label: 'DRAFT' },
              { value: 'PENDING_APPROVAL', label: 'PENDING_APPROVAL' },
              { value: 'APPROVED', label: 'APPROVED' },
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'COMPLETED', label: 'COMPLETED' },
              { value: 'OVERDUE', label: 'OVERDUE' },
              { value: 'DEFAULTED', label: 'DEFAULTED' },
              { value: 'CANCELLED', label: 'CANCELLED' },
            ]}
          />

          <div className="space-y-2">
            <label className="block text-base sm:text-lg font-bold text-[#1A1A1A]">
              Internal Notes / Covenants
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special covenants, collateral notes, or borrower terms..."
              className="w-full bg-white text-[#1A1A1A] text-lg font-medium rounded-xl border-2 border-[#A8A29E] focus:border-[#8B1A1A] focus:ring-4 focus:ring-[#8B1A1A]/20 p-4 transition-all"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type="submit"
              variant="primary"
              isLoading={updateDealMutation.isPending}
            >
              Save Changes
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={() => deleteDealMutation.mutate(dealToDelete?.id)}
        isLoading={deleteDealMutation.isPending}
        title="Delete Finance Deal"
        message="Are you sure you want to permanently delete this finance deal? All associated schedules, funding commitments, and records will be deleted."
        itemDescription={
          dealToDelete
            ? `${dealToDelete.dealNumber}: ${dealToDelete.client?.fullName} (${formatCurrency(
                dealToDelete.financeAmountApproved
              )})`
            : undefined
        }
      />
    </div>
  );
};

export default DealList;
