import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { roundMoney, toDecimal } from '../utils/decimal.js';

export class DashboardService {
  static async getDashboardMetrics(companyId: string) {
    const deals = await prisma.financeDeal.findMany({
      where: { companyId },
      include: {
        fundings: true,
        schedules: true,
      },
    });

    const repayments = await prisma.repayment.findMany({
      where: { deal: { companyId } },
      include: {
        distributions: {
          include: {
            investorReturns: true,
            companyProfits: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    let totalActiveFinance = new Prisma.Decimal(0);
    let totalClientOutstanding = new Prisma.Decimal(0);
    let totalInvestorCapital = new Prisma.Decimal(0);
    let totalCompanyCapital = new Prisma.Decimal(0);
    let totalPrincipalCollected = new Prisma.Decimal(0);
    let totalInterestCollected = new Prisma.Decimal(0);
    let totalCompanyProfit = new Prisma.Decimal(0);
    let totalInvestorReturnsPending = new Prisma.Decimal(0);
    let overdueAmount = new Prisma.Decimal(0);
    let activeDealsCount = 0;

    const now = new Date();

    for (const deal of deals) {
      if (deal.status === 'ACTIVE' || deal.status === 'OVERDUE') {
        activeDealsCount++;
        totalActiveFinance = totalActiveFinance.plus(deal.financeAmountApproved);
        totalClientOutstanding = totalClientOutstanding.plus(deal.outstandingTotal);
      }

      totalPrincipalCollected = totalPrincipalCollected.plus(deal.totalPrincipalRepaid);
      totalInterestCollected = totalInterestCollected.plus(deal.totalInterestRepaid);

      deal.fundings.forEach((f) => {
        if (f.sourceType === 'OUTSIDE_INVESTOR') {
          totalInvestorCapital = totalInvestorCapital.plus(f.amount);
          const pendingPrincipal = toDecimal(f.amount).minus(f.principalReturned);
          totalInvestorReturnsPending = totalInvestorReturnsPending.plus(pendingPrincipal);
        } else if (f.sourceType === 'COMPANY' || f.sourceType === 'PARTNER') {
          totalCompanyCapital = totalCompanyCapital.plus(f.amount);
        }
      });

      deal.schedules.forEach((sch) => {
        if (
          new Date(sch.dueDate) < now &&
          (sch.status === 'DUE' || sch.status === 'OVERDUE' || sch.status === 'PARTIALLY_PAID')
        ) {
          overdueAmount = overdueAmount.plus(sch.balanceAmount);
        }
      });
    }

    const companyProfits = await prisma.companyProfit.findMany({
      where: { distribution: { deal: { companyId } } },
    });

    companyProfits.forEach((cp) => {
      totalCompanyProfit = totalCompanyProfit.plus(cp.totalCompanyProfit);
    });

    const monthlyTrends: Record<string, { month: string; disbursed: number; collected: number; profit: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTrends[monthKey] = { month: monthKey, disbursed: 0, collected: 0, profit: 0 };
    }

    deals.forEach((deal) => {
      const mKey = new Date(deal.startDate).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyTrends[mKey]) {
        monthlyTrends[mKey].disbursed += new Prisma.Decimal(deal.financeAmountApproved).toNumber();
      }
    });

    repayments.forEach((rep) => {
      const mKey = new Date(rep.paymentDate).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyTrends[mKey]) {
        monthlyTrends[mKey].collected += new Prisma.Decimal(rep.amountReceived).toNumber();
      }
    });

    const upcomingSchedules = await prisma.repaymentSchedule.findMany({
      where: {
        deal: { companyId, status: 'ACTIVE' },
        status: { in: ['UPCOMING', 'DUE'] },
        dueDate: { gte: new Date() },
      },
      include: {
        deal: {
          include: { client: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    });

    const overdueSchedules = await prisma.repaymentSchedule.findMany({
      where: {
        deal: { companyId, status: { in: ['ACTIVE', 'OVERDUE'] } },
        status: { in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
      },
      include: {
        deal: {
          include: { client: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    });

    return {
      kpis: {
        totalActiveFinance: roundMoney(totalActiveFinance).toNumber(),
        totalClientOutstanding: roundMoney(totalClientOutstanding).toNumber(),
        totalInvestorCapital: roundMoney(totalInvestorCapital).toNumber(),
        totalCompanyCapital: roundMoney(totalCompanyCapital).toNumber(),
        totalCollected: roundMoney(totalPrincipalCollected.plus(totalInterestCollected)).toNumber(),
        principalCollected: roundMoney(totalPrincipalCollected).toNumber(),
        interestCollected: roundMoney(totalInterestCollected).toNumber(),
        companyProfit: roundMoney(totalCompanyProfit).toNumber(),
        investorReturnsPending: roundMoney(totalInvestorReturnsPending).toNumber(),
        overdueAmount: roundMoney(overdueAmount).toNumber(),
        activeDealsCount,
      },
      charts: {
        monthlyFlows: Object.values(monthlyTrends),
      },
      recentRepayments: repayments,
      upcomingRepayments: upcomingSchedules,
      overdueRepayments: overdueSchedules,
    };
  }
}
