import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Trash2,
  CreditCard,
  Building2,
  Briefcase,
  Phone,
  Mail,
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
} from '../../components/common/AccessibleComponents';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-14 w-14 border-4 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold text-[#1A1A1A]">Loading investor profile...</p>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="text-center py-16 text-xl font-bold text-[#52525B]">
        Investor record not found
      </div>
    );
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
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/investors')}
          className="inline-flex items-center gap-2 text-base font-bold text-[#8B1A1A] hover:underline"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          <span>Back to Investor Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <AccessibleButton
            variant="outline"
            size="compact"
            icon={Edit2}
            onClick={handleOpenEdit}
          >
            Edit Profile
          </AccessibleButton>
          <AccessibleButton
            variant="danger"
            size="compact"
            icon={Trash2}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </AccessibleButton>
        </div>
      </div>

      {/* Investor Profile Banner Card */}
      <AccessibleCard withTopAccent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#F3E8FF] text-[#6B21A8] border-2 border-[#D8B4FE] flex items-center justify-center font-black text-xl shrink-0">
              <TrendingUp className="h-6 w-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {investor.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[#8B1A1A] font-semibold">
                  {investor.investorCode}
                </span>
                <StatusBadge status={investor.status || 'ACTIVE'} size="sm" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                Outside Capital Partner • Phone: {investor.phone} {investor.email ? `• ${investor.email}` : ''}
              </p>
            </div>
          </div>

          {/* Bank Details Strip */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-sm">
            <CreditCard className="h-5 w-5 text-[#8B1A1A] shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {investor.bankName || 'Bank Not Configured'}
              </p>
              <p className="text-slate-500 font-mono text-xs mt-0.5">
                A/C: {investor.bankAccountNo || '—'} • IFSC: {investor.ifscCode || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 block">Total Capital Deployed</span>
            <p className="text-lg sm:text-xl font-bold text-purple-700 mt-1 whitespace-nowrap">
              {formatCurrency(summary.totalInvested)}
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-xs font-medium text-emerald-800 block">Principal Recovered</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1 whitespace-nowrap">
              {formatCurrency(summary.principalReturned ?? summary.totalPrincipalReturned ?? 0)}
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-xs font-medium text-emerald-800 block">Total ROI Earned</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1 whitespace-nowrap">
              {formatCurrency(summary.interestEarned ?? summary.totalInterestEarned ?? 0)}
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
            <span className="text-xs font-medium text-blue-800 block">Total Payout</span>
            <p className="text-lg sm:text-xl font-bold text-blue-700 mt-1 whitespace-nowrap">
              {formatCurrency(summary.totalPayout ?? ((summary.principalReturned || 0) + (summary.interestEarned || 0)))}
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-xs font-medium text-amber-800 block">Pending Capital</span>
            <p className="text-lg sm:text-xl font-bold text-amber-700 mt-1 whitespace-nowrap">
              {formatCurrency(summary.pendingPrincipal)}
            </p>
          </div>
        </div>
      </AccessibleCard>

      {/* Deals Participated */}
      <AccessibleCard withTopAccent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Briefcase className="h-5 w-5 text-[#8B1A1A] stroke-[2.2]" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Deal Participations ({investor.fundings?.length || 0} Deals)
            </h3>
          </div>
        </div>

        {investor.fundings && investor.fundings.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Deal Number</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Invested Amount</th>
                  <th className="py-3 px-4">Share %</th>
                  <th className="py-3 px-4">Principal Recovered</th>
                  <th className="py-3 px-4">Interest Earned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {investor.fundings.map((f: any) => (
                  <tr
                    key={f.id}
                    onClick={() => navigate(`/deals/${f.deal?.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors bg-white"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#8B1A1A] text-sm sm:text-base whitespace-nowrap">
                      {f.deal?.dealNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-sm sm:text-base">
                      {f.deal?.client?.fullName}
                    </td>
                    <td className="py-3 px-4 font-bold text-sm sm:text-base text-[#6B21A8] whitespace-nowrap">
                      {formatCurrency(f.amount)}
                    </td>
                    <td className="py-3 px-4 font-bold text-sm sm:text-base text-[#1A1A1A] whitespace-nowrap">
                      {formatPercentage(f.percentage)}
                    </td>
                    <td className="py-3 px-4 font-bold text-sm sm:text-base text-[#1F6B3A] whitespace-nowrap">
                      {formatCurrency(f.principalReturned)}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-sm sm:text-base text-[#1F6B3A] whitespace-nowrap">
                      {formatCurrency(f.interestEarned)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={f.deal?.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <AccessibleButton
                        variant="secondary"
                        size="compact"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/deals/${f.deal?.id}`);
                        }}
                      >
                        View
                      </AccessibleButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-base font-semibold text-[#52525B]">
            No deal syndications recorded for this investor yet.
          </div>
        )}
      </AccessibleCard>

      {/* Edit Investor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Investor Profile"
        subtitle={`Updating information for ${investor.investorCode}`}
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
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'BLOCKED', label: 'Blocked' },
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

export default InvestorDetail;
