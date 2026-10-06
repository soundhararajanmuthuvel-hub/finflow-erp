import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  PlayCircle,
  Receipt,
  Printer,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  User,
  BookOpen,
  History,
  PieChart,
  Percent,
  Layers,
  FileSpreadsheet,
  Edit2,
  Trash2,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Clock,
  Briefcase,
  Users,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';
import { RecordRepaymentModal } from '../repayments/RecordRepaymentModal';
import { PaymentDetailDrawer } from '../repayments/PaymentDetailDrawer';
import { AddFundingModal } from './AddFundingModal';
import { ClientPaymentScheduleModal } from '../documents/ClientPaymentScheduleModal';
import { InvestorStatementModal } from '../documents/InvestorStatementModal';
import { useAuth } from '../../context/AuthContext';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import {
  AccessibleButton,
  AccessibleCard,
  AccessibleInput,
  AccessibleSelect,
} from '../../components/common/AccessibleComponents';

export const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { company } = useCompanyProfile();

  const [activeTab, setActiveTab] = useState('overview');
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [addFundingModalOpen, setAddFundingModalOpen] = useState(false);
  const [clientScheduleModalOpen, setClientScheduleModalOpen] = useState(false);
  const [investorStatementModalOpen, setInvestorStatementModalOpen] = useState(false);
  const [selectedInvestorForStatement, setSelectedInvestorForStatement] = useState<string | undefined>(undefined);
  const [selectedRepaymentForDetail, setSelectedRepaymentForDetail] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form state
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  const { data: deal, isLoading, refetch } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/deals/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post(`/deals/${id}/approve`, {});
      return res.data;
    },
    onSuccess: () => refetch(),
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post(`/deals/${id}/activate`, {});
      return res.data;
    },
    onSuccess: () => refetch(),
  });

  const resetDemoMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.post('/demo/reset', {});
      return res.data;
    },
    onSuccess: (newDeal) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      if (newDeal?.id) {
        navigate(`/deals/${newDeal.id}`);
      } else {
        refetch();
      }
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.patch(`/deals/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.delete(`/deals/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      navigate('/deals');
    },
  });

  const deleteFundingMutation = useMutation({
    mutationFn: async (fundingId: string) => {
      const res: any = await apiClient.delete(`/deals/${id}/funding/${fundingId}`);
      return res.data;
    },
    onSuccess: () => refetch(),
  });

  const handleOpenEdit = () => {
    if (!deal) return;
    setPurpose(deal.purpose || '');
    setNotes(deal.notes || '');
    setStatus(deal.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateDealMutation.mutate({
      purpose,
      notes,
      status,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 border-4 border-maroon-800/20 border-t-maroon-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <AccessibleCard className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="h-14 w-14 text-amber-600 mx-auto" />
        <h3 className="text-2xl font-bold text-stone-900">Finance Deal Not Found</h3>
        <p className="text-base text-stone-600">The requested finance syndication deal does not exist or has been deleted.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <AccessibleButton
            variant="outline"
            onClick={() => navigate('/deals')}
          >
            Go to Deal Portfolio
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            onClick={() => resetDemoMutation.mutate()}
            disabled={resetDemoMutation.isPending}
            icon={<RefreshCw className={`h-5 w-5 ${resetDemoMutation.isPending ? 'animate-spin' : ''}`} />}
          >
            Load Demo Deal
          </AccessibleButton>
        </div>
      </AccessibleCard>
    );
  }

  // Calculate Funding Breakdown
  const approvedAmount = Number(deal.financeAmountApproved || 0);
  const totalFunded = deal.fundings?.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0) || 0;
  const fundedPercent = approvedAmount > 0 ? (totalFunded / approvedAmount) * 100 : 0;

  const companyFunding = deal.fundings?.filter((f: any) => f.sourceType === 'COMPANY') || [];
  const investorFunding = deal.fundings?.filter((f: any) => f.sourceType === 'OUTSIDE_INVESTOR') || [];
  const partnerFunding = deal.fundings?.filter((f: any) => f.sourceType === 'PARTNER') || [];

  const companyTotal = companyFunding.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
  const investorTotal = investorFunding.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
  const partnerTotal = partnerFunding.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);

  const companyPct = approvedAmount > 0 ? (companyTotal / approvedAmount) * 100 : 0;
  const investorPct = approvedAmount > 0 ? (investorTotal / approvedAmount) * 100 : 0;
  const partnerPct = approvedAmount > 0 ? (partnerTotal / approvedAmount) * 100 : 0;

  // Repayment & Distribution aggregates
  const totalPayable = Number(deal.totalPayable || 0);
  const principalRepaid = Number(deal.totalPrincipalRepaid || 0);
  const interestRepaid = Number(deal.totalInterestRepaid || 0);
  const totalCollected = principalRepaid + interestRepaid;
  const outstandingPrincipal = Math.max(0, approvedAmount - principalRepaid);
  const outstandingTotal = Math.max(0, totalPayable - totalCollected);

  // Profit / Commission Aggregates
  let totalCompanyCommission = 0;
  let totalInvestorReturns = 0;
  let totalPartnerProfits = 0;
  let totalCompanyProfit = 0;

  deal.distributions?.forEach((d: any) => {
    d.companyProfits?.forEach((cp: any) => {
      totalCompanyCommission += Number(cp.managementCommission || 0);
      totalCompanyProfit += Number(cp.totalCompanyProfit || 0);
    });
    d.investorReturns?.forEach((ir: any) => {
      totalInvestorReturns += Number(ir.interestEarned || 0);
    });
    d.partnerReturns?.forEach((pr: any) => {
      totalPartnerProfits += Number(pr.profitShare || 0);
    });
  });

  // Next due installment
  const nextPendingSchedule = deal.schedules?.find(
    (s: any) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'PARTIALLY_PAID' || s.status === 'OVERDUE'
  );

  const overdueSchedules = deal.schedules?.filter((s: any) => s.status === 'OVERDUE') || [];
  const overdueAmount = overdueSchedules.reduce((sum: number, s: any) => sum + Number(s.balanceAmount || 0), 0);

  const isDemoDeal = deal.notes?.includes('DEMO') || deal.purpose?.includes('DEMO') || deal.dealNumber === 'FIN-000001';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'funding', label: 'Funding', icon: DollarSign },
    { id: 'schedule', label: 'Repayment Plan', icon: Calendar },
    { id: 'repayments', label: 'Collections', icon: Receipt },
    { id: 'investors', label: 'Investors', icon: TrendingUp },
    { id: 'partners', label: 'Partners', icon: Building },
    { id: 'distribution', label: 'Profit Distribution', icon: PieChart },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
    { id: 'audit', label: 'Audit', icon: History },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP SECTION: CLIENT, DEAL ID, STATUS & CORE VALUES */}
      {/* ========================================================================= */}
      <AccessibleCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-mono font-black text-maroon-900 bg-maroon-50 px-3.5 py-1.5 rounded-xl border-2 border-maroon-200">
                {deal.dealNumber}
              </span>
              <StatusBadge status={deal.status} />
              {isDemoDeal && (
                <span className="text-sm font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl border-2 border-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  DEMO DATA
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">{deal.client?.fullName}</h1>
            <p className="text-base text-stone-600 font-medium">
              {deal.client?.businessName ? <span className="text-stone-900 font-bold">{deal.client.businessName} • </span> : null}
              {deal.purpose || 'Working Capital Syndication'} • Started: <span className="text-stone-900 font-bold">{formatDate(deal.startDate)}</span>
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <AccessibleButton
              variant="outline"
              onClick={() => resetDemoMutation.mutate()}
              disabled={resetDemoMutation.isPending}
              icon={<RefreshCw className={`h-5 w-5 ${resetDemoMutation.isPending ? 'animate-spin' : ''}`} />}
            >
              Reset Demo
            </AccessibleButton>

            <AccessibleButton
              variant="outline"
              onClick={() => setClientScheduleModalOpen(true)}
              icon={<FileSpreadsheet className="h-5 w-5 text-emerald-700" />}
            >
              Print Client Schedule
            </AccessibleButton>

            {investorFunding.length > 0 && (
              <AccessibleButton
                variant="outline"
                onClick={() => {
                  setSelectedInvestorForStatement(investorFunding[0]?.investorId);
                  setInvestorStatementModalOpen(true);
                }}
                icon={<TrendingUp className="h-5 w-5 text-purple-700" />}
              >
                Investor Statements
              </AccessibleButton>
            )}

            <AccessibleButton
              variant="outline"
              onClick={handleOpenEdit}
              icon={<Edit2 className="h-5 w-5" />}
            >
              Edit Deal
            </AccessibleButton>

            <AccessibleButton
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Trash2 className="h-5 w-5" />}
            >
              Delete
            </AccessibleButton>

            {deal.status === 'PENDING_APPROVAL' && (
              <AccessibleButton
                variant="primary"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                icon={<CheckCircle2 className="h-5 w-5" />}
              >
                Approve Deal
              </AccessibleButton>
            )}

            {deal.status === 'APPROVED' && (
              <AccessibleButton
                variant="primary"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                icon={<PlayCircle className="h-5 w-5" />}
              >
                Activate & Disburse
              </AccessibleButton>
            )}

            {(deal.status === 'ACTIVE' || deal.status === 'OVERDUE') && (
              <AccessibleButton
                variant="primary"
                onClick={() => setRepaymentModalOpen(true)}
                icon={<Receipt className="h-5 w-5" />}
              >
                + Record Collection
              </AccessibleButton>
            )}
          </div>
        </div>

        {/* Financial Header 4-KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t-2 border-stone-200">
          <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
            <span className="text-sm text-stone-600 font-bold uppercase tracking-wider block">Finance Amount</span>
            <p className="text-3xl font-black text-stone-900 mt-1">{formatCurrency(deal.financeAmountApproved)}</p>
            <p className="text-sm text-stone-500 font-medium mt-1">Required: {formatCurrency(deal.financeAmountRequired)}</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <span className="text-sm text-blue-900 font-bold uppercase tracking-wider block">Total Payable</span>
            <p className="text-3xl font-black text-blue-950 mt-1">{formatCurrency(totalPayable)}</p>
            <p className="text-sm text-blue-800 font-medium mt-1">
              {deal.numberOfRepayments} × {formatCurrency(deal.installmentAmount)} ({deal.repaymentFrequency})
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
            <span className="text-sm text-emerald-900 font-bold uppercase tracking-wider block">Total Collected</span>
            <p className="text-3xl font-black text-emerald-950 mt-1">{formatCurrency(totalCollected)}</p>
            <p className="text-sm text-emerald-800 font-medium mt-1">
              Principal: {formatCurrency(principalRepaid)} • Interest: {formatCurrency(interestRepaid)}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
            <span className="text-sm text-amber-900 font-bold uppercase tracking-wider block">Outstanding</span>
            <p className="text-3xl font-black text-amber-950 mt-1">{formatCurrency(outstandingTotal)}</p>
            <p className="text-sm text-amber-800 font-medium mt-1">Principal Remaining: {formatCurrency(outstandingPrincipal)}</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FUNDING SUMMARY & ALLOCATION VISUALIZATION BAR */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-2xl bg-stone-50 border-2 border-stone-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-maroon-800" />
                <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-wide">
                  Syndicate Funding Allocation Summary
                </h3>
              </div>
              <p className="text-sm text-stone-600 mt-1">
                Total Required: <span className="text-stone-900 font-bold">{formatCurrency(approvedAmount)}</span> • Total Funded:{' '}
                <span className="text-emerald-800 font-extrabold">{formatCurrency(totalFunded)} ({fundedPercent.toFixed(1)}%)</span>
              </p>
            </div>

            <div>
              <AccessibleButton
                variant="outline"
                onClick={() => setAddFundingModalOpen(true)}
                icon={<PlusCircle className="h-5 w-5 text-emerald-700" />}
              >
                + Add Funding Participant
              </AccessibleButton>
            </div>
          </div>

          {/* Progress Bar Visualization */}
          <div className="w-full bg-stone-200 h-5 rounded-full overflow-hidden flex border-2 border-stone-300">
            <div
              style={{ width: `${companyPct}%` }}
              className="bg-emerald-600 h-full transition-all duration-500"
              title={`Company Capital: ${formatCurrency(companyTotal)} (${companyPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${investorPct}%` }}
              className="bg-purple-600 h-full transition-all duration-500"
              title={`Outside Investors: ${formatCurrency(investorTotal)} (${investorPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${partnerPct}%` }}
              className="bg-blue-600 h-full transition-all duration-500"
              title={`Company Partners: ${formatCurrency(partnerTotal)} (${partnerPct.toFixed(1)}%)`}
            />
          </div>

          {/* Participant Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-base">
            <div className="p-4 rounded-xl bg-white border-2 border-emerald-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-stone-900">Company Capital</p>
                  <p className="text-sm text-stone-500 font-medium">{companyPct.toFixed(1)}% Allocation</p>
                </div>
              </div>
              <p className="font-black text-emerald-900 font-mono text-lg">{formatCurrency(companyTotal)}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border-2 border-purple-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-600 shrink-0" />
                <div>
                  <p className="font-bold text-stone-900">Outside Investors</p>
                  <p className="text-sm text-stone-500 font-medium">{investorFunding.length} Participants ({investorPct.toFixed(1)}%)</p>
                </div>
              </div>
              <p className="font-black text-purple-900 font-mono text-lg">{formatCurrency(investorTotal)}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border-2 border-blue-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-stone-900">Company Partners</p>
                  <p className="text-sm text-stone-500 font-medium">{partnerFunding.length} Partners ({partnerPct.toFixed(1)}%)</p>
                </div>
              </div>
              <p className="font-black text-blue-900 font-mono text-lg">{formatCurrency(partnerTotal)}</p>
            </div>
          </div>
        </div>
      </AccessibleCard>

      {/* ========================================================================= */}
      {/* 3. 9 DEDICATED TABS NAVIGATION */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-stone-200 overflow-x-auto">
        <nav className="flex space-x-2 pb-px min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-5 py-3.5 text-base font-bold rounded-t-2xl transition-all border-b-4 ${
                  isActive
                    ? 'text-maroon-900 border-maroon-800 bg-white shadow-sm'
                    : 'text-stone-600 border-transparent hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-maroon-800' : 'text-stone-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AccessibleCard className="p-5">
              <span className="text-sm text-stone-500 font-bold uppercase">1. Finance Amount</span>
              <p className="text-2xl font-black text-stone-900 mt-1">{formatCurrency(deal.financeAmountApproved)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5">
              <span className="text-sm text-stone-500 font-bold uppercase">2. Disbursed Amount</span>
              <p className="text-2xl font-black text-stone-900 mt-1">
                {deal.status === 'ACTIVE' || deal.status === 'COMPLETED' || deal.status === 'OVERDUE'
                  ? formatCurrency(deal.financeAmountApproved)
                  : '₹0.00 (Pending)'}
              </p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-blue-50 border-blue-200">
              <span className="text-sm text-blue-900 font-bold uppercase">3. Total Payable</span>
              <p className="text-2xl font-black text-blue-950 mt-1">{formatCurrency(deal.totalPayable)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-emerald-50 border-emerald-200">
              <span className="text-sm text-emerald-900 font-bold uppercase">4. Total Collected</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">{formatCurrency(totalCollected)}</p>
            </AccessibleCard>

            <AccessibleCard className="p-5">
              <span className="text-sm text-stone-500 font-bold uppercase">5. Principal Collected</span>
              <p className="text-2xl font-black text-stone-900 mt-1">{formatCurrency(principalRepaid)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-emerald-50 border-emerald-200">
              <span className="text-sm text-emerald-900 font-bold uppercase">6. Interest Collected</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">{formatCurrency(interestRepaid)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-amber-50 border-amber-200">
              <span className="text-sm text-amber-900 font-bold uppercase">7. Outstanding Principal</span>
              <p className="text-2xl font-black text-amber-950 mt-1">{formatCurrency(outstandingPrincipal)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-amber-50 border-amber-200">
              <span className="text-sm text-amber-900 font-bold uppercase">8. Outstanding Interest</span>
              <p className="text-2xl font-black text-amber-950 mt-1">
                {formatCurrency(Math.max(0, Number(deal.totalInterest || 0) - interestRepaid))}
              </p>
            </AccessibleCard>

            <AccessibleCard className="p-5">
              <span className="text-sm text-stone-600 font-bold uppercase">9. Company Commission</span>
              <p className="text-2xl font-black text-stone-900 mt-1">{formatCurrency(totalCompanyCommission)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-purple-50 border-purple-200">
              <span className="text-sm text-purple-900 font-bold uppercase">10. Investor Returns</span>
              <p className="text-2xl font-black text-purple-950 mt-1">{formatCurrency(totalInvestorReturns)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-blue-50 border-blue-200">
              <span className="text-sm text-blue-900 font-bold uppercase">11. Partner Profit Share</span>
              <p className="text-2xl font-black text-blue-950 mt-1">{formatCurrency(totalPartnerProfits)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-5 bg-emerald-50 border-emerald-200">
              <span className="text-sm text-emerald-900 font-bold uppercase">12. Company Net Profit</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">{formatCurrency(totalCompanyProfit)}</p>
            </AccessibleCard>
          </div>

          {/* Collection Status Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <AccessibleCard className="p-6">
              <span className="text-sm text-stone-500 font-bold uppercase tracking-wider block mb-1">
                Next Collection Due
              </span>
              {nextPendingSchedule ? (
                <div>
                  <p className="text-2xl font-black text-stone-900 font-mono">{formatCurrency(nextPendingSchedule.totalDue)}</p>
                  <p className="text-base text-stone-600 mt-1 font-medium">
                    Installment #{nextPendingSchedule.installmentNumber} • Due Date: <span className="text-maroon-900 font-bold">{formatDate(nextPendingSchedule.dueDate)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-base text-emerald-800 font-bold mt-2">All installments fully settled!</p>
              )}
            </AccessibleCard>

            <AccessibleCard className="p-6">
              <span className="text-sm text-stone-500 font-bold uppercase tracking-wider block mb-1">
                Repayment Frequency
              </span>
              <p className="text-2xl font-black text-stone-900 uppercase">{deal.repaymentFrequency}</p>
              <p className="text-base text-stone-600 mt-1 font-medium">
                Method: <span className="text-stone-900 font-semibold">{deal.interestType}</span> • Rate: <span className="text-maroon-900 font-bold">{deal.interestRate}%</span>
              </p>
            </AccessibleCard>

            <AccessibleCard className="p-6 bg-red-50 border-red-200">
              <span className="text-sm text-red-900 font-bold uppercase tracking-wider block mb-1">
                Overdue Balance
              </span>
              <p className="text-2xl font-black text-red-900 font-mono">{formatCurrency(overdueAmount)}</p>
              <p className="text-base text-red-800 mt-1 font-medium">
                {overdueSchedules.length > 0 ? `${overdueSchedules.length} installment(s) currently overdue` : 'No overdue payments'}
              </p>
            </AccessibleCard>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FUNDING */}
      {/* ========================================================================= */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-2xl font-extrabold text-stone-900">
              Syndicate Funding Participants Table
            </h3>
            <AccessibleButton
              variant="primary"
              onClick={() => setAddFundingModalOpen(true)}
              icon={<PlusCircle className="h-5 w-5" />}
            >
              + Add Funding Participant
            </AccessibleButton>
          </div>

          <AccessibleCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b-2 border-stone-200 bg-stone-100 text-stone-800 font-bold">
                    <th className="p-4">Participant</th>
                    <th className="p-4">Funding Type</th>
                    <th className="p-4 text-right">Contributed Amount</th>
                    <th className="p-4 text-right">Share %</th>
                    <th className="p-4 text-right">Principal Returned</th>
                    <th className="p-4 text-right">Interest / Profit Earned</th>
                    <th className="p-4 text-right">Total Returned</th>
                    <th className="p-4 text-right">Pending Principal</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {deal.fundings?.map((f: any) => {
                    const participantName =
                      f.sourceType === 'COMPANY'
                        ? 'Company Capital'
                        : f.sourceType === 'PARTNER'
                        ? f.partner?.name || 'Company Partner'
                        : f.investor?.name || 'Outside Investor';

                    const typeLabel =
                      f.sourceType === 'COMPANY'
                        ? 'Company Capital'
                        : f.sourceType === 'PARTNER'
                        ? 'Company Partner'
                        : 'Outside Investor';

                    const amount = Number(f.amount || 0);
                    const princRet = Number(f.principalReturned || 0);
                    const intEarned = Number(f.interestEarned || 0);
                    const totRet = princRet + intEarned;
                    const pendingPrinc = Math.max(0, amount - princRet);

                    return (
                      <tr key={f.id} className="hover:bg-stone-50">
                        <td className="p-4 font-bold text-stone-900">{participantName}</td>
                        <td className="p-4 text-stone-600 font-medium">{typeLabel}</td>
                        <td className="p-4 text-right font-mono font-black text-stone-900">{formatCurrency(f.amount)}</td>
                        <td className="p-4 text-right font-bold text-maroon-900">{Number(f.percentage).toFixed(2)}%</td>
                        <td className="p-4 text-right font-mono text-stone-700">{formatCurrency(princRet)}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-800">{formatCurrency(intEarned)}</td>
                        <td className="p-4 text-right font-mono font-bold text-stone-900">{formatCurrency(totRet)}</td>
                        <td className="p-4 text-right font-mono font-bold text-amber-900">{formatCurrency(pendingPrinc)}</td>
                        <td className="p-4 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {f.sourceType !== 'COMPANY' && (
                            <button
                              onClick={() => deleteFundingMutation.mutate(f.id)}
                              disabled={deleteFundingMutation.isPending}
                              className="text-stone-400 hover:text-red-700 p-2 rounded-lg transition-colors"
                              title="Remove funding"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AccessibleCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REPAYMENT PLAN */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <AccessibleCard className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-base">
            <div>
              <span className="text-sm text-stone-500 font-bold uppercase">Repayment Method</span>
              <p className="font-black text-stone-900 mt-1">{deal.interestType}</p>
            </div>
            <div>
              <span className="text-sm text-stone-500 font-bold uppercase">Frequency</span>
              <p className="font-black text-maroon-900 mt-1 uppercase">{deal.repaymentFrequency}</p>
            </div>
            <div>
              <span className="text-sm text-stone-500 font-bold uppercase">Installment Amount</span>
              <p className="font-black text-stone-900 mt-1">{formatCurrency(deal.installmentAmount)}</p>
            </div>
            <div>
              <span className="text-sm text-stone-500 font-bold uppercase">Total Installments</span>
              <p className="font-black text-stone-900 mt-1">{deal.numberOfRepayments} Periodic Payments</p>
            </div>
          </AccessibleCard>

          <AccessibleCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b-2 border-stone-200 bg-stone-100 text-stone-800 font-bold">
                    <th className="p-4">Installment #</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-right">Principal</th>
                    <th className="p-4 text-right">Interest</th>
                    <th className="p-4 text-right">Total Due</th>
                    <th className="p-4 text-right">Paid Amount</th>
                    <th className="p-4 text-right">Balance Due</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {deal.schedules?.map((sch: any) => (
                    <tr key={sch.id} className="hover:bg-stone-50">
                      <td className="p-4 font-mono font-bold text-stone-700">
                        {deal.repaymentFrequency === 'WEEKLY' ? `Week ${sch.installmentNumber}` : `#${sch.installmentNumber}`}
                      </td>
                      <td className="p-4 font-medium">{formatDate(sch.dueDate)}</td>
                      <td className="p-4 text-right font-mono font-medium">{formatCurrency(sch.principalAmount)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-800">{formatCurrency(sch.interestAmount)}</td>
                      <td className="p-4 text-right font-mono font-black text-stone-900">{formatCurrency(sch.totalDue)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-800">{formatCurrency(sch.paidAmount)}</td>
                      <td className="p-4 text-right font-mono font-bold text-amber-900">{formatCurrency(sch.balanceAmount)}</td>
                      <td className="p-4 text-center">
                        <StatusBadge status={sch.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccessibleCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COLLECTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'repayments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold text-stone-900">
                Recorded Repayment Collections
              </h3>
              <p className="text-base text-stone-600 mt-1">Click any collection record to view full transaction drawer and waterfall breakdown.</p>
            </div>
            <AccessibleButton
              variant="primary"
              onClick={() => setRepaymentModalOpen(true)}
              icon={<Receipt className="h-5 w-5" />}
            >
              + Record Collection
            </AccessibleButton>
          </div>

          <AccessibleCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b-2 border-stone-200 bg-stone-100 text-stone-800 font-bold">
                    <th className="p-4">Receipt #</th>
                    <th className="p-4">Payment Date</th>
                    <th className="p-4 text-right">Amount Received</th>
                    <th className="p-4 text-right">Principal</th>
                    <th className="p-4 text-right">Interest</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Ref / UTR</th>
                    <th className="p-4">Recorded By</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {deal.repayments?.map((rep: any) => (
                    <tr
                      key={rep.id}
                      onClick={() => setSelectedRepaymentForDetail(rep)}
                      className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-maroon-900 flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span>{rep.receiptNumber}</span>
                      </td>
                      <td className="p-4 font-medium">{formatDate(rep.paymentDate)}</td>
                      <td className="p-4 text-right font-mono font-black text-stone-900 text-lg">{formatCurrency(rep.amountReceived)}</td>
                      <td className="p-4 text-right font-mono text-blue-900 font-medium">{formatCurrency(rep.principalPortion)}</td>
                      <td className="p-4 text-right font-mono text-emerald-800 font-bold">{formatCurrency(rep.interestPortion)}</td>
                      <td className="p-4 font-semibold">{rep.paymentMethod}</td>
                      <td className="p-4 font-mono text-stone-600">{rep.referenceNumber || '-'}</td>
                      <td className="p-4 text-stone-600 font-medium">{rep.recordedBy?.fullName || 'Staff'}</td>
                      <td className="p-4 text-center">
                        <span className="text-maroon-900 text-sm font-bold underline hover:text-maroon-700">
                          View Breakdown →
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!deal.repayments || deal.repayments.length === 0) && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-base font-medium text-stone-500">
                        No repayments collected yet for this deal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AccessibleCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INVESTORS */}
      {/* ========================================================================= */}
      {activeTab === 'investors' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold text-stone-900">
            Outside Investor Syndication Returns
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {investorFunding.map((invF: any) => {
              const invested = Number(invF.amount || 0);
              const princReturned = Number(invF.principalReturned || 0);
              const intEarned = Number(invF.interestEarned || 0);
              const totalRet = princReturned + intEarned;
              const pending = Math.max(0, invested - princReturned);

              return (
                <AccessibleCard key={invF.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-stone-900">{invF.investor?.name || 'Outside Investor'}</h4>
                      <p className="text-sm text-purple-800 font-bold">{invF.investor?.investorCode || 'INV'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
                      {Number(invF.percentage).toFixed(1)}% Share
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-base pt-3 border-t-2 border-stone-100">
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Invested</span>
                      <p className="font-mono font-black text-stone-900 mt-0.5">{formatCurrency(invested)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Principal Returned</span>
                      <p className="font-mono font-bold text-stone-700 mt-0.5">{formatCurrency(princReturned)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Interest Earned</span>
                      <p className="font-mono font-bold text-emerald-800 mt-0.5">{formatCurrency(intEarned)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Pending Principal</span>
                      <p className="font-mono font-bold text-amber-900 mt-0.5">{formatCurrency(pending)}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 flex justify-between items-center text-base">
                    <span className="text-purple-950 font-bold">Total Payout Settled</span>
                    <span className="font-black text-purple-950 font-mono text-lg">{formatCurrency(totalRet)}</span>
                  </div>

                  <div className="pt-2">
                    <AccessibleButton
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedInvestorForStatement(invF.investorId);
                        setInvestorStatementModalOpen(true);
                      }}
                      icon={<TrendingUp className="h-5 w-5 text-purple-700" />}
                    >
                      View Statement / Export
                    </AccessibleButton>
                  </div>
                </AccessibleCard>
              );
            })}
            {investorFunding.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white border-2 border-stone-200 rounded-3xl text-stone-500 font-medium text-base">
                No outside investors configured for this deal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PARTNERS */}
      {/* ========================================================================= */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold text-stone-900">
            Company Partners Equity & Deployed Capital
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {partnerFunding.map((prtF: any) => {
              const capital = Number(prtF.amount || 0);
              const princReturned = Number(prtF.principalReturned || 0);
              const profitShare = Number(prtF.interestEarned || 0);
              const totalRet = princReturned + profitShare;
              const pending = Math.max(0, capital - princReturned);

              return (
                <AccessibleCard key={prtF.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-stone-900">{prtF.partner?.name || 'Partner'}</h4>
                      <p className="text-sm text-blue-800 font-bold">{prtF.partner?.partnerCode || 'PRT'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
                      {Number(prtF.percentage).toFixed(1)}% Share
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-base pt-3 border-t-2 border-stone-100">
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Capital Deployed</span>
                      <p className="font-mono font-black text-stone-900 mt-0.5">{formatCurrency(capital)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Principal Returned</span>
                      <p className="font-mono font-bold text-stone-700 mt-0.5">{formatCurrency(princReturned)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Profit Share Earned</span>
                      <p className="font-mono font-bold text-blue-900 mt-0.5">{formatCurrency(profitShare)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 font-bold uppercase block">Pending Capital</span>
                      <p className="font-mono font-bold text-amber-900 mt-0.5">{formatCurrency(pending)}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200 flex justify-between items-center text-base">
                    <span className="text-blue-950 font-bold">Total Payout Settled</span>
                    <span className="font-black text-blue-950 font-mono text-lg">{formatCurrency(totalRet)}</span>
                  </div>
                </AccessibleCard>
              );
            })}
            {partnerFunding.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white border-2 border-stone-200 rounded-3xl text-stone-500 font-medium text-base">
                No company partners allocated in this deal syndication.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROFIT DISTRIBUTION */}
      {/* ========================================================================= */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <AccessibleCard className="p-4">
              <span className="text-xs text-stone-500 font-bold uppercase">Interest Received</span>
              <p className="text-xl font-black text-stone-900 mt-1">{formatCurrency(interestRepaid)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-4">
              <span className="text-xs text-stone-600 font-bold uppercase">Company Commission</span>
              <p className="text-xl font-black text-stone-900 mt-1">{formatCurrency(totalCompanyCommission)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-4 bg-purple-50 border-purple-200">
              <span className="text-xs text-purple-900 font-bold uppercase">Investor Return</span>
              <p className="text-xl font-black text-purple-950 mt-1">{formatCurrency(totalInvestorReturns)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-4 bg-blue-50 border-blue-200">
              <span className="text-xs text-blue-900 font-bold uppercase">Partner Profit</span>
              <p className="text-xl font-black text-blue-950 mt-1">{formatCurrency(totalPartnerProfits)}</p>
            </AccessibleCard>
            <AccessibleCard className="p-4 bg-emerald-50 border-emerald-200">
              <span className="text-xs text-emerald-900 font-bold uppercase">Company Net Profit</span>
              <p className="text-xl font-black text-emerald-950 mt-1">{formatCurrency(totalCompanyProfit)}</p>
            </AccessibleCard>
          </div>

          <AccessibleCard className="overflow-hidden p-0">
            <div className="p-5 bg-stone-100 border-b-2 border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-base font-extrabold text-stone-900 uppercase tracking-wide">
                Distribution Snapshots History
              </h4>
              <span className="text-sm text-stone-600 font-medium">All calculations locked immutably per collection</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b-2 border-stone-200 bg-stone-50 text-stone-800 font-bold">
                    <th className="p-4">Receipt #</th>
                    <th className="p-4 text-right">Principal Split</th>
                    <th className="p-4 text-right">Interest Split</th>
                    <th className="p-4 text-right">Investor Payout</th>
                    <th className="p-4 text-right">Company Commission</th>
                    <th className="p-4 text-right">Company Net Profit</th>
                    <th className="p-4 text-right">Total Distributed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {deal.distributions?.map((dist: any) => {
                    const compProf = dist.companyProfits?.[0];
                    const invTotal = dist.investorReturns?.reduce((s: number, i: any) => s + Number(i.totalPayout || 0), 0) || 0;

                    return (
                      <tr key={dist.id} className="hover:bg-stone-50">
                        <td className="p-4 font-mono font-bold text-maroon-900">{dist.repayment?.receiptNumber || 'RCP'}</td>
                        <td className="p-4 text-right font-mono font-medium">{formatCurrency(dist.totalPrincipalSplit)}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-800">{formatCurrency(dist.totalInterestSplit)}</td>
                        <td className="p-4 text-right font-mono font-bold text-purple-900">{formatCurrency(invTotal)}</td>
                        <td className="p-4 text-right font-mono font-medium">{formatCurrency(compProf?.managementCommission || 0)}</td>
                        <td className="p-4 text-right font-mono font-black text-emerald-900">{formatCurrency(compProf?.totalCompanyProfit || 0)}</td>
                        <td className="p-4 text-right font-mono font-black text-stone-900">{formatCurrency(dist.totalDistributed)}</td>
                      </tr>
                    );
                  })}
                  {(!deal.distributions || deal.distributions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-base font-medium text-stone-500">
                        No profit distribution snapshots generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AccessibleCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold text-stone-900">
            Deal Double-Entry Accounting Journal
          </h3>

          <div className="space-y-4">
            {deal.transactions?.map((t: any) => (
              <AccessibleCard key={t.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-200 pb-3">
                  <div>
                    <span className="text-sm font-mono font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-xl border border-blue-300">
                      {t.transactionNo}
                    </span>
                    <span className="text-base text-stone-900 font-bold ml-3">{t.description}</span>
                  </div>
                  <span className="text-sm text-stone-500 font-mono font-bold">{formatDate(t.transactionDate)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-base">
                    <thead>
                      <tr className="text-sm text-stone-600 uppercase font-bold border-b border-stone-200">
                        <th className="pb-2">Account Code & Name</th>
                        <th className="pb-2">Narration</th>
                        <th className="pb-2 text-right">Debit (Dr)</th>
                        <th className="pb-2 text-right">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {t.ledgerEntries?.map((entry: any, i: number) => (
                        <tr key={i} className="hover:bg-stone-50">
                          <td className="py-2.5 font-mono font-bold text-stone-900">
                            {entry.account?.accountCode} - {entry.account?.accountName}
                          </td>
                          <td className="py-2.5 text-stone-600">{entry.narration}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-800">
                            {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-blue-900">
                            {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccessibleCard>
            ))}
            {(!deal.transactions || deal.transactions.length === 0) && (
              <div className="p-12 text-center bg-white border-2 border-stone-200 rounded-3xl text-stone-500 font-medium text-base">
                No ledger transactions posted yet for this deal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold text-stone-900">
            Deal Audit History & Creation Details
          </h3>

          <AccessibleCard className="p-6 space-y-6 text-base">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
                <span className="text-xs text-stone-500 font-bold uppercase block">Created By</span>
                <p className="text-lg font-bold text-stone-900 mt-1">{deal.createdBy?.fullName || 'System Admin'}</p>
                <p className="text-sm text-stone-600 mt-0.5">Role: {deal.createdBy?.role || 'SUPER_ADMIN'} • Created: {formatDate(deal.createdAt)}</p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
                <span className="text-xs text-stone-500 font-bold uppercase block">Approved By</span>
                <p className="text-lg font-bold text-emerald-900 mt-1">{deal.approvedBy?.fullName || 'Chief Investment Officer'}</p>
                <p className="text-sm text-stone-600 mt-0.5">Approved Date: {deal.approvedAt ? formatDate(deal.approvedAt) : 'Pending'}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
              <span className="text-xs text-stone-500 font-bold uppercase block mb-1">Deal Purpose & Audit Notes</span>
              <p className="text-stone-800 font-medium leading-relaxed">{deal.notes || deal.purpose || 'Standard private finance syndication deal.'}</p>
            </div>
          </AccessibleCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* Record Repayment Collection Modal */}
      <RecordRepaymentModal
        isOpen={repaymentModalOpen}
        onClose={() => setRepaymentModalOpen(false)}
        preselectedDealId={deal.id}
        onSuccessCallback={() => refetch()}
      />

      {/* Add Funding Participant Modal */}
      <AddFundingModal
        isOpen={addFundingModalOpen}
        onClose={() => setAddFundingModalOpen(false)}
        dealId={deal.id}
        approvedAmount={approvedAmount}
        currentFundedAmount={totalFunded}
      />

      {/* Detailed Payment Transaction Drawer */}
      <PaymentDetailDrawer
        isOpen={!!selectedRepaymentForDetail}
        onClose={() => setSelectedRepaymentForDetail(null)}
        repayment={selectedRepaymentForDetail}
        deal={deal}
      />

      {/* Edit Deal Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Finance Deal Details"
        subtitle={`Updating Deal ${deal.dealNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <AccessibleInput
            label="Deal Purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <AccessibleSelect
            label="Deal Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="CANCELLED">CANCELLED</option>
          </AccessibleSelect>

          <div>
            <label className="block text-base font-semibold text-stone-800 mb-2">
              Internal Remarks & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border-2 border-stone-300 rounded-xl px-4 py-3 text-base text-stone-900 focus:outline-none focus:border-maroon-800 focus:ring-4 focus:ring-maroon-800/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-stone-200">
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
              disabled={updateDealMutation.isPending}
            >
              {updateDealMutation.isPending ? 'Updating...' : 'Save Changes'}
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Delete Deal Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteDealMutation.mutate()}
        title="Delete Finance Deal"
        message={`Are you sure you want to delete Deal ${deal.dealNumber}? This will permanently remove its funding allocations, schedules, repayment records, and reverse ledger postings.`}
        isLoading={deleteDealMutation.isPending}
      />

      {/* Type 1: Client Payment Schedule Modal */}
      <ClientPaymentScheduleModal
        isOpen={clientScheduleModalOpen}
        onClose={() => setClientScheduleModalOpen(false)}
        deal={deal}
      />

      {/* Type 2: Investor Payment Statement Modal */}
      <InvestorStatementModal
        isOpen={investorStatementModalOpen}
        onClose={() => setInvestorStatementModalOpen(false)}
        deal={deal}
        preselectedInvestorId={selectedInvestorForStatement}
      />
    </div>
  );
};
