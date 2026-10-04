import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrendingUp, ArrowLeft, Edit2, Trash2, CreditCard, ArrowUpRight } from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export const InvestorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const { data: investor, isLoading, refetch } = useQuery({
    queryKey: ['investor', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/investors/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.patch(`/investors/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.delete(`/investors/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      navigate('/investors');
    },
  });

  const handleOpenEdit = () => {
    if (!investor) return;
    setName(investor.name || '');
    setPhone(investor.phone || '');
    setEmail(investor.email || '');
    setPan(investor.pan || '');
    setBankName(investor.bankName || '');
    setBankAccountNo(investor.bankAccountNo || '');
    setIfscCode(investor.ifscCode || '');
    setStatus(investor.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvestorMutation.mutate({
      name,
      phone,
      email,
      pan,
      bankName,
      bankAccountNo,
      ifscCode,
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

  if (!investor) {
    return <div className="text-center py-12 text-slate-400">Investor not found</div>;
  }

  const summary = investor.portfolioSummary || {
    totalInvested: 0,
    principalReturned: 0,
    interestEarned: 0,
    totalPayout: 0,
    pendingPrincipal: 0,
    activeDealsCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Back button & Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/investors')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Investors</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-bold border border-slate-700 transition-all"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Investor</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-xs font-bold border border-slate-700 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">{investor.name}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-400 font-semibold">
                {investor.investorCode}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                investor.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {investor.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Outside Capital Partner • Phone: {investor.phone} {investor.email ? `• ${investor.email}` : ''}
            </p>
          </div>
        </div>

        {/* Bank Details Strip */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs flex items-center gap-4">
          <CreditCard className="h-6 w-6 text-purple-400 shrink-0" />
          <div>
            <p className="font-bold text-white">{investor.bankName || 'Bank Not Configured'}</p>
            <p className="text-slate-400 font-mono text-[11px]">
              A/C: {investor.bankAccountNo || '—'} • IFSC: {investor.ifscCode || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Capital Deployed</span>
          <p className="text-lg font-bold text-white mt-1">{formatCurrency(summary.totalInvested)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Principal Recovered</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(summary.principalReturned)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Total ROI Earned</span>
          <p className="text-lg font-bold text-purple-400 mt-1">{formatCurrency(summary.interestEarned)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Pending Capital</span>
          <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(summary.pendingPrincipal)}</p>
        </div>
      </div>

      {/* Deals Participated */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Deal Participations ({investor.fundings?.length || 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Deal Number</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Invested Amount</th>
                <th className="py-3 px-4">Share %</th>
                <th className="py-3 px-4">Principal Recovered</th>
                <th className="py-3 px-4">Interest Earned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">View Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {investor.fundings?.map((f: any) => (
                <tr key={f.id} className="hover:bg-slate-950/40">
                  <td className="py-3 px-4 font-mono font-bold text-white">{f.deal.dealNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{f.deal.client?.fullName}</td>
                  <td className="py-3 px-4 font-bold text-white">{formatCurrency(f.amount)}</td>
                  <td className="py-3 px-4 text-purple-400 font-semibold">{formatPercentage(f.percentage)}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{formatCurrency(f.principalReturned)}</td>
                  <td className="py-3 px-4 text-teal-400 font-semibold">{formatCurrency(f.interestEarned)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={f.deal.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/deals/${f.deal.id}`)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Investor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Investor Profile"
        subtitle={`Updating information for ${investor.investorCode}`}
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
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteInvestorMutation.mutate()}
        isLoading={deleteInvestorMutation.isPending}
        title="Delete Investor Record"
        message="Are you sure you want to permanently delete this investor profile?"
        itemDescription={`${investor.investorCode}: ${investor.name}`}
      />
    </div>
  );
};
