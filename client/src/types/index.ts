export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'FINANCE_MANAGER' | 'STAFF' | 'VIEWER';

export type DealStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'DEFAULTED';

export type InterestType = 'FLAT' | 'REDUCING_BALANCE' | 'CUSTOM';
export type RepaymentFrequency = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type FundingSourceType = 'COMPANY' | 'PARTNER' | 'OUTSIDE_INVESTOR';
export type ScheduleStatus = 'UPCOMING' | 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WAIVED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  company: {
    id: string;
    name: string;
    currencySymbol: string;
  };
}

export interface Client {
  id: string;
  clientCode: string;
  fullName: string;
  businessName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gstin?: string;
  businessType?: string;
  industry?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  totalFinanceReceived?: number;
  activeFinance?: number;
  totalRepaid?: number;
  outstandingAmount?: number;
  dealsCount?: number;
  deals?: any[];
  summary?: {
    totalFinanceReceived: number;
    totalInterestPayable: number;
    totalRepaid: number;
    outstandingAmount: number;
    overdueAmount: number;
  };
}

export interface Partner {
  id: string;
  partnerCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  pan?: string;
  capitalContribution: number | string;
  sharePercentage: number | string;
  status: string;
  totalInvested?: number;
  principalReturned?: number;
  profitEarned?: number;
  pendingPrincipal?: number;
  activeDealsCount?: number;
  fundings?: any[];
  partnerReturns?: any[];
}

export interface Investor {
  id: string;
  investorCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  pan?: string;
  bankName?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  status: string;
  totalInvested?: number;
  principalReturned?: number;
  totalPrincipalReturned?: number;
  interestEarned?: number;
  totalInterestEarned?: number;
  totalPayout?: number;
  pendingPrincipal?: number;
  activeDealsCount?: number;
  fundings?: any[];
  returns?: any[];
  portfolioSummary?: {
    totalInvested: number;
    principalReturned: number;
    interestEarned: number;
    totalPayout: number;
    pendingPrincipal: number;
    activeDealsCount: number;
  };
}

export interface DealFunding {
  id?: string;
  sourceType: FundingSourceType;
  partnerId?: string | null;
  investorId?: string | null;
  partner?: { id: string; name: string };
  investor?: { id: string; name: string };
  amount: number | string;
  percentage?: number | string;
  expectedReturnRate?: number | string;
  principalReturned?: number | string;
  interestEarned?: number | string;
  status?: string;
  notes?: string;
}

export interface RepaymentScheduleItem {
  id?: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number | string;
  interestAmount: number | string;
  totalDue: number | string;
  paidPrincipal?: number | string;
  paidInterest?: number | string;
  paidAmount?: number | string;
  balanceAmount: number | string;
  status: ScheduleStatus;
  paidDate?: string | null;
}

export interface FinanceDeal {
  id: string;
  dealNumber: string;
  clientId: string;
  client: Client;
  financeAmountRequired: number | string;
  financeAmountApproved: number | string;
  startDate: string;
  endDate: string;
  interestType: InterestType;
  interestRate: number | string;
  totalInterest: number | string;
  totalPayable: number | string;
  repaymentFrequency: RepaymentFrequency;
  numberOfRepayments: number;
  installmentAmount: number | string;
  totalPrincipalRepaid: number | string;
  totalInterestRepaid: number | string;
  outstandingPrincipal: number | string;
  outstandingTotal: number | string;
  status: DealStatus;
  purpose?: string;
  notes?: string;
  createdById: string;
  createdBy?: { id: string; fullName: string; role: string };
  approvedById?: string | null;
  approvedBy?: { id: string; fullName: string; role: string } | null;
  approvedAt?: string | null;
  activatedAt?: string | null;
  completedAt?: string | null;
  fundings: DealFunding[];
  schedules?: RepaymentScheduleItem[];
  repayments?: any[];
  distributionRules?: any[];
  distributions?: any[];
  transactions?: any[];
}

export interface DashboardMetrics {
  kpis: {
    totalActiveFinance: number;
    totalClientOutstanding: number;
    totalInvestorCapital: number;
    totalCompanyCapital: number;
    totalCollected: number;
    principalCollected: number;
    interestCollected: number;
    companyProfit: number;
    investorReturnsPending: number;
    overdueAmount: number;
    activeDealsCount: number;
  };
  charts: {
    monthlyFlows: Array<{
      month: string;
      disbursed: number;
      collected: number;
      profit: number;
    }>;
  };
  recentRepayments: any[];
  upcomingRepayments: any[];
  overdueRepayments: any[];
}
