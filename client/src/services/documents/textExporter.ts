import { formatCurrency, formatDate } from '../../utils/formatters';

export interface InvestorTextParams {
  investorName: string;
  clientName: string;
  dealNumber: string;
  clientFinanceAmount: number;
  investorInvestment: number;
  investorSharePct: number;
  expectedPrincipalReturn: number;
  expectedInterest: number;
  expectedTotalReturn: number;
  totalReceived: number;
  pendingBalance: number;
  schedules: Array<{
    installmentNumber: number;
    dueDate: Date | string;
    investorShare: number;
    status: string;
  }>;
}

export const generateInvestorWhatsAppText = (params: InvestorTextParams): string => {
  const lines: string[] = [];

  lines.push('====================================');
  lines.push('INVESTOR PAYMENT STATEMENT');
  lines.push('====================================');
  lines.push('');
  lines.push(`Investor: ${params.investorName}`);
  lines.push(`Client: ${params.clientName}`);
  lines.push(`Deal: ${params.dealNumber}`);
  lines.push('');
  lines.push(`Client Finance: ${formatCurrency(params.clientFinanceAmount)}`);
  lines.push(`Investor Investment: ${formatCurrency(params.investorInvestment)}`);
  lines.push(`Investor Share: ${params.investorSharePct.toFixed(2)}%`);
  lines.push('');
  lines.push(`Expected Principal Return: ${formatCurrency(params.expectedPrincipalReturn)}`);
  lines.push(`Expected Interest: ${formatCurrency(params.expectedInterest)}`);
  lines.push(`Expected Total Return: ${formatCurrency(params.expectedTotalReturn)}`);
  lines.push('');
  lines.push('Payment Schedule:');

  params.schedules.forEach((sch) => {
    const dateStr = formatDate(sch.dueDate);
    const amountStr = formatCurrency(sch.investorShare);
    lines.push(`${sch.installmentNumber}. ${dateStr} — ${amountStr} — ${sch.status}`);
  });

  lines.push('');
  lines.push(`Total Received: ${formatCurrency(params.totalReceived)}`);
  lines.push(`Pending: ${formatCurrency(params.pendingBalance)}`);
  lines.push('');
  lines.push('------------------------------------');
  lines.push('FinFlow — Private Finance Management');
  lines.push('Product by MSR Solutions');

  return lines.join('\n');
};
