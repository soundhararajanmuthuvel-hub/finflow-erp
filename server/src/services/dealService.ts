import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { DealStatus, TransactionType, ScheduleStatus } from '../types/enums.js';
import { CalculationEngine } from './calculationEngine.js';
import { LedgerService } from './ledgerService.js';
import { roundMoney, toDecimal, calculatePercentage, decimalMax } from '../utils/decimal.js';
import { recordAuditLog } from '../utils/audit.js';

export class DealService {
  static async listDeals(companyId: string, status?: DealStatus, search?: string) {
    const where: any = { companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { dealNumber: { contains: search } },
        { client: { fullName: { contains: search } } },
        { client: { businessName: { contains: search } } },
      ];
    }

    return prisma.financeDeal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            businessName: true,
            phone: true,
          },
        },
        fundings: {
          include: {
            partner: { select: { id: true, name: true } },
            investor: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async getDealById(companyId: string, id: string) {
    const deal = await prisma.financeDeal.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        createdBy: { select: { id: true, fullName: true, role: true } },
        approvedBy: { select: { id: true, fullName: true, role: true } },
        fundings: {
          include: {
            partner: true,
            investor: true,
          },
        },
        schedules: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            allocations: {
              include: {
                repayment: true,
              },
            },
          },
        },
        repayments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            recordedBy: { select: { id: true, fullName: true } },
            distributions: {
              include: {
                investorReturns: { include: { investor: true } },
                partnerReturns: { include: { partner: true } },
                companyProfits: true,
              },
            },
          },
        },
        distributionRules: true,
        distributions: {
          orderBy: { createdAt: 'desc' },
          include: {
            repayment: true,
            investorReturns: { include: { investor: true } },
            partnerReturns: { include: { partner: true } },
            companyProfits: true,
          },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          include: {
            ledgerEntries: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });

    if (!deal) throw new Error('Finance deal not found');
    return deal;
  }

  static async createDeal(companyId: string, userId: string, data: any) {
    const P = roundMoney(data.financeAmountApproved);
    const N = data.numberOfRepayments;
    const r = data.interestRate;
    const frequency = data.repaymentFrequency;
    const interestType = data.interestType;

    const fundingAmounts = data.fundings.map((f: any) => f.amount);
    const fundingCheck = CalculationEngine.validateFundingMatch(P, fundingAmounts);

    if (!fundingCheck.isValid) {
      throw new Error(
        `Funding total (₹${fundingCheck.totalFunded}) does not match approved amount (₹${P}). Difference: ₹${fundingCheck.difference}`
      );
    }

    const totals = CalculationEngine.calculateDealTotals(P, r, N, frequency, interestType, data.customInstallmentAmount);
    const schedulesData = CalculationEngine.generateSchedule({
      financeAmount: P,
      interestRate: r,
      interestType,
      frequency,
      numberOfRepayments: N,
      startDate: new Date(data.startDate),
      customInstallmentAmount: data.customInstallmentAmount,
    });

    const count = await prisma.financeDeal.count({ where: { companyId } });
    const dealNumber = `FDL-${String(count + 1).padStart(5, '0')}`;

    const calculatedEndDate = schedulesData[schedulesData.length - 1]?.dueDate || new Date();

    return prisma.$transaction(async (tx) => {
      const deal = await tx.financeDeal.create({
        data: {
          companyId,
          dealNumber,
          clientId: data.clientId,
          financeAmountRequired: roundMoney(data.financeAmountRequired).toString(),
          financeAmountApproved: P.toString(),
          startDate: new Date(data.startDate),
          endDate: calculatedEndDate,
          interestType,
          interestRate: new Prisma.Decimal(r).toString(),
          totalInterest: totals.totalInterest.toString(),
          totalPayable: totals.totalPayable.toString(),
          repaymentFrequency: frequency,
          numberOfRepayments: N,
          installmentAmount: totals.installmentAmount.toString(),
          outstandingPrincipal: P.toString(),
          outstandingTotal: totals.totalPayable.toString(),
          status: DealStatus.PENDING_APPROVAL,
          purpose: data.purpose || null,
          notes: data.notes || null,
          createdById: userId,
        },
      });

      for (const f of data.fundings) {
        const fundingAmount = roundMoney(f.amount);
        const percentage = calculatePercentage(fundingAmount, P);

        await tx.dealFunding.create({
          data: {
            dealId: deal.id,
            sourceType: f.sourceType,
            partnerId: f.sourceType === 'PARTNER' ? f.partnerId : null,
            investorId: f.sourceType === 'OUTSIDE_INVESTOR' ? f.investorId : null,
            amount: fundingAmount.toString(),
            percentage: percentage.toString(),
            expectedReturnRate: f.expectedReturnRate ? new Prisma.Decimal(f.expectedReturnRate).toString() : '0.00',
            notes: f.notes || null,
          },
        });
      }

      for (const sch of schedulesData) {
        await tx.repaymentSchedule.create({
          data: {
            dealId: deal.id,
            installmentNumber: sch.installmentNumber,
            dueDate: sch.dueDate,
            principalAmount: sch.principalAmount.toString(),
            interestAmount: sch.interestAmount.toString(),
            totalDue: sch.totalDue.toString(),
            balanceAmount: sch.balanceAmount.toString(),
            status: 'UPCOMING',
          },
        });
      }

      if (data.distributionRule) {
        await tx.distributionRule.create({
          data: {
            dealId: deal.id,
            companyCommissionRate: new Prisma.Decimal(data.distributionRule.companyCommissionRate || 0).toString(),
            outsideInvestorReturnRate: new Prisma.Decimal(data.distributionRule.outsideInvestorReturnRate || 0).toString(),
            partnerProfitShareRate: new Prisma.Decimal(data.distributionRule.partnerProfitShareRate || 0).toString(),
            ruleDescription: data.distributionRule.ruleDescription || 'Standard Deal Rule',
          },
        });
      }

      return deal;
    });
  }

  static async approveDeal(companyId: string, dealId: string, approvedById: string) {
    const deal = await prisma.financeDeal.findFirst({
      where: { id: dealId, companyId },
    });

    if (!deal) throw new Error('Deal not found');
    if (deal.status !== DealStatus.PENDING_APPROVAL && deal.status !== DealStatus.DRAFT) {
      throw new Error(`Cannot approve deal in status ${deal.status}`);
    }

    return prisma.financeDeal.update({
      where: { id: dealId },
      data: {
        status: DealStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  static async activateDeal(companyId: string, dealId: string) {
    return prisma.$transaction(async (tx) => {
      const deal = await tx.financeDeal.findFirst({
        where: { id: dealId, companyId },
        include: {
          fundings: true,
          client: true,
        },
      });

      if (!deal) throw new Error('Deal not found');
      if (deal.status !== DealStatus.APPROVED) {
        throw new Error('Only APPROVED deals can be activated and disbursed');
      }

      const fundingAmounts = deal.fundings.map((f) => f.amount);
      const fundingCheck = CalculationEngine.validateFundingMatch(deal.financeAmountApproved, fundingAmounts);

      if (!fundingCheck.isValid) {
        throw new Error(
          `Cannot activate deal: Funding total (${fundingCheck.totalFunded}) does not match approved amount (${deal.financeAmountApproved})`
        );
      }

      const updatedDeal = await tx.financeDeal.update({
        where: { id: dealId },
        data: {
          status: DealStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });

      await tx.dealFunding.updateMany({
        where: { dealId },
        data: { status: 'DISBURSED' },
      });

      await LedgerService.initializeChartOfAccounts(tx, companyId);

      const ledgerEntries: any[] = [
        {
          accountCode: '1100',
          debit: deal.financeAmountApproved,
          credit: 0,
          narration: `Client loan disbursement for Deal ${deal.dealNumber} - ${deal.client.fullName}`,
        },
      ];

      for (const f of deal.fundings) {
        if (f.sourceType === 'COMPANY') {
          ledgerEntries.push({
            accountCode: '1000',
            debit: 0,
            credit: f.amount,
            narration: `Company capital contribution for Deal ${deal.dealNumber}`,
          });
        } else if (f.sourceType === 'OUTSIDE_INVESTOR') {
          ledgerEntries.push({
            accountCode: '2000',
            debit: 0,
            credit: f.amount,
            narration: `Outside Investor capital contribution for Deal ${deal.dealNumber}`,
          });
        } else if (f.sourceType === 'PARTNER') {
          ledgerEntries.push({
            accountCode: '3100',
            debit: 0,
            credit: f.amount,
            narration: `Partner capital contribution for Deal ${deal.dealNumber}`,
          });
        }
      }

      await LedgerService.recordJournalTransaction(tx, {
        companyId,
        dealId: deal.id,
        transactionType: TransactionType.CLIENT_FINANCE_DISBURSED,
        amount: deal.financeAmountApproved,
        description: `Loan disbursement to ${deal.client.fullName} under Deal ${deal.dealNumber}`,
        entries: ledgerEntries,
      });

      return updatedDeal;
    });
  }

  static async updateDeal(companyId: string, id: string, data: any, userId?: string) {
    const existing = await prisma.financeDeal.findFirst({
      where: { id, companyId },
      include: {
        repayments: true,
        fundings: true,
        schedules: { orderBy: { installmentNumber: 'asc' } },
        distributionRules: true,
        client: true,
      },
    });

    if (!existing) throw new Error('Finance deal not found');

    return prisma.$transaction(async (tx) => {
      // 1. Determine new parameters (using provided data or existing)
      const clientId = data.clientId || existing.clientId;
      const P_req = data.financeAmountRequired !== undefined ? roundMoney(data.financeAmountRequired) : toDecimal(existing.financeAmountRequired);
      const P_app = data.financeAmountApproved !== undefined ? roundMoney(data.financeAmountApproved) : toDecimal(existing.financeAmountApproved);
      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
      const interestType = data.interestType || existing.interestType;
      const interestRate = data.interestRate !== undefined ? new Prisma.Decimal(data.interestRate) : toDecimal(existing.interestRate);
      const frequency = data.repaymentFrequency || existing.repaymentFrequency;
      const numberOfRepayments = data.numberOfRepayments !== undefined ? Number(data.numberOfRepayments) : existing.numberOfRepayments;
      const customInstallmentAmount = data.customInstallmentAmount !== undefined ? roundMoney(data.customInstallmentAmount) : undefined;
      const purpose = data.purpose !== undefined ? data.purpose : existing.purpose;
      const notes = data.notes !== undefined ? data.notes : existing.notes;
      const status = data.status || existing.status;

      // 2. Handle fundings if provided
      if (Array.isArray(data.fundings)) {
        const fundingAmounts = data.fundings.map((f: any) => f.amount);
        const fundingCheck = CalculationEngine.validateFundingMatch(P_app, fundingAmounts);

        if (!fundingCheck.isValid && (status === DealStatus.APPROVED || status === DealStatus.ACTIVE)) {
          throw new Error(
            `Funding total (₹${fundingCheck.totalFunded}) does not match approved amount (₹${P_app}). Difference: ₹${fundingCheck.difference}`
          );
        }

        // Delete existing fundings safely
        await tx.dealFunding.deleteMany({ where: { dealId: id } });

        // Insert updated fundings with recalculated percentages
        for (const f of data.fundings) {
          const itemAmount = roundMoney(f.amount);
          const percentage = P_app.isPositive()
            ? roundMoney(itemAmount.times(100).dividedBy(P_app))
            : new Prisma.Decimal(0);

          await tx.dealFunding.create({
            data: {
              dealId: id,
              sourceType: f.sourceType,
              partnerId: f.sourceType === 'PARTNER' ? f.partnerId : null,
              investorId: f.sourceType === 'OUTSIDE_INVESTOR' ? f.investorId : null,
              amount: itemAmount.toString(),
              percentage: percentage.toString(),
              expectedReturnRate: f.expectedReturnRate ? new Prisma.Decimal(f.expectedReturnRate).toString() : '0.00',
              notes: f.notes || null,
              status: existing.status === DealStatus.ACTIVE ? 'DISBURSED' : 'COMMITTED',
            },
          });
        }
      }

      // 3. Handle Distribution Rules if provided
      if (data.distributionRule) {
        await tx.distributionRule.deleteMany({ where: { dealId: id } });
        await tx.distributionRule.create({
          data: {
            dealId: id,
            companyCommissionRate: new Prisma.Decimal(data.distributionRule.companyCommissionRate || 0).toString(),
            outsideInvestorReturnRate: new Prisma.Decimal(data.distributionRule.outsideInvestorReturnRate || 0).toString(),
            partnerProfitShareRate: new Prisma.Decimal(data.distributionRule.partnerProfitShareRate || 0).toString(),
            ruleDescription: data.distributionRule.ruleDescription || 'Updated Distribution Rule',
          },
        });
      }

      // 4. Handle Repayment Schedules & Totals Recalculation
      let totals = {
        totalInterest: toDecimal(existing.totalInterest),
        totalPayable: toDecimal(existing.totalPayable),
        installmentAmount: toDecimal(existing.installmentAmount),
      };
      let calculatedEndDate = existing.endDate;
      let newOutstandingPrincipal = toDecimal(existing.outstandingPrincipal);
      let newOutstandingTotal = toDecimal(existing.outstandingTotal);

      const termsChanged =
        data.financeAmountApproved !== undefined ||
        data.interestRate !== undefined ||
        data.interestType !== undefined ||
        data.repaymentFrequency !== undefined ||
        data.numberOfRepayments !== undefined ||
        data.startDate !== undefined ||
        data.customInstallmentAmount !== undefined;

      if (termsChanged) {
        if (existing.repayments.length === 0) {
          // Zero collections: clean recalculation of entire schedule
          totals = CalculationEngine.calculateDealTotals(
            P_app,
            interestRate,
            numberOfRepayments,
            frequency,
            interestType,
            customInstallmentAmount
          );

          const schedulesData = CalculationEngine.generateSchedule({
            financeAmount: P_app,
            interestRate,
            interestType,
            frequency,
            numberOfRepayments,
            startDate,
            customInstallmentAmount,
          });

          await tx.repaymentSchedule.deleteMany({ where: { dealId: id } });

          for (const s of schedulesData) {
            await tx.repaymentSchedule.create({
              data: {
                dealId: id,
                installmentNumber: s.installmentNumber,
                dueDate: s.dueDate,
                principalAmount: s.principalAmount.toString(),
                interestAmount: s.interestAmount.toString(),
                totalDue: s.totalDue.toString(),
                balanceAmount: s.balanceAmount.toString(),
                status: ScheduleStatus.UPCOMING,
              },
            });
          }

          calculatedEndDate = schedulesData[schedulesData.length - 1]?.dueDate || calculatedEndDate;
          newOutstandingPrincipal = P_app;
          newOutstandingTotal = totals.totalPayable;
        } else {
          // Has repayments: preserve paid/partially paid schedules and recalculate future installments
          const paidSchedules = existing.schedules.filter((s) => toDecimal(s.paidAmount).isPositive());
          const lastPaidSchedule = paidSchedules[paidSchedules.length - 1];
          const nextInstallmentNum = paidSchedules.length + 1;
          const remainingRepayments = Math.max(1, numberOfRepayments - paidSchedules.length);

          // Delete uncollected upcoming schedules
          await tx.repaymentSchedule.deleteMany({
            where: {
              dealId: id,
              paidAmount: 0,
            },
          });

          // Generate remaining schedules from current outstanding principal
          const scheduleStartDate = lastPaidSchedule ? new Date(lastPaidSchedule.dueDate) : startDate;
          const remainingSchedulesData = CalculationEngine.generateSchedule({
            financeAmount: existing.outstandingPrincipal,
            interestRate,
            interestType,
            frequency,
            numberOfRepayments: remainingRepayments,
            startDate: scheduleStartDate,
          });

          for (let i = 0; i < remainingSchedulesData.length; i++) {
            const item = remainingSchedulesData[i];
            await tx.repaymentSchedule.create({
              data: {
                dealId: id,
                installmentNumber: nextInstallmentNum + i,
                dueDate: item.dueDate,
                principalAmount: item.principalAmount.toString(),
                interestAmount: item.interestAmount.toString(),
                totalDue: item.totalDue.toString(),
                balanceAmount: item.balanceAmount.toString(),
                status: ScheduleStatus.UPCOMING,
              },
            });
          }

          if (remainingSchedulesData.length > 0) {
            calculatedEndDate = remainingSchedulesData[remainingSchedulesData.length - 1].dueDate;
          }
        }
      }

      // 5. Update FinanceDeal record
      const updatedDeal = await tx.financeDeal.update({
        where: { id },
        data: {
          clientId,
          financeAmountRequired: P_req.toString(),
          financeAmountApproved: P_app.toString(),
          startDate,
          endDate: calculatedEndDate,
          interestType,
          interestRate: interestRate.toString(),
          totalInterest: totals.totalInterest.toString(),
          totalPayable: totals.totalPayable.toString(),
          repaymentFrequency: frequency,
          numberOfRepayments,
          installmentAmount: totals.installmentAmount.toString(),
          outstandingPrincipal: newOutstandingPrincipal.toString(),
          outstandingTotal: newOutstandingTotal.toString(),
          purpose,
          notes,
          status,
        },
        include: {
          client: true,
          fundings: {
            include: {
              investor: true,
              partner: true,
            },
          },
          schedules: {
            orderBy: { installmentNumber: 'asc' },
          },
          repayments: {
            orderBy: { paymentDate: 'desc' },
          },
          distributionRules: true,
        },
      });

      // 6. Record Audit Log
      await recordAuditLog({
        companyId,
        userId: userId || undefined,
        action: 'UPDATE_DEAL',
        entity: 'FinanceDeal',
        entityId: id,
        oldValues: {
          clientId: existing.clientId,
          financeAmountApproved: existing.financeAmountApproved.toString(),
          interestRate: existing.interestRate.toString(),
          numberOfRepayments: existing.numberOfRepayments,
          status: existing.status,
        },
        newValues: {
          clientId,
          financeAmountApproved: P_app.toString(),
          interestRate: interestRate.toString(),
          numberOfRepayments,
          status,
        },
      }, tx);

      return updatedDeal;
    });
  }


  static async deleteDeal(companyId: string, id: string) {
    const existing = await prisma.financeDeal.findFirst({
      where: { id, companyId },
      include: { repayments: true },
    });
    if (!existing) throw new Error('Deal not found');

    return prisma.$transaction(async (tx) => {
      await tx.repaymentAllocation.deleteMany({ where: { schedule: { dealId: id } } });
      await tx.companyProfit.deleteMany({ where: { distribution: { dealId: id } } });
      await tx.partnerReturn.deleteMany({ where: { distribution: { dealId: id } } });
      await tx.investorReturn.deleteMany({ where: { distribution: { dealId: id } } });
      await tx.distribution.deleteMany({ where: { dealId: id } });
      await tx.distributionRule.deleteMany({ where: { dealId: id } });
      await tx.repaymentSchedule.deleteMany({ where: { dealId: id } });
      await tx.dealFunding.deleteMany({ where: { dealId: id } });
      await tx.ledgerEntry.deleteMany({ where: { transaction: { dealId: id } } });
      await tx.transaction.deleteMany({ where: { dealId: id } });
      await tx.repayment.deleteMany({ where: { dealId: id } });
      return tx.financeDeal.delete({ where: { id } });
    });
  }

  static async addFunding(companyId: string, dealId: string, data: any) {
    const deal = await prisma.financeDeal.findFirst({
      where: { id: dealId, companyId },
      include: { fundings: true },
    });
    if (!deal) throw new Error('Deal not found');

    const newAmount = roundMoney(data.amount);
    if (newAmount.lessThanOrEqualTo(0)) {
      throw new Error('Funding amount must be greater than zero');
    }

    const currentTotal = deal.fundings.reduce((acc, f) => acc.plus(toDecimal(f.amount)), new Prisma.Decimal(0));
    const approved = toDecimal(deal.financeAmountApproved);
    const newTotal = roundMoney(currentTotal.plus(newAmount));

    if (newTotal.greaterThan(approved)) {
      throw new Error(`Total funding (₹${newTotal}) cannot exceed approved finance amount (₹${approved})`);
    }

    const percentage = calculatePercentage(newAmount, approved);

    const funding = await prisma.dealFunding.create({
      data: {
        dealId,
        sourceType: data.sourceType,
        partnerId: data.sourceType === 'PARTNER' ? data.partnerId : null,
        investorId: data.sourceType === 'OUTSIDE_INVESTOR' ? data.investorId : null,
        amount: newAmount.toString(),
        percentage: percentage.toString(),
        expectedReturnRate: data.expectedReturnRate ? new Prisma.Decimal(data.expectedReturnRate).toString() : '0.00',
        notes: data.notes || null,
        status: deal.status === DealStatus.ACTIVE ? 'DISBURSED' : 'COMMITTED',
      },
      include: {
        partner: true,
        investor: true,
      },
    });

    return funding;
  }

  static async deleteFunding(companyId: string, dealId: string, fundingId: string) {
    const funding = await prisma.dealFunding.findFirst({
      where: { id: fundingId, dealId, deal: { companyId } },
    });
    if (!funding) throw new Error('Funding participant not found');

    return prisma.dealFunding.delete({ where: { id: fundingId } });
  }
}
