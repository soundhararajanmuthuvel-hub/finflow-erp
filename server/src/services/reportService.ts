import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { roundMoney, toDecimal } from '../utils/decimal.js';

export class ReportService {
  static async getClientFinanceReport(companyId: string) {
    const clients = await prisma.client.findMany({
      where: { companyId },
      include: {
        deals: {
          include: {
            schedules: true,
          },
        },
      },
    });

    return clients.map((c) => {
      let totalFinance = new Prisma.Decimal(0);
      let totalInterest = new Prisma.Decimal(0);
      let totalPrincipalRepaid = new Prisma.Decimal(0);
      let totalInterestRepaid = new Prisma.Decimal(0);
      let outstanding = new Prisma.Decimal(0);
      let overdue = new Prisma.Decimal(0);

      const now = new Date();

      c.deals.forEach((d) => {
        totalFinance = totalFinance.plus(d.financeAmountApproved);
        totalInterest = totalInterest.plus(d.totalInterest);
        totalPrincipalRepaid = totalPrincipalRepaid.plus(d.totalPrincipalRepaid);
        totalInterestRepaid = totalInterestRepaid.plus(d.totalInterestRepaid);
        outstanding = outstanding.plus(d.outstandingTotal);

        d.schedules.forEach((s) => {
          if (new Date(s.dueDate) < now && s.status !== 'PAID' && s.status !== 'WAIVED') {
            overdue = overdue.plus(s.balanceAmount);
          }
        });
      });

      return {
        clientId: c.id,
        clientCode: c.clientCode,
        fullName: c.fullName,
        businessName: c.businessName,
        phone: c.phone,
        totalDeals: c.deals.length,
        totalFinanceDisbursed: roundMoney(totalFinance).toNumber(),
        totalInterestContracted: roundMoney(totalInterest).toNumber(),
        principalRepaid: roundMoney(totalPrincipalRepaid).toNumber(),
        interestRepaid: roundMoney(totalInterestRepaid).toNumber(),
        totalRepaid: roundMoney(totalPrincipalRepaid.plus(totalInterestRepaid)).toNumber(),
        outstandingBalance: roundMoney(outstanding).toNumber(),
        overdueAmount: roundMoney(overdue).toNumber(),
      };
    });
  }

  static async getInvestorReport(companyId: string) {
    const investors = await prisma.investor.findMany({
      where: { companyId },
      include: {
        fundings: {
          include: { deal: true },
        },
        returns: {
          include: { distribution: { include: { repayment: true, deal: true } } },
        },
      },
    });

    return investors.map((inv) => {
      let totalInvested = new Prisma.Decimal(0);
      let principalReturned = new Prisma.Decimal(0);
      let interestEarned = new Prisma.Decimal(0);

      inv.fundings.forEach((f) => {
        totalInvested = totalInvested.plus(f.amount);
      });

      inv.returns.forEach((r) => {
        principalReturned = principalReturned.plus(r.principalReturned);
        interestEarned = interestEarned.plus(r.interestEarned);
      });

      const pendingPrincipal = roundMoney(totalInvested.minus(principalReturned));

      return {
        investorId: inv.id,
        investorCode: inv.investorCode,
        name: inv.name,
        phone: inv.phone,
        pan: inv.pan,
        totalInvested: roundMoney(totalInvested).toNumber(),
        principalReturned: roundMoney(principalReturned).toNumber(),
        interestEarned: roundMoney(interestEarned).toNumber(),
        totalPayout: roundMoney(principalReturned.plus(interestEarned)).toNumber(),
        pendingPrincipal: pendingPrincipal.toNumber(),
        dealsParticipated: inv.fundings.length,
      };
    });
  }

  static async getPartnerReport(companyId: string) {
    const partners = await prisma.partner.findMany({
      where: { companyId },
      include: {
        fundings: { include: { deal: true } },
        partnerReturns: { include: { distribution: { include: { repayment: true, deal: true } } } },
      },
    });

    return partners.map((p) => {
      let totalCapital = new Prisma.Decimal(p.capitalContribution);
      let totalFundedToDeals = new Prisma.Decimal(0);
      let principalReturned = new Prisma.Decimal(0);
      let profitEarned = new Prisma.Decimal(0);

      p.fundings.forEach((f) => {
        totalFundedToDeals = totalFundedToDeals.plus(f.amount);
      });

      p.partnerReturns.forEach((r) => {
        principalReturned = principalReturned.plus(r.principalReturned);
        profitEarned = profitEarned.plus(r.profitShare);
      });

      return {
        partnerId: p.id,
        partnerCode: p.partnerCode,
        name: p.name,
        phone: p.phone,
        equitySharePercentage: p.sharePercentage,
        baseCapitalContribution: roundMoney(totalCapital).toNumber(),
        totalFundedToDeals: roundMoney(totalFundedToDeals).toNumber(),
        principalReturned: roundMoney(principalReturned).toNumber(),
        profitEarned: roundMoney(profitEarned).toNumber(),
        activeCapitalInDeals: roundMoney(totalFundedToDeals.minus(principalReturned)).toNumber(),
      };
    });
  }

  static async getCompanyProfitReport(companyId: string) {
    const deals = await prisma.financeDeal.findMany({
      where: { companyId },
      include: {
        client: true,
        distributions: {
          include: {
            companyProfits: true,
            investorReturns: true,
            partnerReturns: true,
          },
        },
      },
    });

    return deals.map((d) => {
      let principalRecovered = new Prisma.Decimal(0);
      let managementCommission = new Prisma.Decimal(0);
      let retainedInterestMargin = new Prisma.Decimal(0);
      let totalDealProfit = new Prisma.Decimal(0);

      d.distributions.forEach((dist) => {
        dist.companyProfits.forEach((cp) => {
          principalRecovered = principalRecovered.plus(cp.principalRecovered);
          managementCommission = managementCommission.plus(cp.managementCommission);
          retainedInterestMargin = retainedInterestMargin.plus(cp.retainedInterestMargin);
          totalDealProfit = totalDealProfit.plus(cp.totalCompanyProfit);
        });
      });

      return {
        dealId: d.id,
        dealNumber: d.dealNumber,
        clientName: d.client.fullName,
        financeAmount: Number(d.financeAmountApproved),
        totalInterestContracted: Number(d.totalInterest),
        status: d.status,
        companyPrincipalRecovered: roundMoney(principalRecovered).toNumber(),
        managementCommission: roundMoney(managementCommission).toNumber(),
        retainedInterestMargin: roundMoney(retainedInterestMargin).toNumber(),
        totalCompanyProfit: roundMoney(totalDealProfit).toNumber(),
      };
    });
  }

  static async getCollectionReport(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { deal: { companyId } };

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const repayments = await prisma.repayment.findMany({
      where,
      include: {
        client: true,
        deal: true,
        recordedBy: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return repayments.map((r) => ({
      repaymentId: r.id,
      receiptNumber: r.receiptNumber,
      paymentDate: r.paymentDate,
      dealNumber: r.deal.dealNumber,
      clientName: r.client.fullName,
      amountReceived: Number(r.amountReceived),
      principalPortion: Number(r.principalPortion),
      interestPortion: Number(r.interestPortion),
      paymentMethod: r.paymentMethod,
      referenceNumber: r.referenceNumber,
      recordedBy: r.recordedBy.fullName,
    }));
  }

  static async getOverdueReport(companyId: string) {
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
    });

    const now = new Date();

    return overdueSchedules.map((s) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(s.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        scheduleId: s.id,
        dealId: s.dealId,
        dealNumber: s.deal.dealNumber,
        clientId: s.deal.clientId,
        clientName: s.deal.client.fullName,
        clientPhone: s.deal.client.phone,
        installmentNumber: s.installmentNumber,
        dueDate: s.dueDate,
        daysOverdue,
        totalDue: Number(s.totalDue),
        paidAmount: Number(s.paidAmount),
        overdueBalance: Number(s.balanceAmount),
      };
    });
  }
}
