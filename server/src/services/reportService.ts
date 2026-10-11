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

  static async getInvestorOptions(companyId: string, search?: string) {
    const where: any = { companyId };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { investorCode: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    return prisma.investor.findMany({
      where,
      orderBy: { investorCode: 'asc' },
      select: {
        id: true,
        investorCode: true,
        name: true,
        phone: true,
        email: true,
        pan: true,
        status: true,
        bankName: true,
        bankAccountNo: true,
        ifscCode: true,
        _count: {
          select: { fundings: true },
        },
      },
    });
  }

  static async getIndividualInvestorReport(
    companyId: string,
    investorId: string,
    options: { startDate?: string; endDate?: string; period?: string } = {}
  ) {
    // 1. Multi-tenant company security check
    const investor = await prisma.investor.findFirst({
      where: { id: investorId, companyId },
      select: {
        id: true,
        investorCode: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        pan: true,
        bankName: true,
        bankAccountNo: true,
        ifscCode: true,
        status: true,
        notes: true,
        createdAt: true,
      },
    });

    if (!investor) {
      throw new Error('Investor not found or unauthorized for this organization');
    }

    // 2. Determine date range boundaries based on period filter
    const { startDate, endDate, period = 'all-time' } = options;
    const now = new Date();
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    let periodLabel = 'All-Time Investment Summary';

    if (period === 'this-week') {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      periodStart = new Date(d.setDate(d.getDate() + diffToMonday));
      periodStart.setHours(0, 0, 0, 0);

      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      periodLabel = `This Week (${periodStart.toLocaleDateString('en-IN')} – ${periodEnd.toLocaleDateString('en-IN')})`;
    } else if (period === 'previous-week') {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day - 7;
      periodStart = new Date(d.setDate(d.getDate() + diffToMonday));
      periodStart.setHours(0, 0, 0, 0);

      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      periodLabel = `Previous Week (${periodStart.toLocaleDateString('en-IN')} – ${periodEnd.toLocaleDateString('en-IN')})`;
    } else if (period === 'this-month') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      periodLabel = `This Month (${periodStart.toLocaleDateString('en-IN')} – ${periodEnd.toLocaleDateString('en-IN')})`;
    } else if (startDate || endDate || period === 'custom') {
      if (startDate) {
        periodStart = new Date(startDate);
        periodStart.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        periodEnd = new Date(endDate);
        periodEnd.setHours(23, 59, 59, 999);
      }
      periodLabel = `Custom Range (${periodStart ? periodStart.toLocaleDateString('en-IN') : 'Start'} – ${periodEnd ? periodEnd.toLocaleDateString('en-IN') : 'Present'})`;
    }

    // 3. Fetch deal fundings belonging strictly to this investor and company
    const fundings = await prisma.dealFunding.findMany({
      where: {
        investorId,
        deal: { companyId },
      },
      include: {
        deal: {
          include: {
            client: {
              select: { id: true, clientCode: true, fullName: true, phone: true },
            },
            distributionRules: true,
          },
        },
      },
      orderBy: { investmentDate: 'asc' },
    });

    // 4. Fetch returns distributed to this investor
    const returns = await prisma.investorReturn.findMany({
      where: {
        investorId,
        distribution: {
          deal: { companyId },
        },
      },
      include: {
        distribution: {
          include: {
            repayment: {
              include: {
                client: { select: { fullName: true } },
                recordedBy: { select: { fullName: true } },
              },
            },
            deal: {
              include: {
                client: { select: { fullName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 5. Calculate cumulative and period financial metrics using Decimal
    let allTimeInvested = new Prisma.Decimal(0);
    let allTimeExpectedROI = new Prisma.Decimal(0);
    let allTimePrincipalReturned = new Prisma.Decimal(0);
    let allTimeROIEarned = new Prisma.Decimal(0);
    let allTimeROIPaid = new Prisma.Decimal(0);

    // Opening balances (prior to periodStart)
    let openingInvested = new Prisma.Decimal(0);
    let openingExpectedROI = new Prisma.Decimal(0);
    let openingPrincipalReturned = new Prisma.Decimal(0);
    let openingROIEarned = new Prisma.Decimal(0);
    let openingROIPaid = new Prisma.Decimal(0);

    // Activity during selected period
    let periodInvested = new Prisma.Decimal(0);
    let periodPrincipalReturned = new Prisma.Decimal(0);
    let periodROIEarned = new Prisma.Decimal(0);
    let periodROIPaid = new Prisma.Decimal(0);

    // Track per-deal aggregates
    const dealStatsMap = new Map<string, {
      investedAmount: Prisma.Decimal;
      sharePercentage: Prisma.Decimal;
      expectedROI: Prisma.Decimal;
      principalReturned: Prisma.Decimal;
      roiEarned: Prisma.Decimal;
    }>();

    fundings.forEach((f) => {
      const fAmount = roundMoney(toDecimal(f.amount));
      const fPct = toDecimal(f.percentage);
      const dealTotalInterest = toDecimal(f.deal.totalInterest || 0);
      const rule = f.deal.distributionRules?.[0];
      const commRate = rule ? toDecimal(rule.companyCommissionRate) : new Prisma.Decimal(0);

      // Contracted investor interest share after company management commission
      const netInterest = dealTotalInterest.times(toDecimal(100).minus(commRate)).dividedBy(100);
      let expROI = roundMoney(netInterest.times(fPct).dividedBy(100));
      if (expROI.isZero() && f.expectedReturnRate && !toDecimal(f.expectedReturnRate).isZero()) {
        expROI = roundMoney(fAmount.times(toDecimal(f.expectedReturnRate)).dividedBy(100));
      }

      allTimeInvested = allTimeInvested.plus(fAmount);
      allTimeExpectedROI = allTimeExpectedROI.plus(expROI);

      dealStatsMap.set(f.deal.id, {
        investedAmount: fAmount,
        sharePercentage: fPct,
        expectedROI: expROI,
        principalReturned: new Prisma.Decimal(0),
        roiEarned: new Prisma.Decimal(0),
      });

      const invDate = new Date(f.investmentDate);
      if (periodStart && invDate < periodStart) {
        openingInvested = openingInvested.plus(fAmount);
        openingExpectedROI = openingExpectedROI.plus(expROI);
      } else if ((!periodStart || invDate >= periodStart) && (!periodEnd || invDate <= periodEnd)) {
        periodInvested = periodInvested.plus(fAmount);
      }
    });

    // Process distributions
    returns.forEach((r) => {
      const rep = r.distribution.repayment;
      const isReversed = rep.status === 'REVERSED' || rep.status === 'VOIDED';
      const isVerified = rep.status === 'PROCESSED' || rep.status === 'VERIFIED';

      // Audit requirement: Exclude reversed / voided transactions from active totals
      if (!isReversed && isVerified) {
        const pRet = roundMoney(toDecimal(r.principalReturned));
        const iEarn = roundMoney(toDecimal(r.interestEarned));

        allTimePrincipalReturned = allTimePrincipalReturned.plus(pRet);
        allTimeROIEarned = allTimeROIEarned.plus(iEarn);
        allTimeROIPaid = allTimeROIPaid.plus(iEarn);

        // Update per-deal stats
        const dStat = dealStatsMap.get(r.distribution.dealId);
        if (dStat) {
          dStat.principalReturned = dStat.principalReturned.plus(pRet);
          dStat.roiEarned = dStat.roiEarned.plus(iEarn);
        }

        const repDate = new Date(rep.paymentDate);
        if (periodStart && repDate < periodStart) {
          openingPrincipalReturned = openingPrincipalReturned.plus(pRet);
          openingROIEarned = openingROIEarned.plus(iEarn);
          openingROIPaid = openingROIPaid.plus(iEarn);
        } else if ((!periodStart || repDate >= periodStart) && (!periodEnd || repDate <= periodEnd)) {
          periodPrincipalReturned = periodPrincipalReturned.plus(pRet);
          periodROIEarned = periodROIEarned.plus(iEarn);
          periodROIPaid = periodROIPaid.plus(iEarn);
        }
      }
    });

    // Cumulative KPI Cards (strict isolation, no hardcoding)
    const remainingPrincipal = roundMoney(
      allTimeInvested.minus(allTimePrincipalReturned).greaterThan(0)
        ? allTimeInvested.minus(allTimePrincipalReturned)
        : new Prisma.Decimal(0)
    );
    const pendingROI = roundMoney(
      allTimeExpectedROI.minus(allTimeROIEarned).greaterThan(0)
        ? allTimeExpectedROI.minus(allTimeROIEarned)
        : new Prisma.Decimal(0)
    );
    const totalReturnPaid = roundMoney(allTimePrincipalReturned.plus(allTimeROIPaid));
    const totalOutstandingPayable = roundMoney(remainingPrincipal.plus(pendingROI));

    // Weekly / Period Reconciliation
    const openingRemainingPrincipal = roundMoney(
      openingInvested.minus(openingPrincipalReturned).greaterThan(0)
        ? openingInvested.minus(openingPrincipalReturned)
        : new Prisma.Decimal(0)
    );
    const openingPendingROI = roundMoney(
      openingExpectedROI.minus(openingROIEarned).greaterThan(0)
        ? openingExpectedROI.minus(openingROIEarned)
        : new Prisma.Decimal(0)
    );
    const openingTotalReturnPaid = roundMoney(openingPrincipalReturned.plus(openingROIPaid));
    const openingTotalOutstanding = roundMoney(openingRemainingPrincipal.plus(openingPendingROI));

    const periodTotalPayout = roundMoney(periodPrincipalReturned.plus(periodROIPaid));

    const isPeriodActive = periodStart !== null || periodEnd !== null;
    const closingInvested = isPeriodActive ? roundMoney(openingInvested.plus(periodInvested)) : allTimeInvested;
    const closingPrincipalReturned = isPeriodActive
      ? roundMoney(openingPrincipalReturned.plus(periodPrincipalReturned))
      : allTimePrincipalReturned;
    const closingRemainingPrincipal = roundMoney(
      closingInvested.minus(closingPrincipalReturned).greaterThan(0)
        ? closingInvested.minus(closingPrincipalReturned)
        : new Prisma.Decimal(0)
    );
    const closingROIEarned = isPeriodActive ? roundMoney(openingROIEarned.plus(periodROIEarned)) : allTimeROIEarned;
    const closingROIPaid = isPeriodActive ? roundMoney(openingROIPaid.plus(periodROIPaid)) : allTimeROIPaid;
    const closingPendingROI = roundMoney(
      allTimeExpectedROI.minus(closingROIEarned).greaterThan(0)
        ? allTimeExpectedROI.minus(closingROIEarned)
        : new Prisma.Decimal(0)
    );
    const closingTotalReturnPaid = roundMoney(closingPrincipalReturned.plus(closingROIPaid));
    const closingTotalOutstanding = roundMoney(closingRemainingPrincipal.plus(closingPendingROI));

    // 6. Section 1: Investment & Funding Details
    const sectionDealFundings = fundings.map((f) => {
      const stats = dealStatsMap.get(f.deal.id);
      const invAmt = roundMoney(toDecimal(f.amount));
      const expROI = stats?.expectedROI || new Prisma.Decimal(0);
      const princRet = stats?.principalReturned || new Prisma.Decimal(0);
      const roiEarn = stats?.roiEarned || new Prisma.Decimal(0);
      const remPrinc = roundMoney(invAmt.minus(princRet).greaterThan(0) ? invAmt.minus(princRet) : new Prisma.Decimal(0));
      const pRoi = roundMoney(expROI.minus(roiEarn).greaterThan(0) ? expROI.minus(roiEarn) : new Prisma.Decimal(0));
      const totalDue = roundMoney(remPrinc.plus(pRoi));

      return {
        fundingId: f.id,
        dealId: f.deal.id,
        dealNumber: f.deal.dealNumber,
        clientName: f.deal.client.fullName,
        clientPhone: f.deal.client.phone,
        dealStartDate: f.deal.startDate,
        dealEndDate: f.deal.endDate,
        dealApprovedAmount: roundMoney(f.deal.financeAmountApproved).toNumber(),
        investorAmount: invAmt.toNumber(),
        sharePercentage: Number(f.percentage),
        expectedReturnRate: Number(f.expectedReturnRate || f.deal.interestRate),
        expectedROI: expROI.toNumber(),
        principalReturned: princRet.toNumber(),
        roiEarned: roiEarn.toNumber(),
        remainingPrincipal: remPrinc.toNumber(),
        pendingROI: pRoi.toNumber(),
        totalOutstandingDue: totalDue.toNumber(),
        dealStatus: f.deal.status,
        investmentDate: f.investmentDate,
      };
    });

    // 7. Section 2: Client Collections Allocated to this Investor
    const sectionClientCollections = returns.map((r) => {
      const rep = r.distribution.repayment;
      const isReversed = rep.status === 'REVERSED' || rep.status === 'VOIDED';
      const repDate = new Date(rep.paymentDate);
      const inPeriod =
        (!periodStart || repDate >= periodStart) && (!periodEnd || repDate <= periodEnd);

      return {
        returnId: r.id,
        repaymentId: rep.id,
        date: rep.paymentDate,
        receiptNumber: rep.receiptNumber,
        referenceNumber: rep.referenceNumber || '—',
        dealNumber: r.distribution.deal.dealNumber,
        dealId: r.distribution.deal.id,
        clientName: r.distribution.deal.client?.fullName || '—',
        totalClientRepayment: roundMoney(rep.amountReceived).toNumber(),
        investorPrincipalShare: roundMoney(r.principalReturned).toNumber(),
        investorROIShare: roundMoney(r.interestEarned).toNumber(),
        investorTotalSplit: roundMoney(r.totalPayout).toNumber(),
        paymentMethod: rep.paymentMethod,
        status: rep.status,
        isReversed,
        inPeriod,
      };
    });

    // 8. Section 3: Investor Return Payouts Disbursed
    const sectionInvestorPayouts = sectionClientCollections
      .filter((c) => !c.isReversed)
      .map((c) => ({
        date: c.date,
        receiptNumber: c.receiptNumber,
        referenceNumber: c.referenceNumber,
        dealNumber: c.dealNumber,
        clientName: c.clientName,
        paymentMethod: c.paymentMethod,
        principalPaid: c.investorPrincipalShare,
        roiPaid: c.investorROIShare,
        totalPaid: c.investorTotalSplit,
        status: c.status,
        inPeriod: c.inPeriod,
      }));

    // 9. Section 4: Pending Investor Returns
    const sectionPendingReturns = sectionDealFundings
      .filter((d) => d.remainingPrincipal > 0 || d.pendingROI > 0 || d.dealStatus === 'ACTIVE' || d.dealStatus === 'OVERDUE')
      .map((d) => ({
        dealId: d.dealId,
        dealNumber: d.dealNumber,
        clientName: d.clientName,
        investedAmount: d.investorAmount,
        principalReturned: d.principalReturned,
        remainingPrincipal: d.remainingPrincipal,
        expectedROI: d.expectedROI,
        roiEarned: d.roiEarned,
        pendingROI: d.pendingROI,
        totalOutstandingPayable: d.totalOutstandingDue,
        dealStatus: d.dealStatus,
      }));

    // 10. Master Chronological Transaction Ledger
    const allTransactions: Array<{
      id: string;
      date: Date | string;
      reference: string;
      dealNumber: string;
      dealId: string;
      clientName: string;
      transactionType: 'INVESTMENT_DEPLOYED' | 'COLLECTION_DISTRIBUTION' | 'REVERSAL';
      typeLabel: string;
      principalAllocation: number;
      roiEarned: number;
      principalPaid: number;
      roiPaid: number;
      totalAmount: number;
      paymentStatus: string;
      isReversed: boolean;
      inPeriod: boolean;
      paymentMethod?: string;
    }> = [];

    // Add funding entries
    fundings.forEach((f) => {
      const invDate = new Date(f.investmentDate);
      const inPeriod =
        (!periodStart || invDate >= periodStart) && (!periodEnd || invDate <= periodEnd);
      allTransactions.push({
        id: `fnd-${f.id}`,
        date: f.investmentDate,
        reference: f.deal.dealNumber,
        dealNumber: f.deal.dealNumber,
        dealId: f.deal.id,
        clientName: f.deal.client.fullName,
        transactionType: 'INVESTMENT_DEPLOYED',
        typeLabel: 'Capital Investment',
        principalAllocation: roundMoney(f.amount).toNumber(),
        roiEarned: 0,
        principalPaid: 0,
        roiPaid: 0,
        totalAmount: roundMoney(f.amount).toNumber(),
        paymentStatus: f.status || 'COMMITTED',
        isReversed: false,
        inPeriod,
      });
    });

    // Add distribution return entries
    returns.forEach((r) => {
      const rep = r.distribution.repayment;
      const isReversed = rep.status === 'REVERSED' || rep.status === 'VOIDED';
      const repDate = new Date(rep.paymentDate);
      const inPeriod =
        (!periodStart || repDate >= periodStart) && (!periodEnd || repDate <= periodEnd);

      allTransactions.push({
        id: `ret-${r.id}`,
        date: rep.paymentDate,
        reference: rep.receiptNumber,
        dealNumber: r.distribution.deal.dealNumber,
        dealId: r.distribution.deal.id,
        clientName: r.distribution.deal.client?.fullName || '—',
        transactionType: isReversed ? 'REVERSAL' : 'COLLECTION_DISTRIBUTION',
        typeLabel: isReversed ? 'Collection Reversal' : 'Repayment Distribution',
        principalAllocation: isReversed ? -roundMoney(r.principalReturned).toNumber() : 0,
        roiEarned: isReversed ? -roundMoney(r.interestEarned).toNumber() : roundMoney(r.interestEarned).toNumber(),
        principalPaid: isReversed ? 0 : roundMoney(r.principalReturned).toNumber(),
        roiPaid: isReversed ? 0 : roundMoney(r.interestEarned).toNumber(),
        totalAmount: roundMoney(r.totalPayout).toNumber(),
        paymentStatus: rep.status,
        isReversed,
        inPeriod,
        paymentMethod: rep.paymentMethod,
      });
    });

    // Sort chronologically descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter transactions if period is active
    const periodTransactions = isPeriodActive
      ? allTransactions.filter((t) => t.inPeriod)
      : allTransactions;

    return {
      investor,
      period: {
        type: period,
        startDate: periodStart ? periodStart.toISOString() : null,
        endDate: periodEnd ? periodEnd.toISOString() : null,
        label: periodLabel,
        isPeriodActive,
      },
      generatedAt: now.toISOString(),
      summary: {
        totalInvested: allTimeInvested.toNumber(),
        principalReturned: allTimePrincipalReturned.toNumber(),
        remainingPrincipal: remainingPrincipal.toNumber(),
        roiEarned: allTimeROIEarned.toNumber(),
        roiPaid: allTimeROIPaid.toNumber(),
        pendingRoi: pendingROI.toNumber(),
        totalReturnPaid: totalReturnPaid.toNumber(),
        totalOutstandingPayable: totalOutstandingPayable.toNumber(),
        totalDealsParticipated: fundings.length,
        activeDealsCount: fundings.filter((f) => f.deal.status === 'ACTIVE' || f.deal.status === 'OVERDUE').length,
      },
      periodSummary: {
        opening: {
          invested: openingInvested.toNumber(),
          principalReturned: openingPrincipalReturned.toNumber(),
          remainingPrincipal: openingRemainingPrincipal.toNumber(),
          roiEarned: openingROIEarned.toNumber(),
          roiPaid: openingROIPaid.toNumber(),
          pendingRoi: openingPendingROI.toNumber(),
          totalReturnPaid: openingTotalReturnPaid.toNumber(),
          totalOutstandingPayable: openingTotalOutstanding.toNumber(),
        },
        period: {
          invested: periodInvested.toNumber(),
          principalReturned: periodPrincipalReturned.toNumber(),
          roiEarned: periodROIEarned.toNumber(),
          roiPaid: periodROIPaid.toNumber(),
          totalPayout: periodTotalPayout.toNumber(),
        },
        closing: {
          invested: closingInvested.toNumber(),
          principalReturned: closingPrincipalReturned.toNumber(),
          remainingPrincipal: closingRemainingPrincipal.toNumber(),
          roiEarned: closingROIEarned.toNumber(),
          roiPaid: closingROIPaid.toNumber(),
          pendingRoi: closingPendingROI.toNumber(),
          totalReturnPaid: closingTotalReturnPaid.toNumber(),
          totalOutstandingPayable: closingTotalOutstanding.toNumber(),
        },
      },
      transactions: allTransactions,
      periodTransactions,
      sections: {
        dealFundings: sectionDealFundings,
        clientCollections: isPeriodActive ? sectionClientCollections.filter((c) => c.inPeriod) : sectionClientCollections,
        investorPayouts: isPeriodActive ? sectionInvestorPayouts.filter((p) => p.inPeriod) : sectionInvestorPayouts,
        pendingReturns: sectionPendingReturns,
        reconciliation: {
          openingRemainingPrincipal: openingRemainingPrincipal.toNumber(),
          periodInvested: periodInvested.toNumber(),
          periodPrincipalReturned: periodPrincipalReturned.toNumber(),
          closingRemainingPrincipal: closingRemainingPrincipal.toNumber(),
          openingROIEarned: openingROIEarned.toNumber(),
          periodROIEarned: periodROIEarned.toNumber(),
          closingROIEarned: closingROIEarned.toNumber(),
          closingPendingROI: closingPendingROI.toNumber(),
          closingTotalReturnPaid: closingTotalReturnPaid.toNumber(),
          closingOutstandingPayable: closingTotalOutstanding.toNumber(),
        },
      },
    };
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
