import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Building2,
  CreditCard,
  Percent,
  CircleDollarSign,
  PlusCircle,
  Receipt,
  Clock,
  CheckCircle2,
  ArrowRight,
  Phone,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { AccessibleButton, AccessibleCard } from '../../components/common/AccessibleComponents';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { RecordRepaymentModal } from '../repayments/RecordRepaymentModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Operator';

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res: any = await apiClient.get('/dashboard/metrics');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-12 w-12 border-3 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full animate-spin mb-4" />
        <p className="text-base font-semibold text-slate-700">Loading Executive Dashboard...</p>
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

  const totalSyndicateCapital = Number(kpis.totalInvestorCapital || 0) + Number(kpis.totalCompanyCapital || 0);
  const investorCapitalPct = totalSyndicateCapital > 0 ? (Number(kpis.totalInvestorCapital || 0) / totalSyndicateCapital) * 100 : 0;
  const companyCapitalPct = totalSyndicateCapital > 0 ? (Number(kpis.totalCompanyCapital || 0) / totalSyndicateCapital) * 100 : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Contextual Greeting and Primary Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D6CFC4]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#1A1A1A] tracking-tight leading-tight">
              Executive Dashboard
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#8B1A1A]/10 text-[#8B1A1A] border border-[#8B1A1A]/20">
              {firstName}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#3F3F46] mt-1 leading-relaxed">
            Private finance portfolio, syndicated funding, collections, and distributions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          <AccessibleButton
            variant="secondary"
            size="normal"
            icon={Receipt}
            onClick={() => setRepaymentModalOpen(true)}
            className="w-full sm:w-auto justify-center"
          >
            Record Repayment
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            size="normal"
            icon={PlusCircle}
            onClick={() => navigate('/deals/new')}
            className="w-full sm:w-auto justify-center"
          >
            Create Finance Deal
          </AccessibleButton>
        </div>
      </div>

      {/* Primary KPI Cards Grid (4 cards on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Active Finance Portfolio"
          value={formatCurrency(kpis.totalActiveFinance)}
          subtitle={`${kpis.activeDealsCount} active client deals`}
          icon={Wallet}
          colorScheme="maroon"
          onClick={() => navigate('/deals')}
        />
        <StatCard
          title="Client Outstanding"
          value={formatCurrency(kpis.totalClientOutstanding)}
          subtitle="Principal + expected charges"
          icon={CreditCard}
          colorScheme="blue"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          title="Outside Investor Capital"
          value={formatCurrency(kpis.totalInvestorCapital)}
          subtitle={`Pending: ${formatCurrency(kpis.investorReturnsPending)}`}
          icon={TrendingUp}
          colorScheme="purple"
          onClick={() => navigate('/investors')}
        />
        <StatCard
          title="Company Net Profit"
          value={formatCurrency(kpis.companyProfit)}
          subtitle="Commissions + margin"
          icon={CircleDollarSign}
          colorScheme="emerald"
          onClick={() => navigate('/ledger')}
        />
      </div>

      {/* Secondary Performance Metrics Row (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Total Interest Collected"
          value={formatCurrency(kpis.interestCollected)}
          subtitle="Across all client repayments"
          icon={Percent}
          colorScheme="amber"
          onClick={() => navigate('/repayments')}
        />
        <StatCard
          title="Company Own Capital"
          value={formatCurrency(kpis.totalCompanyCapital)}
          subtitle="Committed by partners & company"
          icon={Building2}
          colorScheme="blue"
          onClick={() => navigate('/partners')}
        />
        <StatCard
          title="Overdue Repayments"
          value={formatCurrency(kpis.overdueAmount)}
          subtitle={`${overdueRepayments.length} installments pending`}
          icon={AlertTriangle}
          colorScheme="rose"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Analytics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Cash Flow Trends */}
        <AccessibleCard withTopAccent className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Disbursement vs Collection Flow
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Monthly capital deployed vs client repayments collected
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Disbursed
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Collected
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFlows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: '1px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  name="Disbursed"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDisbursed)"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AccessibleCard>

        {/* Capital Pool Breakdown */}
        <AccessibleCard withTopAccent className="flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Syndicate Capital Pool
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Capital distribution across active deals
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1.5">
                  <span className="text-[#3F3F46]">Outside Investors ({investorCapitalPct.toFixed(1)}%)</span>
                  <span className="text-purple-700 font-bold whitespace-nowrap">{formatCurrency(kpis.totalInvestorCapital)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#E5DFD5]/60 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, investorCapitalPct))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1.5">
                  <span className="text-[#3F3F46]">Company & Partner Capital ({companyCapitalPct.toFixed(1)}%)</span>
                  <span className="text-emerald-700 font-bold whitespace-nowrap">{formatCurrency(kpis.totalCompanyCapital)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#E5DFD5]/60 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, companyCapitalPct))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8B1A1A]">
              <CircleDollarSign className="h-4 w-4 stroke-[2.2]" />
              <span>Double-Entry Financial Integrity</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Every client repayment is automatically journaled into balanced debit/credit ledger accounts.
            </p>
          </div>
        </AccessibleCard>
      </div>

      {/* Operational Feeds: Upcoming & Overdue Repayments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Upcoming Repayments */}
        <AccessibleCard withTopAccent>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-emerald-600 stroke-[2.2]" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Upcoming Repayments</h3>
            </div>
            <button
              onClick={() => navigate('/repayments')}
              className="text-xs sm:text-sm text-[#8B1A1A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingRepayments.length > 0 ? (
              upcomingRepayments.slice(0, 5).map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.deal?.client?.fullName}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Deal {item.deal?.dealNumber} • Inst #{item.installmentNumber}
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Due: {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(item.balanceAmount)}
                    </p>
                    <StatusBadge status="UPCOMING" size="sm" className="mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs sm:text-sm font-medium text-slate-500">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                No upcoming repayments scheduled
              </div>
            )}
          </div>
        </AccessibleCard>

        {/* Critical Overdue Follow-ups */}
        <AccessibleCard withTopAccent>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600 stroke-[2.2]" />
              <h3 className="text-base sm:text-lg font-bold text-rose-700">Overdue Follow-ups</h3>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs sm:text-sm text-rose-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Overdue Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {overdueRepayments.length > 0 ? (
              overdueRepayments.slice(0, 5).map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.deal?.client?.fullName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-600">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{item.deal?.client?.phone}</span>
                    </div>
                    <p className="text-xs text-rose-600 font-medium mt-0.5">
                      Overdue since {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-rose-700 whitespace-nowrap">
                      {formatCurrency(item.balanceAmount)}
                    </p>
                    <StatusBadge status="OVERDUE" size="sm" className="mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs sm:text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                Portfolio healthy! No overdue repayments pending.
              </div>
            )}
          </div>
        </AccessibleCard>
      </div>

      {/* Repayment Recording Modal */}
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

export default Dashboard;
