import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  CreditCard,
  Percent,
  CircleDollarSign,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import apiClient from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { RecordRepaymentModal } from '../repayments/RecordRepaymentModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res: any = await apiClient.get('/dashboard/metrics');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {
    totalActiveFinance: 0,
    totalClientOutstanding: 0,
    totalInvestorCapital: 0,
    totalCompanyCapital: 0,
    totalCollected: 0,
    principalCollected: 0,
    interestCollected: 0,
    companyProfit: 0,
    investorReturnsPending: 0,
    overdueAmount: 0,
    activeDealsCount: 0,
  };

  const monthlyFlows = dashboardData?.charts?.monthlyFlows || [];
  const upcomingRepayments = dashboardData?.upcomingRepayments || [];
  const overdueRepayments = dashboardData?.overdueRepayments || [];
  const recentRepayments = dashboardData?.recentRepayments || [];

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time portfolio metrics, syndicate capital pools & waterfall distributions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRepaymentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition-all"
          >
            <Receipt className="h-4 w-4 text-emerald-400" />
            <span>Record Repayment</span>
          </button>
          <button
            onClick={() => navigate('/deals/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-glow transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Finance Deal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Finance Portfolio"
          value={formatCurrency(kpis.totalActiveFinance)}
          subtitle={`${kpis.activeDealsCount} active client deals`}
          icon={Wallet}
          colorScheme="emerald"
        />
        <StatCard
          title="Total Client Outstanding"
          value={formatCurrency(kpis.totalClientOutstanding)}
          subtitle="Principal + remaining interest"
          icon={CreditCard}
          colorScheme="blue"
        />
        <StatCard
          title="Outside Investor Capital"
          value={formatCurrency(kpis.totalInvestorCapital)}
          subtitle={`Pending Return: ${formatCurrency(kpis.investorReturnsPending)}`}
          icon={TrendingUp}
          colorScheme="purple"
        />
        <StatCard
          title="Company Net Profit"
          value={formatCurrency(kpis.companyProfit)}
          subtitle="Management commissions + margin"
          icon={CircleDollarSign}
          colorScheme="emerald"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Interest Collected</p>
            <h4 className="text-xl font-bold text-white mt-1">{formatCurrency(kpis.interestCollected)}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all client repayments</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Company Own Capital</p>
            <h4 className="text-xl font-bold text-white mt-1">{formatCurrency(kpis.totalCompanyCapital)}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Committed by owners / partners</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-400 font-semibold uppercase">Overdue Repayments</p>
            <h4 className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(kpis.overdueAmount)}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{overdueRepayments.length} installments pending</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Disbursement vs Collection Flow</h3>
              <p className="text-xs text-slate-400">Monthly capital deployed vs client repayments received</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFlows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" textAnchor="middle" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDisbursed)" />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capital Mix & Quick Syndicate Split */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Syndicate Capital Pool</h3>
            <p className="text-xs text-slate-400">Total capital distribution across active deals</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Outside Investors</span>
                  <span className="text-purple-400">{formatCurrency(kpis.totalInvestorCapital)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Company & Partner Capital</span>
                  <span className="text-emerald-400">{formatCurrency(kpis.totalCompanyCapital)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CircleDollarSign className="h-4 w-4" />
              <span>Double-Entry Integrity</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Every collected rupee triggers automated principal recovery, investor ROI payouts, company commissions, and balanced ledger journaling.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Feeds: Upcoming & Overdue Repayments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Repayments */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Upcoming Due Repayments</h3>
            </div>
            <button
              onClick={() => navigate('/repayments')}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {upcomingRepayments.length > 0 ? (
              upcomingRepayments.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{item.deal.client.fullName}</p>
                    <p className="text-slate-500 text-[11px]">
                      Deal {item.deal.dealNumber} • Inst #{item.installmentNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{formatCurrency(item.balanceAmount)}</p>
                    <p className="text-slate-400 text-[11px]">Due: {formatDate(item.dueDate)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No upcoming repayments scheduled</p>
            )}
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Critical Overdue Follow-ups</h3>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Overdue Report
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {overdueRepayments.length > 0 ? (
              overdueRepayments.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{item.deal.client.fullName}</p>
                    <p className="text-rose-400 text-[11px]">
                      Overdue since {formatDate(item.dueDate)} ({item.deal.client.phone})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-400">{formatCurrency(item.balanceAmount)}</p>
                    <StatusBadge status="OVERDUE" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No overdue installments! Portfolio healthy.</p>
            )}
          </div>
        </div>
      </div>

      {/* Repayment Modal */}
      <RecordRepaymentModal
        isOpen={repaymentModalOpen}
        onClose={() => {
          setRepaymentModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
