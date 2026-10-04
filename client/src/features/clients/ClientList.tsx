import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency } from '../../utils/formatters';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any>(null);
  const [clientToDelete, setClientToDelete] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: async () => {
      const res: any = await apiClient.get(`/clients?search=${searchTerm}`);
      return res.data || [];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      refetch();
      resetForm();
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/clients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setClientToEdit(null);
      refetch();
      resetForm();
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setClientToDelete(null);
      refetch();
    },
  });

  const resetForm = () => {
    setFullName('');
    setBusinessName('');
    setPhone('');
    setEmail('');
    setPan('');
    setCity('');
    setBusinessType('');
    setStatus('ACTIVE');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToEdit(c);
    setFullName(c.fullName || '');
    setBusinessName(c.businessName || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setPan(c.pan || '');
    setCity(c.city || '');
    setBusinessType(c.businessType || '');
    setStatus(c.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(c);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate({
      fullName,
      businessName,
      phone,
      email,
      pan,
      city,
      businessType,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    updateClientMutation.mutate({
      id: clientToEdit.id,
      payload: {
        fullName,
        businessName,
        phone,
        email,
        pan,
        city,
        businessType,
        status,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Client Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage client profiles, KYC documentation, active financings, and full administration
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by client name, business, phone, or PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Client Code</th>
                <th className="py-3.5 px-5">Client / Business</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">Total Finance</th>
                <th className="py-3.5 px-5">Active Outstanding</th>
                <th className="py-3.5 px-5">Deals</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading clients...
                  </td>
                </tr>
              ) : clients?.length > 0 ? (
                clients.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="hover:bg-slate-950/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-slate-400">{c.clientCode}</td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-white">{c.fullName}</p>
                      <p className="text-[11px] text-slate-500">{c.businessName || 'Individual'}</p>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-slate-300">{c.phone}</p>
                      <p className="text-[11px] text-slate-500">{c.city || '—'}</p>
                    </td>
                    <td className="py-4 px-5 font-bold text-white">
                      {formatCurrency(c.totalFinanceReceived)}
                    </td>
                    <td className="py-4 px-5 font-bold text-amber-400">
                      {formatCurrency(c.outstandingAmount)}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold">
                        {c.dealsCount} deals
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {c.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Edit Client"
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Delete Client"
                          onClick={(e) => handleOpenDelete(c, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="View Profile"
                          onClick={() => navigate(`/clients/${c.id}`)}
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
                    No clients registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Client"
        subtitle="Create master record for financing applicant"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business / Firm Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Balaji Traders"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Type
              </label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="Proprietorship"
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
              disabled={createClientMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {createClientMutation.isPending ? 'Saving...' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
        subtitle={`Updating master details for ${clientToEdit?.clientCode}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business / Firm Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
              disabled={updateClientMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              {updateClientMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => deleteClientMutation.mutate(clientToDelete?.id)}
        isLoading={deleteClientMutation.isPending}
        title="Delete Client Record"
        message="Are you sure you want to permanently delete this client? This will remove all associated profile data."
        itemDescription={clientToDelete ? `${clientToDelete.clientCode}: ${clientToDelete.fullName} (${clientToDelete.phone})` : undefined}
      />
    </div>
  );
};
