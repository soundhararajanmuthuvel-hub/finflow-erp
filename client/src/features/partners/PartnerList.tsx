import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Landmark, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export const PartnerList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<any>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capitalContribution, setCapitalContribution] = useState('');
  const [sharePercentage, setSharePercentage] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const res: any = await apiClient.get('/partners');
      return res.data || [];
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/partners', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      refetch();
      resetForm();
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/partners/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setPartnerToEdit(null);
      refetch();
      resetForm();
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/partners/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setPartnerToDelete(null);
      refetch();
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCapitalContribution('');
    setSharePercentage('');
    setStatus('ACTIVE');
    setNotes('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setPartnerToEdit(p);
    setName(p.name || '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setCapitalContribution(p.capitalContribution?.toString() || '');
    setSharePercentage(p.sharePercentage?.toString() || '');
    setStatus(p.status || 'ACTIVE');
    setNotes(p.notes || '');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (p: any) => {
    setPartnerToDelete(p);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPartnerMutation.mutate({
      name,
      phone,
      email,
      capitalContribution: Number(capitalContribution) || 0,
      sharePercentage: Number(sharePercentage) || 0,
      notes,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerToEdit) return;
    updatePartnerMutation.mutate({
      id: partnerToEdit.id,
      payload: {
        name,
        phone,
        email,
        capitalContribution: Number(capitalContribution) || 0,
        sharePercentage: Number(sharePercentage) || 0,
        status,
        notes,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Company Partners & Capital</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage company co-owners, equity shares, capital deployment across deals and profit drawings
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Partner</span>
        </button>
      </div>

      {/* Partners Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">Loading partners...</div>
        ) : partners?.map((p: any) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <span className="font-mono text-[11px] text-slate-400">{p.partnerCode}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  {formatPercentage(p.sharePercentage)} Equity
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 text-xs pt-3">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-medium text-slate-300">{p.phone}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Base Capital:</span>
                  <span className="font-bold text-white">{formatCurrency(p.capitalContribution)}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Deals Funded:</span>
                  <span className="font-bold text-blue-400">{formatCurrency(p.totalInvested)}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Principal Returned:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(p.principalReturned)}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Profit Earned:</span>
                  <span className="font-bold text-teal-400">{formatCurrency(p.profitEarned)}</span>
                </div>
              </div>
            </div>

            {/* Admin Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => handleOpenEdit(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleOpenDelete(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Partner Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Company Partner"
        subtitle="Register partner capital pool and equity share"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Partner Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikram Singhania"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98111 00001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@domain.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Base Capital Contribution (₹)
              </label>
              <input
                type="number"
                value={capitalContribution}
                onChange={(e) => setCapitalContribution(e.target.value)}
                placeholder="500000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Equity Share (%)
              </label>
              <input
                type="number"
                value={sharePercentage}
                onChange={(e) => setSharePercentage(e.target.value)}
                placeholder="50"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPartnerMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {createPartnerMutation.isPending ? 'Saving...' : 'Add Partner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Partner Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Partner"
        subtitle={`Updating details for ${partnerToEdit?.partnerCode}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Partner Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Capital Contribution (₹)
              </label>
              <input
                type="number"
                value={capitalContribution}
                onChange={(e) => setCapitalContribution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Equity Share (%)
              </label>
              <input
                type="number"
                value={sharePercentage}
                onChange={(e) => setSharePercentage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>
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
              disabled={updatePartnerMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {updatePartnerMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!partnerToDelete}
        onClose={() => setPartnerToDelete(null)}
        onConfirm={() => deletePartnerMutation.mutate(partnerToDelete?.id)}
        isLoading={deletePartnerMutation.isPending}
        title="Delete Partner Record"
        message="Are you sure you want to permanently delete this partner? This action cannot be undone."
        itemDescription={partnerToDelete ? `${partnerToDelete.partnerCode}: ${partnerToDelete.name}` : undefined}
      />
    </div>
  );
};
