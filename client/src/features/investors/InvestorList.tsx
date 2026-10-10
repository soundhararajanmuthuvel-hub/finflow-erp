import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  Landmark,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { StatusBadge } from '../../components/common/Badge';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Outside Investors
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Manage syndication capital providers, committed pools, and waterfall ROI payouts
          </p>
        </div>
        <AccessibleButton
          variant="primary"
          size="normal"
          icon={Plus}
          onClick={handleOpenCreate}
        >
          Add New Investor
        </AccessibleButton>
      </div>

      {/* Accessible Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search by investor name, code, phone, or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 rounded-xl pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Desktop / Tablet High-Contrast Table View */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Investor Code</th>
                <th className="py-3 px-5">Investor Name</th>
                <th className="py-3 px-5">Contact</th>
                <th className="py-3 px-5">Total Capital</th>
                <th className="py-3 px-5">Principal Returned</th>
                <th className="py-3 px-5">ROI Earned</th>
                <th className="py-3 px-5">Total Payout</th>
                <th className="py-3 px-5">Pending Principal</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm font-medium text-slate-500">
                    Loading investor records...
                  </td>
                </tr>
              ) : investors?.length > 0 ? (
                investors.map((inv: any, index: number) => {
                  const totalInvested = inv.totalInvested ?? 0;
                  const principalReturned = inv.principalReturned ?? inv.totalPrincipalReturned ?? 0;
                  const interestEarned = inv.interestEarned ?? inv.totalInterestEarned ?? 0;
                  const totalPayout = inv.totalPayout ?? (principalReturned + interestEarned);
                  const pendingPrincipal = inv.pendingPrincipal ?? Math.max(0, totalInvested - principalReturned);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/investors/${inv.id}`)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors bg-white"
                    >
                      <td className="py-3.5 px-5 font-mono font-semibold text-[#8B1A1A] text-sm whitespace-nowrap">
                        {inv.investorCode}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-sm text-slate-900">{inv.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inv.bankName ? `Bank: ${inv.bankName}` : 'Bank details unlisted'}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <p className="font-medium text-sm text-slate-800">{inv.phone}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{inv.email || '—'}</p>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-sm text-purple-700 whitespace-nowrap">
                        {formatCurrency(totalInvested)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-sm text-emerald-700 whitespace-nowrap">
                        {formatCurrency(principalReturned)}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-sm text-emerald-700 whitespace-nowrap">
                        {formatCurrency(interestEarned)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-sm text-blue-700 whitespace-nowrap">
                        {formatCurrency(totalPayout)}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-sm text-amber-700 whitespace-nowrap">
                        {formatCurrency(pendingPrincipal)}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <StatusBadge status={inv.status || 'ACTIVE'} size="sm" />
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Edit Investor"
                            onClick={(e) => handleOpenEdit(inv, e)}
                            className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            title="Delete Investor"
                            onClick={(e) => handleOpenDelete(inv, e)}
                            className="h-8 px-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12">
                    <AccessibleEmptyState
                      icon={TrendingUp}
                      title="No investors registered"
                      description="Add outside capital partners and manage their individual return statements."
                      actionText="Add New Investor"
                      onAction={handleOpenCreate}
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
            Loading investor records...
          </div>
        ) : investors?.length > 0 ? (
          investors.map((inv: any) => (
            <AccessibleCard
              key={inv.id}
              onClick={() => navigate(`/investors/${inv.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-semibold text-[#8B1A1A] block">
                    {inv.investorCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{inv.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {inv.phone}
                  </p>
                </div>
                <StatusBadge status={inv.status || 'ACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 py-3.5 border-b border-slate-100 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Capital</p>
                  <p className="text-sm font-semibold text-purple-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(inv.totalInvested ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700">Principal Returned</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(inv.principalReturned ?? inv.totalPrincipalReturned ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700">ROI Earned</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(inv.interestEarned ?? inv.totalInterestEarned ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Payout</p>
                  <p className="text-sm font-semibold text-blue-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(inv.totalPayout ?? ((inv.principalReturned ?? inv.totalPrincipalReturned ?? 0) + (inv.interestEarned ?? inv.totalInterestEarned ?? 0)))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700">Pending Principal</p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(inv.pendingPrincipal ?? Math.max(0, (inv.totalInvested ?? 0) - (inv.principalReturned ?? inv.totalPrincipalReturned ?? 0)))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Bank Name</p>
                  <p className="text-xs font-medium text-slate-800 mt-0.5 break-words">
                    {inv.bankName || '—'}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-2 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(inv, e)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(inv, e)}
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
                  onClick={() => navigate(`/investors/${inv.id}`)}
                >
                  View
                </AccessibleButton>
              </div>
            </AccessibleCard>
          ))
        ) : (
          <AccessibleEmptyState
            icon={TrendingUp}
            title="No investors found"
            description="Add your first outside investor profile to allocate capital."
            actionText="Add New Investor"
            onAction={handleOpenCreate}
            actionIcon={Plus}
          />
        )}
      </div>

      {/* Add Investor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Outside Investor Profile"
        subtitle="Register new syndication funding partner"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Investor Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S. Murugan"
            />

            <AccessibleInput
              label="Phone Number"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="investor@domain.in"
            />

            <AccessibleInput
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Bank Account Number"
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
              placeholder="50100234567890"
            />

            <AccessibleInput
              label="IFSC Code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="HDFC0001234"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type="submit"
              variant="primary"
              isLoading={createInvestorMutation.isPending}
            >
              Create Investor
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Edit Investor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Investor Profile"
        subtitle={`Updating master details for ${investorToEdit?.investorCode || ''}`}
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Investor Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <AccessibleInput
              label="Phone Number"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <AccessibleInput
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Bank Account Number"
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
            />

            <AccessibleInput
              label="IFSC Code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
            />
          </div>

          <AccessibleSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'INACTIVE', label: 'INACTIVE' },
            ]}
          />

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
              isLoading={updateInvestorMutation.isPending}
            >
              Save Changes
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!investorToDelete}
        onClose={() => setInvestorToDelete(null)}
        onConfirm={() => {
          if (investorToDelete) deleteInvestorMutation.mutate(investorToDelete.id);
        }}
        title="Delete Investor Record"
        message={`Are you sure you want to delete investor ${investorToDelete?.name}? Ensure all deal capital associations are detached.`}
        itemDescription={`Investor Code: ${investorToDelete?.investorCode} — ${investorToDelete?.name}`}
        isLoading={deleteInvestorMutation.isPending}
      />
    </div>
  );
};

export default InvestorList;
