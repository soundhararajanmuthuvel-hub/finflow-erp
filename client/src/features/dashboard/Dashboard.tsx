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
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { AccessibleButton, AccessibleCard } from '../../components/common/AccessibleComponents';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-14 w-14 border-4 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold text-[#1A1A1A]">Loading Executive Dashboard...</p>
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

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header with Title and Large Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
            Executive Dashboard
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#3F3F46] mt-1.5 leading-relaxed">
            Real-time portfolio metrics, syndicate capital pools & waterfall distributions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <AccessibleButton
            variant="secondary"
            size="normal"
            icon={Receipt}
            onClick={() => setRepaymentModalOpen(true)}
            className="min-w-[200px]"
          >
            Record Repayment
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            size="normal"
            icon={PlusCircle}
            onClick={() => navigate('/deals/new')}
            className="min-w-[200px]"
          >
            Create Finance Deal
          </AccessibleButton>
        </div>
      </div>

      {/* Primary KPI Cards Grid (2 cards per row on laptop, 1 per row on mobile, min 340px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Active Finance Portfolio"
          value={formatCurrency(kpis.totalActiveFinance)}
          subtitle={`${kpis.activeDealsCount} active client finance deals`}
          icon={Wallet}
          colorScheme="maroon"
          onClick={() => navigate('/deals')}
        />
        <StatCard
          title="Client Outstanding"
          value={formatCurrency(kpis.totalClientOutstanding)}
          subtitle="Principal + expected finance charge"
          icon={CreditCard}
          colorScheme="blue"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          title="Outside Investor Capital"
          value={formatCurrency(kpis.totalInvestorCapital)}
          subtitle={`Pending Return: ${formatCurrency(kpis.investorReturnsPending)}`}
          icon={TrendingUp}
          colorScheme="purple"
          onClick={() => navigate('/investors')}
        />
        <StatCard
          title="Company Net Profit"
          value={formatCurrency(kpis.companyProfit)}
          subtitle="Management commissions + margin"
          icon={CircleDollarSign}
          colorScheme="emerald"
          onClick={() => navigate('/ledger')}
        />
      </div>

      {/* Secondary Performance Metrics Row (min 320px, 2 or 3 per row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-warm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[1.125rem] font-semibold text-[#1A1A1A] leading-snug">
              Total Interest Collected
            </p>
            <div className="h-11 w-11 rounded-xl bg-[#FEF3C7] text-[#B45309] border-2 border-[#FDE68A] flex items-center justify-center shrink-0">
              <Percent className="h-6 w-6 stroke-[2.3]" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-[2rem] sm:text-[2.25rem] font-bold text-[#1A1A1A] whitespace-nowrap leading-none">
              {formatCurrency(kpis.interestCollected)}
            </h4>
            <p className="text-[1.0625rem] font-normal text-[#3F3F46] mt-2">Across all repayments</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-warm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[1.125rem] font-semibold text-[#1A1A1A] leading-snug">
              Company Own Capital
            </p>
            <div className="h-11 w-11 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] border-2 border-[#BFDBFE] flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 stroke-[2.3]" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-[2rem] sm:text-[2.25rem] font-bold text-[#1A1A1A] whitespace-nowrap leading-none">
              {formatCurrency(kpis.totalCompanyCapital)}
            </h4>
            <p className="text-[1.0625rem] font-normal text-[#3F3F46] mt-2">Committed by partners</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#FEF2F2] border-2 border-[#FECACA] shadow-warm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[1.125rem] font-semibold text-[#B91C1C] leading-snug">
              Overdue Repayments
            </p>
            <div className="h-11 w-11 rounded-xl bg-white text-[#B91C1C] border-2 border-[#FECACA] flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="h-6 w-6 stroke-[2.3]" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-[2rem] sm:text-[2.25rem] font-bold text-[#B91C1C] whitespace-nowrap leading-none">
              {formatCurrency(kpis.overdueAmount)}
            </h4>
            <p className="text-[1.0625rem] font-semibold text-[#991B1B] mt-2">
              {overdueRepayments.length} installments pending
            </p>
          </div>
        </div>
      </div>

      {/* Analytics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Trends */}
        <AccessibleCard withTopAccent className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b-2 border-[#EDE7DE]">
            <div>
              <h3 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
                Disbursement vs Collection Flow
              </h3>
              <p className="text-[1.0625rem] text-[#3F3F46] font-normal mt-0.5">
                Monthly capital deployed vs client repayments collected
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFlows} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F6B3A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1F6B3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6CFC4" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#1A1A1A"
                  fontSize={14}
                  fontWeight={600}
                  tickLine={false}
                />
                <YAxis
                  stroke="#1A1A1A"
                  fontSize={14}
                  fontWeight={600}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#D6CFC4',
                    borderWidth: '2px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '16px',
                    fontWeight: '700',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  name="Disbursed"
                  stroke="#1E3A8A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDisbursed)"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke="#1F6B3A"
                  strokeWidth={3}
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
            <h3 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Syndicate Capital Pool
            </h3>
            <p className="text-[1.0625rem] text-[#3F3F46] font-normal mt-0.5">
              Capital distribution across active deals
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <div className="flex justify-between text-base font-bold mb-2">
                  <span className="text-[#1A1A1A]">Outside Investors</span>
                  <span className="text-[#6B21A8] whitespace-nowrap">{formatCurrency(kpis.totalInvestorCapital)}</span>
                </div>
                <div className="h-4 rounded-full bg-[#EDE7DE] overflow-hidden border border-[#D6CFC4]">
                  <div className="h-full bg-[#6B21A8] rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-base font-bold mb-2">
                  <span className="text-[#1A1A1A]">Company & Partner Capital</span>
                  <span className="text-[#1F6B3A] whitespace-nowrap">{formatCurrency(kpis.totalCompanyCapital)}</span>
                </div>
                <div className="h-4 rounded-full bg-[#EDE7DE] overflow-hidden border border-[#D6CFC4]">
                  <div className="h-full bg-[#1F6B3A] rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-[#FAF7F2] border-2 border-[#D6CFC4]">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#8B1A1A]">
              <CircleDollarSign className="h-6 w-6 stroke-[2.3]" />
              <span>Double-Entry Financial Integrity</span>
            </div>
            <p className="text-sm font-medium text-[#3F3F46] mt-1.5 leading-relaxed">
              Every client repayment is automatically journaled into balanced debit/credit ledger accounts.
            </p>
          </div>
        </AccessibleCard>
      </div>

      {/* Operational Feeds: Upcoming & Overdue Repayments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Repayments */}
        <AccessibleCard withTopAccent>
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#EDE7DE] mb-4">
            <div className="flex items-center gap-2.5">
              <Clock className="h-6 w-6 text-[#1F6B3A] stroke-[2.3]" />
              <h3 className="text-xl font-bold text-[#1A1A1A]">Upcoming Repayments</h3>
            </div>
            <button
              onClick={() => navigate('/repayments')}
              className="text-base text-[#8B1A1A] hover:underline font-bold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y-2 divide-[#EDE7DE]">
            {upcomingRepayments.length > 0 ? (
              upcomingRepayments.slice(0, 5).map((item: any) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">{item.deal?.client?.fullName}</p>
                    <p className="text-base text-[#3F3F46] font-semibold mt-0.5">
                      Deal {item.deal?.dealNumber} • Inst #{item.installmentNumber}
                    </p>
                    <p className="text-sm text-[#1F6B3A] font-bold mt-0.5">
                      Due: {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-[#1F6B3A] whitespace-nowrap">
                      {formatCurrency(item.balanceAmount)}
                    </p>
                    <StatusBadge status="UPCOMING" size="sm" className="mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-base font-semibold text-[#3F3F46]">
                <CheckCircle2 className="h-8 w-8 text-[#1F6B3A] mx-auto mb-2" />
                No upcoming repayments scheduled
              </div>
            )}
          </div>
        </AccessibleCard>

        {/* Critical Overdue Follow-ups */}
        <AccessibleCard withTopAccent>
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#EDE7DE] mb-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-6 w-6 text-[#B91C1C] stroke-[2.3]" />
              <h3 className="text-xl font-bold text-[#B91C1C]">Overdue Follow-ups</h3>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-base text-[#B91C1C] hover:underline font-bold flex items-center gap-1"
            >
              <span>Overdue Report</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y-2 divide-[#EDE7DE]">
            {overdueRepayments.length > 0 ? (
              overdueRepayments.slice(0, 5).map((item: any) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">{item.deal?.client?.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-base font-bold text-[#B91C1C]">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{item.deal?.client?.phone}</span>
                    </div>
                    <p className="text-sm text-[#7F1D1D] font-semibold mt-0.5">
                      Overdue since {formatDate(item.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-[#B91C1C] whitespace-nowrap">
                      {formatCurrency(item.balanceAmount)}
                    </p>
                    <StatusBadge status="OVERDUE" size="sm" className="mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-base font-semibold text-[#1F6B3A]">
                <CheckCircle2 className="h-8 w-8 text-[#1F6B3A] mx-auto mb-2" />
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
