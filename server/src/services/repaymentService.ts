import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { DealStatus, TransactionType, ScheduleStatus, PaymentMethod } from '../types/enums.js';
import { DistributionEngine } from './distributionEngine.js';
import { LedgerService } from './ledgerService.js';
import { roundMoney, toDecimal, decimalMin, decimalMax, DecimalValue } from '../utils/decimal.js';
import { recordAuditLog } from '../utils/audit.js';

export interface RecordRepaymentParams {
  companyId: string;
  userId: string;
  dealId: string;
  amountReceived: number | DecimalValue;
  paymentDate?: string | Date;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  ipAddress?: string;
}

export class RepaymentService {
  static async recordRepayment(params: RecordRepaymentParams) {
    const { companyId, userId, dealId, amountReceived, paymentDate, paymentMethod, referenceNumber, notes, ipAddress } = params;
    const amount = roundMoney(amountReceived);

    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Repayment amount must be strictly greater than zero');
    }

    return prisma.$transaction(async (tx) => {
      const deal = await tx.financeDeal.findFirst({
        where: { id: dealId, companyId },
        include: {
          client: true,
          fundings: true,
          distributionRules: true,
          schedules: {
            where: {
              status: { notIn: [ScheduleStatus.PAID, ScheduleStatus.WAIVED] },
            },
            orderBy: { installmentNumber: 'asc' },
          },
        },
      });

      if (!deal) throw new Error('Deal not found');
      if (deal.status !== DealStatus.ACTIVE && deal.status !== DealStatus.OVERDUE) {
        throw new Error(`Cannot record repayment for deal with status ${deal.status}`);
      }

      if (deal.schedules.length === 0) {
        throw new Error('No pending installments found for this deal');
      }

      let unallocatedAmount = amount;
      let totalAllocatedPrincipal = new Prisma.Decimal(0);
      let totalAllocatedInterest = new Prisma.Decimal(0);

      const allocationRecords: Array<{
        scheduleId: string;
        principal: Prisma.Decimal;
        interest: Prisma.Decimal;
        total: Prisma.Decimal;
      }> = [];

      for (const schedule of deal.schedules) {
        if (unallocatedAmount.isZero()) break;

        const schedulePendingBalance = roundMoney(schedule.balanceAmount);
        const unpaidPrincipal = roundMoney(toDecimal(schedule.principalAmount).minus(schedule.paidPrincipal));
        const unpaidInterest = roundMoney(toDecimal(schedule.interestAmount).minus(schedule.paidInterest));

        const paymentForThisSchedule = decimalMin(unallocatedAmount, schedulePendingBalance);

        let allocPrincipal = new Prisma.Decimal(0);
        let allocInterest = new Prisma.Decimal(0);

        if (schedulePendingBalance.isZero()) {
          continue;
        }

        if (paymentForThisSchedule.equals(schedulePendingBalance)) {
          allocPrincipal = unpaidPrincipal;
          allocInterest = unpaidInterest;
        } else {
          const totalUnpaid = unpaidPrincipal.plus(unpaidInterest);
          if (totalUnpaid.isPositive()) {
            allocPrincipal = roundMoney(paymentForThisSchedule.times(unpaidPrincipal).dividedBy(totalUnpaid));
            allocInterest = roundMoney(paymentForThisSchedule.minus(allocPrincipal));
          }
        }

        const allocTotal = roundMoney(allocPrincipal.plus(allocInterest));

        allocationRecords.push({
          scheduleId: schedule.id,
          principal: allocPrincipal,
          interest: allocInterest,
          total: allocTotal,
        });

        const newPaidPrincipal = roundMoney(toDecimal(schedule.paidPrincipal).plus(allocPrincipal));
        const newPaidInterest = roundMoney(toDecimal(schedule.paidInterest).plus(allocInterest));
        const newPaidAmount = roundMoney(toDecimal(schedule.paidAmount).plus(allocTotal));
        const newBalance = roundMoney(toDecimal(schedule.totalDue).minus(newPaidAmount));

        const newStatus: ScheduleStatus = newBalance.isZero()
          ? ScheduleStatus.PAID
          : ScheduleStatus.PARTIALLY_PAID;

        await tx.repaymentSchedule.update({
          where: { id: schedule.id },
          data: {
            paidPrincipal: newPaidPrincipal.toString(),
            paidInterest: newPaidInterest.toString(),
            paidAmount: newPaidAmount.toString(),
            balanceAmount: newBalance.toString(),
            status: newStatus,
            paidDate: newStatus === ScheduleStatus.PAID ? new Date() : schedule.paidDate,
          },
        });

        totalAllocatedPrincipal = totalAllocatedPrincipal.plus(allocPrincipal);
        totalAllocatedInterest = totalAllocatedInterest.plus(allocInterest);
        unallocatedAmount = roundMoney(unallocatedAmount.minus(paymentForThisSchedule));
      }

      const distRule = deal.distributionRules[0] || {
        companyCommissionRate: new Prisma.Decimal(0),
      };

      const fundingParticipants = deal.fundings.map((f) => ({
        id: f.id,
        sourceType: f.sourceType as any,
        partnerId: f.partnerId,
        investorId: f.investorId,
        amount: toDecimal(f.amount),
        percentage: toDecimal(f.percentage),
        expectedReturnRate: toDecimal(f.expectedReturnRate),
      }));

      const distributionResult = DistributionEngine.executeRepaymentSplit(
        totalAllocatedPrincipal,
        totalAllocatedInterest,
        deal.financeAmountApproved,
        fundingParticipants,
        {
          companyCommissionRate: toDecimal(distRule.companyCommissionRate),
        }
      );

      const repCount = await tx.repayment.count({ where: { deal: { companyId } } });
      const receiptNumber = `RCP-${String(repCount + 1).padStart(6, '0')}`;

      const repayment = await tx.repayment.create({
        data: {
          receiptNumber,
          dealId: deal.id,
          clientId: deal.clientId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amountReceived: amount.toString(),
          principalPortion: totalAllocatedPrincipal.toString(),
          interestPortion: totalAllocatedInterest.toString(),
          paymentMethod: paymentMethod || PaymentMethod.BANK_TRANSFER,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          recordedById: userId,
        },
      });

      for (const alloc of allocationRecords) {
        await tx.repaymentAllocation.create({
          data: {
            repaymentId: repayment.id,
            scheduleId: alloc.scheduleId,
            allocatedPrincipal: alloc.principal.toString(),
            allocatedInterest: alloc.interest.toString(),
            allocatedTotal: alloc.total.toString(),
          },
        });
      }

      const distribution = await tx.distribution.create({
        data: {
          dealId: deal.id,
          repaymentId: repayment.id,
          totalPrincipalSplit: distributionResult.totalPrincipalSplit.toString(),
          totalInterestSplit: distributionResult.totalInterestSplit.toString(),
          totalDistributed: distributionResult.totalDistributed.toString(),
        },
      });

      for (const invRet of distributionResult.investorReturns) {
        await tx.investorReturn.create({
          data: {
            distributionId: distribution.id,
            investorId: invRet.investorId,
            principalReturned: invRet.principalReturned.toString(),
            interestEarned: invRet.interestEarned.toString(),
            totalPayout: invRet.totalPayout.toString(),
          },
        });

        const f = deal.fundings.find((item) => item.investorId === invRet.investorId);
        if (f) {
          await tx.dealFunding.update({
            where: { id: f.id },
            data: {
              principalReturned: toDecimal(f.principalReturned).plus(invRet.principalReturned).toString(),
              interestEarned: toDecimal(f.interestEarned).plus(invRet.interestEarned).toString(),
            },
          });
        }
      }

      for (const prtRet of distributionResult.partnerReturns) {
        await tx.partnerReturn.create({
          data: {
            distributionId: distribution.id,
            partnerId: prtRet.partnerId,
            principalReturned: prtRet.principalReturned.toString(),
            profitShare: prtRet.profitShare.toString(),
            totalPayout: prtRet.totalPayout.toString(),
          },
        });

        const f = deal.fundings.find((item) => item.partnerId === prtRet.partnerId);
        if (f) {
          await tx.dealFunding.update({
            where: { id: f.id },
            data: {
              principalReturned: toDecimal(f.principalReturned).plus(prtRet.principalReturned).toString(),
              interestEarned: toDecimal(f.interestEarned).plus(prtRet.profitShare).toString(),
            },
          });
        }
      }

      await tx.companyProfit.create({
        data: {
          distributionId: distribution.id,
          principalRecovered: distributionResult.companyProfit.principalRecovered.toString(),
          managementCommission: distributionResult.companyProfit.managementCommission.toString(),
          retainedInterestMargin: distributionResult.companyProfit.retainedInterestMargin.toString(),
          totalCompanyProfit: distributionResult.companyProfit.totalCompanyProfit.toString(),
        },
      });

      const compFunding = deal.fundings.find((item) => item.sourceType === 'COMPANY');
      if (compFunding) {
        await tx.dealFunding.update({
          where: { id: compFunding.id },
          data: {
            principalReturned: toDecimal(compFunding.principalReturned).plus(distributionResult.companyProfit.principalRecovered).toString(),
            interestEarned: toDecimal(compFunding.interestEarned).plus(distributionResult.companyProfit.totalCompanyProfit).toString(),
          },
        });
      }

      const newDealPrincipalRepaid = toDecimal(deal.totalPrincipalRepaid).plus(totalAllocatedPrincipal);
      const newDealInterestRepaid = toDecimal(deal.totalInterestRepaid).plus(totalAllocatedInterest);
      const newOutstandingPrincipal = roundMoney(toDecimal(deal.financeAmountApproved).minus(newDealPrincipalRepaid));
      const newOutstandingTotal = roundMoney(toDecimal(deal.totalPayable).minus(newDealPrincipalRepaid.plus(newDealInterestRepaid)));

      const isCompleted = newOutstandingTotal.lessThanOrEqualTo(0);

      await tx.financeDeal.update({
        where: { id: deal.id },
        data: {
          totalPrincipalRepaid: newDealPrincipalRepaid.toString(),
          totalInterestRepaid: newDealInterestRepaid.toString(),
          outstandingPrincipal: decimalMax(new Prisma.Decimal(0), newOutstandingPrincipal).toString(),
          outstandingTotal: decimalMax(new Prisma.Decimal(0), newOutstandingTotal).toString(),
          status: isCompleted ? DealStatus.COMPLETED : deal.status,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      await LedgerService.initializeChartOfAccounts(tx, companyId);

      const ledgerEntries: any[] = [
        {
          accountCode: '1000',
          debit: amount,
          credit: 0,
          narration: `Repayment received from ${deal.client.fullName} - Deal ${deal.dealNumber}`,
        },
        {
          accountCode: '1100',
          debit: 0,
          credit: totalAllocatedPrincipal,
          narration: `Principal settlement for Deal ${deal.dealNumber}`,
        },
        {
          accountCode: '4000',
          debit: 0,
          credit: totalAllocatedInterest,
          narration: `Interest revenue collected for Deal ${deal.dealNumber}`,
        },
      ];

      await LedgerService.recordJournalTransaction(tx, {
        companyId,
        dealId: deal.id,
        repaymentId: repayment.id,
        transactionType: TransactionType.CLIENT_REPAYMENT,
        amount,
        description: `Client repayment recorded for Deal ${deal.dealNumber} (Receipt #${receiptNumber})`,
        entries: ledgerEntries,
      });

      await recordAuditLog({
        companyId,
        userId,
        action: 'REPAYMENT_RECORDED',
        entity: 'Repayment',
        entityId: repayment.id,
        newValues: {
          receiptNumber,
          dealNumber: deal.dealNumber,
          amountReceived: amount.toString(),
          principalPortion: totalAllocatedPrincipal.toString(),
          interestPortion: totalAllocatedInterest.toString(),
        },
        ipAddress,
      }, tx);

      return {
        repayment,
        distributionResult,
        dealUpdated: {
          outstandingPrincipal: decimalMax(new Prisma.Decimal(0), newOutstandingPrincipal).toNumber(),
          outstandingTotal: decimalMax(new Prisma.Decimal(0), newOutstandingTotal).toNumber(),
          isCompleted,
        },
      };
    }, { timeout: 30000, maxWait: 10000 });
  }

  static async deleteRepayment(companyId: string, repaymentId: string) {
    const repayment = await prisma.repayment.findFirst({
      where: { id: repaymentId, deal: { companyId } },
      include: {
        allocations: { include: { schedule: true } },
        deal: true,
      },
    });
    if (!repayment) throw new Error('Repayment not found');

    return prisma.$transaction(async (tx) => {
      for (const alloc of repayment.allocations) {
        const sch = alloc.schedule;
        const newPaidPrinc = decimalMax(new Prisma.Decimal(0), toDecimal(sch.paidPrincipal).minus(alloc.allocatedPrincipal));
        const newPaidInt = decimalMax(new Prisma.Decimal(0), toDecimal(sch.paidInterest).minus(alloc.allocatedInterest));
        const newPaidTot = decimalMax(new Prisma.Decimal(0), toDecimal(sch.paidAmount).minus(alloc.allocatedTotal));
        const newBalance = roundMoney(toDecimal(sch.totalDue).minus(newPaidTot));
        const status = newPaidTot.isZero() ? 'UPCOMING' : newPaidTot.gte(sch.totalDue) ? 'PAID' : 'PARTIALLY_PAID';

        await tx.repaymentSchedule.update({
          where: { id: sch.id },
          data: {
            paidPrincipal: newPaidPrinc.toString(),
            paidInterest: newPaidInt.toString(),
            paidAmount: newPaidTot.toString(),
            balanceAmount: newBalance.toString(),
            status,
            paidDate: newPaidTot.gte(sch.totalDue) ? sch.paidDate : null,
          },
        });
      }

      const deal = repayment.deal;
      const newPrincRepaid = decimalMax(new Prisma.Decimal(0), toDecimal(deal.totalPrincipalRepaid).minus(repayment.principalPortion));
      const newIntRepaid = decimalMax(new Prisma.Decimal(0), toDecimal(deal.totalInterestRepaid).minus(repayment.interestPortion));
      const newOutPrinc = roundMoney(toDecimal(deal.financeAmountApproved).minus(newPrincRepaid));
      const newOutTotal = roundMoney(toDecimal(deal.totalPayable).minus(newPrincRepaid).minus(newIntRepaid));

      await tx.financeDeal.update({
        where: { id: deal.id },
        data: {
          totalPrincipalRepaid: newPrincRepaid.toString(),
          totalInterestRepaid: newIntRepaid.toString(),
          outstandingPrincipal: newOutPrinc.toString(),
          outstandingTotal: newOutTotal.toString(),
          status: 'ACTIVE',
          completedAt: null,
        },
      });

      await tx.repaymentAllocation.deleteMany({ where: { repaymentId } });
      await tx.companyProfit.deleteMany({ where: { distribution: { repaymentId } } });
      await tx.partnerReturn.deleteMany({ where: { distribution: { repaymentId } } });
      await tx.investorReturn.deleteMany({ where: { distribution: { repaymentId } } });
      await tx.distribution.deleteMany({ where: { repaymentId } });
      await tx.ledgerEntry.deleteMany({ where: { transaction: { repaymentId } } });
      await tx.transaction.deleteMany({ where: { repaymentId } });
      return tx.repayment.delete({ where: { id: repaymentId } });
    });
  }

  static async previewRepayment(params: { companyId: string; dealId: string; amountReceived: number | DecimalValue }) {
    const { companyId, dealId, amountReceived } = params;
    const amount = roundMoney(amountReceived);

    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Repayment amount must be strictly greater than zero');
    }

    const deal = await prisma.financeDeal.findFirst({
      where: { id: dealId, companyId },
      include: {
        client: true,
        fundings: {
          include: {
            partner: true,
            investor: true,
          },
        },
        distributionRules: true,
        schedules: {
          where: {
            status: { notIn: [ScheduleStatus.PAID, ScheduleStatus.WAIVED] },
          },
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!deal) throw new Error('Deal not found');
    if (deal.schedules.length === 0) {
      throw new Error('No pending installments found for this deal');
    }

    let unallocatedAmount = amount;
    let totalAllocatedPrincipal = new Prisma.Decimal(0);
    let totalAllocatedInterest = new Prisma.Decimal(0);

    const allocationPreview: Array<{
      scheduleId: string;
      installmentNumber: number;
      dueDate: Date;
      principal: string;
      interest: string;
      total: string;
      newBalance: string;
    }> = [];

    for (const schedule of deal.schedules) {
      if (unallocatedAmount.isZero()) break;

      const schedulePendingBalance = roundMoney(schedule.balanceAmount);
      const unpaidPrincipal = roundMoney(toDecimal(schedule.principalAmount).minus(schedule.paidPrincipal));
      const unpaidInterest = roundMoney(toDecimal(schedule.interestAmount).minus(schedule.paidInterest));

      const paymentForThisSchedule = decimalMin(unallocatedAmount, schedulePendingBalance);

      let allocPrincipal = new Prisma.Decimal(0);
      let allocInterest = new Prisma.Decimal(0);

      if (schedulePendingBalance.isZero()) {
        continue;
      }

      if (paymentForThisSchedule.equals(schedulePendingBalance)) {
        allocPrincipal = unpaidPrincipal;
        allocInterest = unpaidInterest;
      } else {
        const totalUnpaid = unpaidPrincipal.plus(unpaidInterest);
        if (totalUnpaid.isPositive()) {
          allocPrincipal = roundMoney(paymentForThisSchedule.times(unpaidPrincipal).dividedBy(totalUnpaid));
          allocInterest = roundMoney(paymentForThisSchedule.minus(allocPrincipal));
        }
      }

      const allocTotal = roundMoney(allocPrincipal.plus(allocInterest));
      const newBalance = roundMoney(schedulePendingBalance.minus(allocTotal));

      allocationPreview.push({
        scheduleId: schedule.id,
        installmentNumber: schedule.installmentNumber,
        dueDate: schedule.dueDate,
        principal: allocPrincipal.toString(),
        interest: allocInterest.toString(),
        total: allocTotal.toString(),
        newBalance: newBalance.toString(),
      });

      totalAllocatedPrincipal = totalAllocatedPrincipal.plus(allocPrincipal);
      totalAllocatedInterest = totalAllocatedInterest.plus(allocInterest);
      unallocatedAmount = roundMoney(unallocatedAmount.minus(paymentForThisSchedule));
    }

    const distRule = deal.distributionRules[0] || {
      companyCommissionRate: new Prisma.Decimal(0),
    };

    const fundingParticipants = deal.fundings.map((f) => ({
      id: f.id,
      sourceType: f.sourceType as any,
      partnerId: f.partnerId,
      investorId: f.investorId,
      amount: toDecimal(f.amount),
      percentage: toDecimal(f.percentage),
      expectedReturnRate: toDecimal(f.expectedReturnRate),
    }));

    const distributionResult = DistributionEngine.executeRepaymentSplit(
      totalAllocatedPrincipal,
      totalAllocatedInterest,
      deal.financeAmountApproved,
      fundingParticipants,
      {
        companyCommissionRate: toDecimal(distRule.companyCommissionRate),
      }
    );

    // Enrich investor and partner details with human readable names
    const enrichedInvestorReturns = distributionResult.investorReturns.map((r) => {
      const f = deal.fundings.find((item) => item.investorId === r.investorId);
      return {
        ...r,
        investorName: f?.investor?.name || 'Outside Investor',
        sharePercentage: f ? toDecimal(f.percentage).toNumber() : 0,
        investedAmount: f ? toDecimal(f.amount).toNumber() : 0,
      };
    });

    const enrichedPartnerReturns = distributionResult.partnerReturns.map((r) => {
      const f = deal.fundings.find((item) => item.partnerId === r.partnerId);
      return {
        ...r,
        partnerName: f?.partner?.name || 'Partner',
        sharePercentage: f ? toDecimal(f.percentage).toNumber() : 0,
        investedAmount: f ? toDecimal(f.amount).toNumber() : 0,
      };
    });

    const compFunding = deal.fundings.find((item) => item.sourceType === 'COMPANY');

    return {
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      clientName: deal.client.fullName,
      amountReceived: amount.toString(),
      principalPortion: totalAllocatedPrincipal.toString(),
      interestPortion: totalAllocatedInterest.toString(),
      allocations: allocationPreview,
      waterfall: {
        companyCapital: {
          sharePercentage: compFunding ? toDecimal(compFunding.percentage).toNumber() : 0,
          investedAmount: compFunding ? toDecimal(compFunding.amount).toNumber() : 0,
          principalRecovered: distributionResult.companyProfit.principalRecovered.toString(),
          managementCommission: distributionResult.companyProfit.managementCommission.toString(),
          retainedInterestMargin: distributionResult.companyProfit.retainedInterestMargin.toString(),
          totalCompanyProfit: distributionResult.companyProfit.totalCompanyProfit.toString(),
        },
        investorReturns: enrichedInvestorReturns,
        partnerReturns: enrichedPartnerReturns,
        totals: {
          totalPrincipalSplit: distributionResult.totalPrincipalSplit.toString(),
          totalInterestSplit: distributionResult.totalInterestSplit.toString(),
          totalDistributed: distributionResult.totalDistributed.toString(),
        },
      },
    };
  }
}
