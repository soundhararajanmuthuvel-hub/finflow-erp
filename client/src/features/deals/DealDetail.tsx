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
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Finance Deal Not Found</h3>
        <p className="text-xs text-slate-400">The requested finance syndication deal does not exist or has been deleted.</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/deals')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Go to Deal Portfolio
          </button>
          <button
            onClick={() => resetDemoMutation.mutate()}
            disabled={resetDemoMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resetDemoMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Load Demo Deal</span>
          </button>
        </div>
      </div>
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
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP SECTION: CLIENT, DEAL ID, STATUS & CORE VALUES */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {deal.dealNumber}
              </span>
              <StatusBadge status={deal.status} />
              {isDemoDeal && (
                <span className="text-[11px] font-black text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  DEMO DATA
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white">{deal.client?.fullName}</h1>
            <p className="text-xs text-slate-400">
              {deal.client?.businessName ? <span className="text-slate-300 font-semibold">{deal.client.businessName} • </span> : null}
              {deal.purpose || 'Working Capital Syndication'} • Started: <span className="text-slate-300">{formatDate(deal.startDate)}</span>
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => resetDemoMutation.mutate()}
              disabled={resetDemoMutation.isPending}
              title="Regenerates dynamic test deal relative to today's date"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resetDemoMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Reset Demo Data</span>
            </button>

            {/* Print Client Schedule Button (Requirement 7 & 17) */}
            <button
              onClick={() => setClientScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Print Client Schedule</span>
            </button>

            {/* Investor Statements Button (Requirement 9 & 17) */}
            {investorFunding.length > 0 && (
              <button
                onClick={() => {
                  setSelectedInvestorForStatement(investorFunding[0]?.investorId);
                  setInvestorStatementModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 text-xs font-bold border border-purple-500/30 transition-all shadow-sm"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Investor Statements</span>
              </button>
            )}

            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-bold border border-slate-700 transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Deal</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-xs font-bold border border-slate-700 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            {deal.status === 'PENDING_APPROVAL' && (
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Deal</span>
              </button>
            )}

            {deal.status === 'APPROVED' && (
              <button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Activate & Disburse</span>
              </button>
            )}

            {(deal.status === 'ACTIVE' || deal.status === 'OVERDUE') && (
              <button
                onClick={() => setRepaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
              >
                <Receipt className="h-4 w-4" />
                <span>+ Record Collection</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial Header 4-KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Finance Amount</span>
            <p className="text-xl font-black text-white mt-1">{formatCurrency(deal.financeAmountApproved)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Required: {formatCurrency(deal.financeAmountRequired)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Total Payable</span>
            <p className="text-xl font-black text-blue-300 mt-1">{formatCurrency(totalPayable)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {deal.numberOfRepayments} × {formatCurrency(deal.installmentAmount)} ({deal.repaymentFrequency})
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Total Collected</span>
            <p className="text-xl font-black text-emerald-300 mt-1">{formatCurrency(totalCollected)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Principal: {formatCurrency(principalRepaid)} • Interest: {formatCurrency(interestRepaid)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Outstanding</span>
            <p className="text-xl font-black text-amber-300 mt-1">{formatCurrency(outstandingTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Principal Remaining: {formatCurrency(outstandingPrincipal)}</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FUNDING SUMMARY & ALLOCATION VISUALIZATION BAR (REQUIREMENT 4) */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Syndicate Funding Allocation Summary
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total Required: <span className="text-white font-bold">{formatCurrency(approvedAmount)}</span> • Total Funded: <span className="text-emerald-400 font-bold">{formatCurrency(totalFunded)} ({fundedPercent.toFixed(1)}%)</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddFundingModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>+ Add Funding Participant</span>
              </button>
            </div>
          </div>

          {/* Progress Bar Visualization */}
          <div className="w-full bg-slate-900 h-3.5 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${companyPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500 hover:brightness-110"
              title={`Company Capital: ${formatCurrency(companyTotal)} (${companyPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${investorPct}%` }}
              className="bg-purple-500 h-full transition-all duration-500 hover:brightness-110"
              title={`Outside Investors: ${formatCurrency(investorTotal)} (${investorPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${partnerPct}%` }}
              className="bg-cyan-500 h-full transition-all duration-500 hover:brightness-110"
              title={`Company Partners: ${formatCurrency(partnerTotal)} (${partnerPct.toFixed(1)}%)`}
            />
          </div>

          {/* Participant Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-bold text-white">Company Capital</p>
                  <p className="text-[11px] text-slate-400">{companyPct.toFixed(1)}% Allocation</p>
                </div>
              </div>
              <p className="font-black text-emerald-400 font-mono">{formatCurrency(companyTotal)}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <div>
                  <p className="font-bold text-white">Outside Investors</p>
                  <p className="text-[11px] text-slate-400">{investorFunding.length} Participants ({investorPct.toFixed(1)}%)</p>
                </div>
              </div>
              <p className="font-black text-purple-300 font-mono">{formatCurrency(investorTotal)}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <div>
                  <p className="font-bold text-white">Company Partners</p>
                  <p className="text-[11px] text-slate-400">{partnerFunding.length} Partners ({partnerPct.toFixed(1)}%)</p>
                </div>
              </div>
              <p className="font-black text-cyan-300 font-mono">{formatCurrency(partnerTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 9 DEDICATED TABS NAVIGATION (REQUIREMENT 5) */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-800">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-2xl transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-400 border-emerald-500 bg-slate-900 shadow-md'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW (REQUIREMENT 6 - 14 FINANCIAL METRICS) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">1. Finance Amount</span>
              <p className="text-lg font-bold text-white mt-1">{formatCurrency(deal.financeAmountApproved)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">2. Disbursed Amount</span>
              <p className="text-lg font-bold text-white mt-1">
                {deal.status === 'ACTIVE' || deal.status === 'COMPLETED' || deal.status === 'OVERDUE'
                  ? formatCurrency(deal.financeAmountApproved)
                  : '₹0.00 (Pending)'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-blue-400 font-semibold uppercase">3. Total Payable</span>
              <p className="text-lg font-bold text-blue-300 mt-1">{formatCurrency(deal.totalPayable)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-semibold uppercase">4. Total Collected</span>
              <p className="text-lg font-bold text-emerald-300 mt-1">{formatCurrency(totalCollected)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">5. Principal Collected</span>
              <p className="text-lg font-bold text-white mt-1">{formatCurrency(principalRepaid)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-semibold uppercase">6. Interest Collected</span>
              <p className="text-lg font-bold text-emerald-300 mt-1">{formatCurrency(interestRepaid)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-amber-400 font-semibold uppercase">7. Outstanding Principal</span>
              <p className="text-lg font-bold text-amber-300 mt-1">{formatCurrency(outstandingPrincipal)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-amber-400 font-semibold uppercase">8. Outstanding Interest</span>
              <p className="text-lg font-bold text-amber-300 mt-1">
                {formatCurrency(Math.max(0, Number(deal.totalInterest || 0) - interestRepaid))}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-teal-400 font-semibold uppercase">9. Company Commission</span>
              <p className="text-lg font-bold text-teal-300 mt-1">{formatCurrency(totalCompanyCommission)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-purple-400 font-semibold uppercase">10. Investor Returns</span>
              <p className="text-lg font-bold text-purple-300 mt-1">{formatCurrency(totalInvestorReturns)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-cyan-400 font-semibold uppercase">11. Partner Profit Share</span>
              <p className="text-lg font-bold text-cyan-300 mt-1">{formatCurrency(totalPartnerProfits)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-semibold uppercase">12. Company Net Profit</span>
              <p className="text-lg font-bold text-emerald-300 mt-1">{formatCurrency(totalCompanyProfit)}</p>
            </div>
          </div>

          {/* Collection Status Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Next Collection Due
              </span>
              {nextPendingSchedule ? (
                <div>
                  <p className="text-lg font-bold text-white font-mono">{formatCurrency(nextPendingSchedule.totalDue)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Installment #{nextPendingSchedule.installmentNumber} • Due Date: <span className="text-emerald-400 font-bold">{formatDate(nextPendingSchedule.dueDate)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-bold mt-2">All installments fully settled!</p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Repayment Frequency
              </span>
              <p className="text-lg font-bold text-white uppercase">{deal.repaymentFrequency}</p>
              <p className="text-xs text-slate-400 mt-1">
                Method: <span className="text-slate-200 font-semibold">{deal.interestType}</span> • Rate: <span className="text-emerald-400 font-bold">{deal.interestRate}%</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-rose-400 font-bold uppercase tracking-wider block mb-1">
                Overdue Balance
              </span>
              <p className="text-lg font-bold text-rose-400 font-mono">{formatCurrency(overdueAmount)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {overdueSchedules.length > 0 ? `${overdueSchedules.length} installment(s) currently overdue` : 'No overdue payments'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FUNDING (REQUIREMENT 7) */}
      {/* ========================================================================= */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Syndicate Funding Participants Table
            </h3>
            <button
              onClick={() => setAddFundingModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Add Funding Participant</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 uppercase font-bold">
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
                <tbody className="divide-y divide-slate-800">
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
                      <tr key={f.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-bold text-white">{participantName}</td>
                        <td className="p-4 text-slate-400">{typeLabel}</td>
                        <td className="p-4 text-right font-mono font-bold text-white">{formatCurrency(f.amount)}</td>
                        <td className="p-4 text-right font-bold text-emerald-400">{Number(f.percentage).toFixed(2)}%</td>
                        <td className="p-4 text-right font-mono text-slate-200">{formatCurrency(princRet)}</td>
                        <td className="p-4 text-right font-mono text-emerald-300">{formatCurrency(intEarned)}</td>
                        <td className="p-4 text-right font-mono font-bold text-teal-300">{formatCurrency(totRet)}</td>
                        <td className="p-4 text-right font-mono text-amber-300">{formatCurrency(pendingPrinc)}</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {f.sourceType !== 'COMPANY' && (
                            <button
                              onClick={() => deleteFundingMutation.mutate(f.id)}
                              disabled={deleteFundingMutation.isPending}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                              title="Remove funding"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REPAYMENT PLAN (REQUIREMENT 8) */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase">Repayment Method</span>
              <p className="font-bold text-white mt-0.5">{deal.interestType}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase">Frequency</span>
              <p className="font-bold text-emerald-400 mt-0.5 uppercase">{deal.repaymentFrequency}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase">Installment Amount</span>
              <p className="font-bold text-white mt-0.5">{formatCurrency(deal.installmentAmount)}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase">Total Installments</span>
              <p className="font-bold text-white mt-0.5">{deal.numberOfRepayments} Periodic Payments</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 uppercase font-bold">
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
                <tbody className="divide-y divide-slate-800">
                  {deal.schedules?.map((sch: any) => (
                    <tr key={sch.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-slate-300">
                        {deal.repaymentFrequency === 'WEEKLY' ? `Week ${sch.installmentNumber}` : `#${sch.installmentNumber}`}
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{formatDate(sch.dueDate)}</td>
                      <td className="p-4 text-right font-mono text-slate-300">{formatCurrency(sch.principalAmount)}</td>
                      <td className="p-4 text-right font-mono text-emerald-400">{formatCurrency(sch.interestAmount)}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">{formatCurrency(sch.totalDue)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(sch.paidAmount)}</td>
                      <td className="p-4 text-right font-mono font-bold text-amber-300">{formatCurrency(sch.balanceAmount)}</td>
                      <td className="p-4 text-center">
                        <StatusBadge status={sch.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COLLECTIONS (REQUIREMENT 9 & 10) */}
      {/* ========================================================================= */}
      {activeTab === 'repayments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recorded Repayment Collections
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Click any collection record to view full transaction drawer and waterfall breakdown</p>
            </div>
            <button
              onClick={() => setRepaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-glow transition-all"
            >
              <Receipt className="h-4 w-4" />
              <span>+ Record Collection</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 uppercase font-bold">
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
                <tbody className="divide-y divide-slate-800">
                  {deal.repayments?.map((rep: any) => (
                    <tr
                      key={rep.id}
                      onClick={() => setSelectedRepaymentForDetail(rep)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-all"
                    >
                      <td className="p-4 font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" />
                        <span>{rep.receiptNumber}</span>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{formatDate(rep.paymentDate)}</td>
                      <td className="p-4 text-right font-mono font-bold text-white text-sm">{formatCurrency(rep.amountReceived)}</td>
                      <td className="p-4 text-right font-mono text-blue-300">{formatCurrency(rep.principalPortion)}</td>
                      <td className="p-4 text-right font-mono text-emerald-400">{formatCurrency(rep.interestPortion)}</td>
                      <td className="p-4 text-slate-300 font-semibold">{rep.paymentMethod}</td>
                      <td className="p-4 font-mono text-slate-400">{rep.referenceNumber || '-'}</td>
                      <td className="p-4 text-slate-400">{rep.recordedBy?.fullName || 'Staff'}</td>
                      <td className="p-4 text-center">
                        <span className="text-emerald-400 text-xs font-bold hover:underline">
                          View Breakdown →
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!deal.repayments || deal.repayments.length === 0) && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No repayments collected yet for this deal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INVESTORS (REQUIREMENT 11) */}
      {/* ========================================================================= */}
      {activeTab === 'investors' && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Outside Investor Syndication Returns
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {investorFunding.map((invF: any) => {
              const invested = Number(invF.amount || 0);
              const princReturned = Number(invF.principalReturned || 0);
              const intEarned = Number(invF.interestEarned || 0);
              const totalRet = princReturned + intEarned;
              const pending = Math.max(0, invested - princReturned);

              return (
                <div key={invF.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{invF.investor?.name || 'Outside Investor'}</h4>
                      <p className="text-[11px] text-purple-400 font-semibold">{invF.investor?.investorCode || 'INV'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {Number(invF.percentage).toFixed(1)}% Share
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Invested</span>
                      <p className="font-bold text-white font-mono mt-0.5">{formatCurrency(invested)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Principal Returned</span>
                      <p className="font-bold text-slate-200 font-mono mt-0.5">{formatCurrency(princReturned)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Interest Earned</span>
                      <p className="font-bold text-emerald-400 font-mono mt-0.5">{formatCurrency(intEarned)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Pending Principal</span>
                      <p className="font-bold text-amber-300 font-mono mt-0.5">{formatCurrency(pending)}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Total Payout Settled</span>
                    <span className="font-black text-purple-200 font-mono text-sm">{formatCurrency(totalRet)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvestorForStatement(invF.investorId);
                        setInvestorStatementModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all shadow-sm"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>View Statement / Export</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {investorFunding.length === 0 && (
              <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                No outside investors configured for this deal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PARTNERS (REQUIREMENT 12) */}
      {/* ========================================================================= */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Company Partners Equity & Deployed Capital
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partnerFunding.map((prtF: any) => {
              const capital = Number(prtF.amount || 0);
              const princReturned = Number(prtF.principalReturned || 0);
              const profitShare = Number(prtF.interestEarned || 0);
              const totalRet = princReturned + profitShare;
              const pending = Math.max(0, capital - princReturned);

              return (
                <div key={prtF.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{prtF.partner?.name || 'Partner'}</h4>
                      <p className="text-[11px] text-cyan-400 font-semibold">{prtF.partner?.partnerCode || 'PRT'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {Number(prtF.percentage).toFixed(1)}% Share
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Capital Deployed</span>
                      <p className="font-bold text-white font-mono mt-0.5">{formatCurrency(capital)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Principal Returned</span>
                      <p className="font-bold text-slate-200 font-mono mt-0.5">{formatCurrency(princReturned)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Profit Share Earned</span>
                      <p className="font-bold text-cyan-300 font-mono mt-0.5">{formatCurrency(profitShare)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Pending Capital</span>
                      <p className="font-bold text-amber-300 font-mono mt-0.5">{formatCurrency(pending)}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Total Payout Settled</span>
                    <span className="font-black text-cyan-200 font-mono text-sm">{formatCurrency(totalRet)}</span>
                  </div>
                </div>
              );
            })}
            {partnerFunding.length === 0 && (
              <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                No company partners allocated in this deal syndication.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROFIT DISTRIBUTION (REQUIREMENT 12) */}
      {/* ========================================================================= */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Interest Received</span>
              <p className="text-lg font-black text-white mt-1">{formatCurrency(interestRepaid)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-teal-400 font-bold uppercase">Company Commission</span>
              <p className="text-lg font-black text-teal-300 mt-1">{formatCurrency(totalCompanyCommission)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-purple-400 font-bold uppercase">Investor Return</span>
              <p className="text-lg font-black text-purple-300 mt-1">{formatCurrency(totalInvestorReturns)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">Partner Profit</span>
              <p className="text-lg font-black text-cyan-300 mt-1">{formatCurrency(totalPartnerProfits)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Company Net Profit</span>
              <p className="text-lg font-black text-emerald-300 mt-1">{formatCurrency(totalCompanyProfit)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Distribution Snapshots History
              </h4>
              <span className="text-[11px] text-slate-400">All calculations locked immutably per collection</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                    <th className="p-4">Receipt #</th>
                    <th className="p-4 text-right">Principal Split</th>
                    <th className="p-4 text-right">Interest Split</th>
                    <th className="p-4 text-right">Investor Payout</th>
                    <th className="p-4 text-right">Company Commission</th>
                    <th className="p-4 text-right">Company Net Profit</th>
                    <th className="p-4 text-right">Total Distributed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deal.distributions?.map((dist: any) => {
                    const compProf = dist.companyProfits?.[0];
                    const invTotal = dist.investorReturns?.reduce((s: number, i: any) => s + Number(i.totalPayout || 0), 0) || 0;

                    return (
                      <tr key={dist.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-emerald-400">{dist.repayment?.receiptNumber || 'RCP'}</td>
                        <td className="p-4 text-right font-mono text-slate-300">{formatCurrency(dist.totalPrincipalSplit)}</td>
                        <td className="p-4 text-right font-mono text-emerald-400">{formatCurrency(dist.totalInterestSplit)}</td>
                        <td className="p-4 text-right font-mono text-purple-300">{formatCurrency(invTotal)}</td>
                        <td className="p-4 text-right font-mono text-teal-300">{formatCurrency(compProf?.managementCommission || 0)}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-300">{formatCurrency(compProf?.totalCompanyProfit || 0)}</td>
                        <td className="p-4 text-right font-mono font-bold text-white">{formatCurrency(dist.totalDistributed)}</td>
                      </tr>
                    );
                  })}
                  {(!deal.distributions || deal.distributions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No profit distribution snapshots generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: LEDGER (JOURNAL ENTRIES) */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Deal Double-Entry Accounting Journal
          </h3>

          <div className="space-y-4">
            {deal.transactions?.map((t: any) => (
              <div key={t.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      {t.transactionNo}
                    </span>
                    <span className="text-xs text-white font-bold ml-2.5">{t.description}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{formatDate(t.transactionDate)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[11px] text-slate-500 uppercase font-semibold">
                        <th className="pb-2">Account Code & Name</th>
                        <th className="pb-2">Narration</th>
                        <th className="pb-2 text-right">Debit (Dr)</th>
                        <th className="pb-2 text-right">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {t.ledgerEntries?.map((entry: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-2 font-mono font-bold text-slate-300">
                            {entry.account?.accountCode} - {entry.account?.accountName}
                          </td>
                          <td className="py-2 text-slate-400">{entry.narration}</td>
                          <td className="py-2 text-right font-mono font-bold text-emerald-400">
                            {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-blue-400">
                            {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {(!deal.transactions || deal.transactions.length === 0) && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                No ledger transactions posted yet for this deal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: AUDIT (TIMELINE & LOGS) */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Deal Audit History & Creation Details
          </h3>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold uppercase">Created By</span>
                <p className="font-bold text-white mt-1">{deal.createdBy?.fullName || 'System Admin'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Role: {deal.createdBy?.role || 'SUPER_ADMIN'} • Created: {formatDate(deal.createdAt)}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-semibold uppercase">Approved By</span>
                <p className="font-bold text-emerald-400 mt-1">{deal.approvedBy?.fullName || 'Chief Investment Officer'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Approved Date: {deal.approvedAt ? formatDate(deal.approvedAt) : 'Pending'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 font-semibold uppercase block mb-1">Deal Purpose & Audit Notes</span>
              <p className="text-slate-300 font-medium">{deal.notes || deal.purpose || 'Standard private finance syndication deal.'}</p>
            </div>
          </div>
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
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Deal Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
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
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Internal Remarks & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {updateDealMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
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

      {/* Type 1: Client Payment Schedule Modal (Client-facing branded letterhead) */}
      <ClientPaymentScheduleModal
        isOpen={clientScheduleModalOpen}
        onClose={() => setClientScheduleModalOpen(false)}
        deal={deal}
      />

      {/* Type 2: Investor Payment Statement Modal (Internal/Investor-facing statement) */}
      <InvestorStatementModal
        isOpen={investorStatementModalOpen}
        onClose={() => setInvestorStatementModalOpen(false)}
        deal={deal}
        preselectedInvestorId={selectedInvestorForStatement}
      />
    </div>
  );
};
