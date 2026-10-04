import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, ArrowLeft, ArrowUpRight, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency } from '../../utils/formatters';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/clients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateClientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.patch(`/clients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.delete(`/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      navigate('/clients');
    },
  });

  const handleOpenEdit = () => {
    if (!client) return;
    setFullName(client.fullName || '');
    setBusinessName(client.businessName || '');
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setPan(client.pan || '');
    setCity(client.city || '');
    setBusinessType(client.businessType || '');
    setStatus(client.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientMutation.mutate({
      fullName,
      businessName,
      phone,
      email,
      pan,
      city,
      businessType,
      status,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-12 text-slate-400">Client not found</div>;
  }

  const summary = client.summary || {
    totalFinanceReceived: 0,
    totalInterestPayable: 0,
    totalRepaid: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Back button & Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Clients</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-bold border border-slate-700 transition-all"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Client</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-xs font-bold border border-slate-700 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
          <button
            onClick={() => navigate('/deals/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-glow hover:brightness-110 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Finance Deal</span>
          </button>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-lg">
            <User className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">{client.fullName}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                {client.clientCode}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                client.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {client.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {client.businessName ? `${client.businessName} • ` : ''}
              {client.industry || client.businessType || 'General Commerce'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block">Phone</span>
            <span className="font-semibold">{client.phone}</span>
          </div>
          <div>
            <span className="text-slate-500 block">PAN</span>
            <span className="font-mono font-semibold">{client.pan || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Location</span>
            <span className="font-semibold">{client.city ? `${client.city}, ${client.state || ''}` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Finance Taken</span>
          <p className="text-lg font-bold text-white mt-1">{formatCurrency(summary.totalFinanceReceived)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Repaid (P+I)</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(summary.totalRepaid)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Outstanding Total</span>
          <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(summary.outstandingAmount)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Overdue Balance</span>
          <p className="text-lg font-bold text-rose-400 mt-1">{formatCurrency(summary.overdueAmount)}</p>
        </div>
      </div>

      {/* Finance Deals History */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Finance History ({client.deals?.length || 0} Deals)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Deal #</th>
                <th className="py-3 px-4">Amount Approved</th>
                <th className="py-3 px-4">Contract Interest</th>
                <th className="py-3 px-4">Total Repaid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {client.deals?.map((d: any) => (
                <tr
                  key={d.id}
                  onClick={() => navigate(`/deals/${d.id}`)}
                  className="hover:bg-slate-950/40 cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-white">{d.dealNumber}</td>
                  <td className="py-3 px-4 font-bold text-white">{formatCurrency(d.financeAmountApproved)}</td>
                  <td className="py-3 px-4 text-emerald-400">{formatCurrency(d.totalInterest)}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    {formatCurrency(Number(d.totalPrincipalRepaid) + Number(d.totalInterestRepaid))}
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-400">{formatCurrency(d.outstandingTotal)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
        subtitle={`Updating master record for ${client.clientCode}`}
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
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteClientMutation.mutate()}
        isLoading={deleteClientMutation.isPending}
        title="Delete Client Record"
        message="Are you sure you want to permanently delete this client and all associated records?"
        itemDescription={`${client.clientCode}: ${client.fullName}`}
      />
    </div>
  );
};
