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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Finance Deals Master
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
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
      <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-warm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#52525B] stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search by Deal #, Client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-[#FAF7F2] border-2 border-[#A8A29E] focus:border-[#8B1A1A] focus:ring-3 focus:ring-[#8B1A1A]/20 rounded-xl pl-13 pr-4 text-lg font-medium text-[#1A1A1A] placeholder-[#71717A] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-6 w-6 text-[#8B1A1A] shrink-0 stroke-[2.3]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-14 bg-[#FAF7F2] border-2 border-[#A8A29E] focus:border-[#8B1A1A] rounded-xl px-4 text-lg font-bold text-[#1A1A1A] cursor-pointer w-full md:w-auto"
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
      <div className="hidden md:block rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-4 px-6 text-base font-bold">Deal Number</th>
                <th className="py-4 px-6 text-base font-bold">Client Name</th>
                <th className="py-4 px-6 text-base font-bold">Finance Amount</th>
                <th className="py-4 px-6 text-base font-bold">Total Repaid</th>
                <th className="py-4 px-6 text-base font-bold">Outstanding</th>
                <th className="py-4 px-6 text-base font-bold">Installment</th>
                <th className="py-4 px-6 text-base font-bold">Status</th>
                <th className="py-4 px-6 text-base font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-lg font-bold text-[#52525B]">
                    Loading finance deals...
                  </td>
                </tr>
              ) : deals?.length > 0 ? (
                deals.map((d: any, index: number) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className={`cursor-pointer hover:bg-[#FAF7F2] transition-colors ${
                      index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
                  >
                    <td className="py-5 px-6 font-mono font-bold text-[#8B1A1A] text-lg flex items-center gap-2 whitespace-nowrap">
                      <Briefcase className="h-5 w-5 text-[#8B1A1A] shrink-0 stroke-[2.3]" />
                      <span>{d.dealNumber}</span>
                      {(d.notes?.includes('DEMO') || d.purpose?.includes('DEMO') || d.dealNumber === 'FIN-000001') && (
                        <span className="text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                          Demo
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-bold text-lg text-[#1A1A1A]">{d.client?.fullName}</p>
                      <p className="text-sm font-semibold text-[#52525B] mt-0.5">
                        {d.client?.businessName || d.client?.phone}
                      </p>
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1A1A1A] whitespace-nowrap">
                      {formatCurrency(d.financeAmountApproved)}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1F6B3A] whitespace-nowrap">
                      {formatCurrency(Number(d.totalPrincipalRepaid || 0) + Number(d.totalInterestRepaid || 0))}
                    </td>
                    <td className="py-5 px-6 font-extrabold text-lg text-[#B45309] whitespace-nowrap">
                      {formatCurrency(d.outstandingTotal)}
                    </td>
                    <td className="py-5 px-6 text-[#1A1A1A] font-bold whitespace-nowrap">
                      {formatCurrency(d.installmentAmount)}
                      <span className="text-xs text-[#52525B] font-medium block">
                        /{d.repaymentFrequency?.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-5 px-6 whitespace-nowrap">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-5 px-6 text-right whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="Edit Deal"
                          onClick={(e) => handleOpenEdit(d, e)}
                          className="h-11 px-3 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#1E3A8A] border-2 border-[#D6CFC4] hover:border-[#1E3A8A] font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Edit2 className="h-4 w-4 stroke-[2.3]" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete Deal"
                          onClick={(e) => handleOpenDelete(d, e)}
                          className="h-11 px-3 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#FECACA] hover:border-[#B91C1C] font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Trash2 className="h-4 w-4 stroke-[2.3]" />
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
          <div className="p-8 text-center text-lg font-bold text-[#52525B]">
            Loading deals...
          </div>
        ) : deals?.length > 0 ? (
          deals.map((d: any) => (
            <AccessibleCard
              key={d.id}
              onClick={() => navigate(`/deals/${d.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#EDE7DE]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#8B1A1A]">
                      {d.dealNumber}
                    </span>
                    {(d.notes?.includes('DEMO') || d.purpose?.includes('DEMO') || d.dealNumber === 'FIN-000001') && (
                      <span className="text-[10px] font-black text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                        DEMO
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mt-1">{d.client?.fullName}</h3>
                  <p className="text-sm font-semibold text-[#52525B]">
                    {d.client?.businessName || d.client?.phone}
                  </p>
                </div>
                <StatusBadge status={d.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-[#EDE7DE] text-base">
                <div>
                  <p className="text-sm font-bold text-[#3F3F46]">Finance Amount</p>
                  <p className="text-lg font-bold text-[#1A1A1A] mt-0.5 whitespace-nowrap">
                    {formatCurrency(d.financeAmountApproved)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#B45309]">Outstanding</p>
                  <p className="text-lg font-extrabold text-[#B45309] mt-0.5 whitespace-nowrap">
                    {formatCurrency(d.outstandingTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1F6B3A]">Total Repaid</p>
                  <p className="text-base font-bold text-[#1F6B3A] mt-0.5 whitespace-nowrap">
                    {formatCurrency(Number(d.totalPrincipalRepaid || 0) + Number(d.totalInterestRepaid || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3F3F46]">Installment</p>
                  <p className="text-base font-bold text-[#1A1A1A] mt-0.5 whitespace-nowrap">
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
                    className="h-12 px-4 rounded-xl bg-white border-2 border-[#D6CFC4] text-[#1E3A8A] font-bold text-base flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(d, e)}
                    className="h-12 px-4 rounded-xl bg-white border-2 border-[#FECACA] text-[#B91C1C] font-bold text-base flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
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

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t-2 border-[#EDE7DE]">
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
