import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import apiClient from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency } from '../../utils/formatters';

export const InvestorList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [investorToEdit, setInvestorToEdit] = useState<any>(null);
  const [investorToDelete, setInvestorToDelete] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');

  const { data: investors, isLoading, refetch } = useQuery({
    queryKey: ['investors', searchTerm],
    queryFn: async () => {
      const res: any = await apiClient.get(`/investors?search=${searchTerm}`);
      return res.data || [];
    },
  });

  const createInvestorMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/investors', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      refetch();
      resetForm();
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/investors/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setInvestorToEdit(null);
      refetch();
      resetForm();
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/investors/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setInvestorToDelete(null);
      refetch();
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPan('');
    setBankName('');
    setBankAccountNo('');
    setIfscCode('');
    setStatus('ACTIVE');
    setNotes('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvestorToEdit(inv);
    setName(inv.name || '');
    setPhone(inv.phone || '');
    setEmail(inv.email || '');
    setPan(inv.pan || '');
    setBankName(inv.bankName || '');
    setBankAccountNo(inv.bankAccountNo || '');
    setIfscCode(inv.ifscCode || '');
    setStatus(inv.status || 'ACTIVE');
    setNotes(inv.notes || '');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvestorToDelete(inv);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createInvestorMutation.mutate({
      name,
      phone,
      email,
      pan,
      bankName,
      bankAccountNo,
      ifscCode,
      notes,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorToEdit) return;
    updateInvestorMutation.mutate({
      id: investorToEdit.id,
      payload: {
        name,
        phone,
        email,
        pan,
        bankName,
        bankAccountNo,
        ifscCode,
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
          <h1 className="text-2xl font-black text-white tracking-tight">Outside Investor Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage high-net-worth investors, syndicate syndications, capital deployments and automated waterfall return payouts
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Investor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by investor name, phone, PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Investors Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Code</th>
                <th className="py-3.5 px-5">Investor Name</th>
                <th className="py-3.5 px-5">Contact</th>
                <th className="py-3.5 px-5">Active Investment</th>
                <th className="py-3.5 px-5">Principal Returned</th>
                <th className="py-3.5 px-5">Interest Earned</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading investors...
                  </td>
                </tr>
              ) : investors?.length > 0 ? (
                investors.map((inv: any) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investors/${inv.id}`)}
                    className="hover:bg-slate-950/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-slate-400">{inv.investorCode}</td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-white">{inv.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">PAN: {inv.pan || '—'}</p>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-slate-300">{inv.phone}</p>
                      <p className="text-[11px] text-slate-500">{inv.email || '—'}</p>
                    </td>
                    <td className="py-4 px-5 font-bold text-blue-400">
                      {formatCurrency(inv.totalInvested)}
                    </td>
                    <td className="py-4 px-5 font-bold text-emerald-400">
                      {formatCurrency(inv.principalReturned)}
                    </td>
                    <td className="py-4 px-5 font-bold text-teal-400">
                      {formatCurrency(inv.interestEarned)}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {inv.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Edit Investor"
                          onClick={(e) => handleOpenEdit(inv, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Delete Investor"
                          onClick={(e) => handleOpenDelete(inv, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="View Details"
                          onClick={() => navigate(`/investors/${inv.id}`)}
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
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No investors registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Investor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Outside Investor"
        subtitle="Register investor profile and payout bank details"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Investor Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Rao"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98222 00001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@domain.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="HDFC Bank"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="50100234567890"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="HDFC0000123"
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
              disabled={createInvestorMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {createInvestorMutation.isPending ? 'Saving...' : 'Add Investor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Investor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Investor Profile"
        subtitle={`Updating information for ${investorToEdit?.investorCode}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Investor Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
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
              disabled={updateInvestorMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {updateInvestorMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!investorToDelete}
        onClose={() => setInvestorToDelete(null)}
        onConfirm={() => deleteInvestorMutation.mutate(investorToDelete?.id)}
        isLoading={deleteInvestorMutation.isPending}
        title="Delete Investor Record"
        message="Are you sure you want to permanently delete this investor? This action cannot be undone."
        itemDescription={investorToDelete ? `${investorToDelete.investorCode}: ${investorToDelete.name}` : undefined}
      />
    </div>
  );
};
