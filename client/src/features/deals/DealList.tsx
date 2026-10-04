import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpRight, Briefcase, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Finance Deals Master</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage syndication contracts, funding sources, and collection status
          </p>
        </div>
        <button
          onClick={() => navigate('/deals/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Finance Deal</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Deal #, Client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Deal Number</th>
                <th className="py-3.5 px-5">Client Name</th>
                <th className="py-3.5 px-5">Finance Amount</th>
                <th className="py-3.5 px-5">Total Repaid</th>
                <th className="py-3.5 px-5">Outstanding</th>
                <th className="py-3.5 px-5">Installment</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading deals...
                  </td>
                </tr>
              ) : deals?.length > 0 ? (
                deals.map((d: any) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className="hover:bg-slate-950/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-white flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{d.dealNumber}</span>
                      {(d.notes?.includes('DEMO') || d.purpose?.includes('DEMO') || d.dealNumber === 'FIN-000001') && (
                        <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-white">{d.client.fullName}</p>
                      <p className="text-[11px] text-slate-500">{d.client.businessName || d.client.phone}</p>
                    </td>
                    <td className="py-4 px-5 font-bold text-white">
                      {formatCurrency(d.financeAmountApproved)}
                    </td>
                    <td className="py-4 px-5 text-emerald-400 font-semibold">
                      {formatCurrency(Number(d.totalPrincipalRepaid) + Number(d.totalInterestRepaid))}
                    </td>
                    <td className="py-4 px-5 font-bold text-amber-400">
                      {formatCurrency(d.outstandingTotal)}
                    </td>
                    <td className="py-4 px-5 text-slate-300">
                      {formatCurrency(d.installmentAmount)} / {d.repaymentFrequency?.toLowerCase()}
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Edit Deal"
                          onClick={(e) => handleOpenEdit(d, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Delete Deal"
                          onClick={(e) => handleOpenDelete(d, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="View Deal"
                          onClick={() => navigate(`/deals/${d.id}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-slate-400 font-medium text-xs">No finance deals yet.</p>
                      <button
                        onClick={() => navigate('/deals/new')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow transition-all"
                      >
                        Create First Finance Deal
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Deal Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Finance Deal"
        subtitle={`Updating status and metadata for ${dealToEdit?.dealNumber}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Deal Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Working Capital / Inventory"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Deal Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="DEFAULTED">DEFAULTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Internal Admin Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions or covenants..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateDealMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {updateDealMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
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
        message="Are you sure you want to permanently delete this deal? All associated schedules, funding commitments, and records will be deleted."
        itemDescription={dealToDelete ? `${dealToDelete.dealNumber}: ${dealToDelete.client?.fullName} (${formatCurrency(dealToDelete.financeAmountApproved)})` : undefined}
      />
    </div>
  );
};
