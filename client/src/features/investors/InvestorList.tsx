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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Outside Investors
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
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
      <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-warm">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#52525B] stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search by investor name, code, phone, or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-[#FAF7F2] border-2 border-[#A8A29E] focus:border-[#8B1A1A] focus:ring-3 focus:ring-[#8B1A1A]/20 rounded-xl pl-13 pr-4 text-lg font-medium text-[#1A1A1A] placeholder-[#71717A] transition-all"
          />
        </div>
      </div>

      {/* Desktop / Tablet High-Contrast Table View */}
      <div className="hidden md:block rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-4 px-6 text-sm uppercase">Investor Code</th>
                <th className="py-4 px-6 text-sm uppercase">Investor Name</th>
                <th className="py-4 px-6 text-sm uppercase">Contact</th>
                <th className="py-4 px-6 text-sm uppercase">Total Capital</th>
                <th className="py-4 px-6 text-sm uppercase">Principal Returned</th>
                <th className="py-4 px-6 text-sm uppercase">ROI Earned</th>
                <th className="py-4 px-6 text-sm uppercase">Status</th>
                <th className="py-4 px-6 text-sm uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-lg font-bold text-[#52525B]">
                    Loading investor records...
                  </td>
                </tr>
              ) : investors?.length > 0 ? (
                investors.map((inv: any, index: number) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/investors/${inv.id}`)}
                    className={`cursor-pointer hover:bg-[#FAF7F2] transition-colors ${
                      index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
                  >
                    <td className="py-5 px-6 font-mono font-bold text-[#8B1A1A] text-lg">
                      {inv.investorCode}
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-bold text-lg text-[#1A1A1A]">{inv.name}</p>
                      <p className="text-sm font-semibold text-[#52525B] mt-0.5">
                        {inv.bankName ? `Bank: ${inv.bankName}` : 'Bank details unlisted'}
                      </p>
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-bold text-[#1A1A1A]">{inv.phone}</p>
                      <p className="text-sm text-[#52525B] mt-0.5">{inv.email || '—'}</p>
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#6B21A8]">
                      {formatCurrency(inv.totalInvested)}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1F6B3A]">
                      {formatCurrency(inv.totalPrincipalReturned)}
                    </td>
                    <td className="py-5 px-6 font-extrabold text-lg text-[#1F6B3A]">
                      {formatCurrency(inv.totalInterestEarned)}
                    </td>
                    <td className="py-5 px-6">
                      <StatusBadge status={inv.status || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="Edit Investor"
                          onClick={(e) => handleOpenEdit(inv, e)}
                          className="h-11 px-3 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#1E3A8A] border-2 border-[#D6CFC4] hover:border-[#1E3A8A] font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Edit2 className="h-4 w-4 stroke-[2.3]" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete Investor"
                          onClick={(e) => handleOpenDelete(inv, e)}
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
          <div className="p-8 text-center text-lg font-bold text-[#52525B]">
            Loading investor records...
          </div>
        ) : investors?.length > 0 ? (
          investors.map((inv: any) => (
            <AccessibleCard
              key={inv.id}
              onClick={() => navigate(`/investors/${inv.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#EDE7DE]">
                <div>
                  <span className="font-mono text-sm font-bold text-[#8B1A1A] block">
                    {inv.investorCode}
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mt-0.5">{inv.name}</h3>
                  <p className="text-base font-semibold text-[#52525B] mt-0.5">
                    {inv.phone}
                  </p>
                </div>
                <StatusBadge status={inv.status || 'ACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-[#EDE7DE] text-base">
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Total Capital</p>
                  <p className="text-lg font-bold text-[#6B21A8] mt-0.5">
                    {formatCurrency(inv.totalInvested)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1F6B3A] uppercase">ROI Earned</p>
                  <p className="text-lg font-extrabold text-[#1F6B3A] mt-0.5">
                    {formatCurrency(inv.totalInterestEarned)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Principal Returned</p>
                  <p className="text-base font-bold text-[#1F6B3A] mt-0.5">
                    {formatCurrency(inv.totalPrincipalReturned)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Bank Name</p>
                  <p className="text-base font-bold text-[#1A1A1A] mt-0.5 truncate">
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
                    className="h-12 px-4 rounded-xl bg-white border-2 border-[#D6CFC4] text-[#1E3A8A] font-bold text-base flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(inv, e)}
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

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t-2 border-[#EDE7DE]">
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
