import { Prisma } from '@prisma/client';
import { InterestType, RepaymentFrequency } from '../types/enums.js';
import { roundMoney, toDecimal, decimalMax, DecimalValue } from '../utils/decimal.js';

export interface GenerateScheduleParams {
  financeAmount: DecimalValue;
  interestRate: DecimalValue;
  interestType: InterestType | string;
  frequency: RepaymentFrequency | string;
  numberOfRepayments: number;
  startDate: Date;
  customInstallmentAmount?: DecimalValue;
}

export interface ScheduleInstallmentItem {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  totalDue: Prisma.Decimal;
  balanceAmount: Prisma.Decimal;
}

export class CalculationEngine {
  static calculateDealTotals(
    principal: DecimalValue,
    annualRate: DecimalValue,
    numberOfRepayments: number,
    frequency: RepaymentFrequency | string,
    interestType: InterestType | string,
    customInstallmentAmount?: DecimalValue
  ) {
    const P = toDecimal(principal);
    const r = toDecimal(annualRate || 0);
    const N = numberOfRepayments;

    let durationYears = new Prisma.Decimal(0);
    switch (frequency) {
      case RepaymentFrequency.DAILY:
      case 'DAILY':
        durationYears = new Prisma.Decimal(N).dividedBy(365);
        break;
      case RepaymentFrequency.WEEKLY:
      case 'WEEKLY':
      case 'FIXED_WEEKLY':
        durationYears = new Prisma.Decimal(N).dividedBy(52);
        break;
      case RepaymentFrequency.BI_WEEKLY:
      case 'BI_WEEKLY':
        durationYears = new Prisma.Decimal(N).dividedBy(26);
        break;
      case RepaymentFrequency.MONTHLY:
      case 'MONTHLY':
      case 'FIXED_MONTHLY':
      default:
        durationYears = new Prisma.Decimal(N).dividedBy(12);
        break;
    }

    let totalInterest = new Prisma.Decimal(0);
    let totalPayable = new Prisma.Decimal(0);
    let installmentAmount = new Prisma.Decimal(0);

    if (customInstallmentAmount && toDecimal(customInstallmentAmount).isPositive()) {
      installmentAmount = roundMoney(customInstallmentAmount);
      totalPayable = roundMoney(installmentAmount.times(N));
      totalInterest = roundMoney(decimalMax(new Prisma.Decimal(0), totalPayable.minus(P)));
    } else if (interestType === InterestType.REDUCING_BALANCE || interestType === 'REDUCING_BALANCE') {
      const periodsPerYear = frequency === RepaymentFrequency.WEEKLY || frequency === 'WEEKLY' ? 52 : frequency === RepaymentFrequency.BI_WEEKLY || frequency === 'BI_WEEKLY' ? 26 : frequency === RepaymentFrequency.DAILY || frequency === 'DAILY' ? 365 : 12;
      const periodicRate = r.dividedBy(100).dividedBy(periodsPerYear);
      
      if (periodicRate.isZero()) {
        totalInterest = new Prisma.Decimal(0);
        totalPayable = P;
        installmentAmount = roundMoney(P.dividedBy(N));
      } else {
        const rateFactor = periodicRate.plus(1).pow(N);
        const emi = P.times(periodicRate).times(rateFactor).dividedBy(rateFactor.minus(1));
        installmentAmount = roundMoney(emi);
        totalPayable = roundMoney(installmentAmount.times(N));
        totalInterest = roundMoney(totalPayable.minus(P));
      }
    } else if (interestType === 'PRINCIPAL_PLUS_INTEREST' || interestType === 'FIXED_WEEKLY' || interestType === 'FIXED_MONTHLY' || interestType === InterestType.FLAT || interestType === 'FLAT') {
      // Flat or simple interest across duration
      totalInterest = roundMoney(P.times(r).dividedBy(100).times(durationYears));
      totalPayable = roundMoney(P.plus(totalInterest));
      installmentAmount = roundMoney(totalPayable.dividedBy(N));
    } else {
      totalInterest = roundMoney(P.times(r).dividedBy(100).times(durationYears));
      totalPayable = roundMoney(P.plus(totalInterest));
      installmentAmount = roundMoney(totalPayable.dividedBy(N));
    }

    return {
      principal: roundMoney(P),
      totalInterest,
      totalPayable,
      installmentAmount,
    };
  }

  static generateSchedule(params: GenerateScheduleParams): ScheduleInstallmentItem[] {
    const { financeAmount, interestRate, interestType, frequency, numberOfRepayments, startDate, customInstallmentAmount } = params;
    const P = toDecimal(financeAmount);
    const N = numberOfRepayments;
    
    if (N <= 0) throw new Error('Number of repayments must be at least 1');

    const totals = this.calculateDealTotals(P, interestRate, N, frequency, interestType, customInstallmentAmount);
    const installments: ScheduleInstallmentItem[] = [];

    let remainingPrincipal = P;
    const standardPrincipalPerInstallment = roundMoney(P.dividedBy(N));
    const standardInterestPerInstallment = roundMoney(totals.totalInterest.dividedBy(N));

    let accumulatedPrincipal = new Prisma.Decimal(0);
    let accumulatedInterest = new Prisma.Decimal(0);

    for (let i = 1; i <= N; i++) {
      const dueDate = this.calculateNextDueDate(new Date(startDate), i, frequency);

      let principalAmount: Prisma.Decimal;
      let interestAmount: Prisma.Decimal;

      if (i === N) {
        principalAmount = roundMoney(P.minus(accumulatedPrincipal));
        interestAmount = roundMoney(totals.totalInterest.minus(accumulatedInterest));
      } else {
        principalAmount = standardPrincipalPerInstallment;
        interestAmount = standardInterestPerInstallment;
      }

      accumulatedPrincipal = accumulatedPrincipal.plus(principalAmount);
      accumulatedInterest = accumulatedInterest.plus(interestAmount);
      remainingPrincipal = roundMoney(remainingPrincipal.minus(principalAmount));

      const totalDue = roundMoney(principalAmount.plus(interestAmount));

      installments.push({
        installmentNumber: i,
        dueDate,
        principalAmount,
        interestAmount,
        totalDue,
        balanceAmount: totalDue,
      });
    }

    return installments;
  }

  static calculateNextDueDate(startDate: Date, installmentIndex: number, frequency: RepaymentFrequency | string): Date {
    const d = new Date(startDate);
    switch (frequency) {
      case RepaymentFrequency.DAILY:
      case 'DAILY':
        d.setDate(d.getDate() + installmentIndex);
        break;
      case RepaymentFrequency.WEEKLY:
      case 'WEEKLY':
      case 'FIXED_WEEKLY':
        d.setDate(d.getDate() + installmentIndex * 7);
        break;
      case RepaymentFrequency.BI_WEEKLY:
      case 'BI_WEEKLY':
        d.setDate(d.getDate() + installmentIndex * 14);
        break;
      case RepaymentFrequency.MONTHLY:
      case 'MONTHLY':
      case 'FIXED_MONTHLY':
      default:
        d.setMonth(d.getMonth() + installmentIndex);
        break;
    }
    return d;
  }

  static validateFundingMatch(approvedAmount: DecimalValue, fundingAmounts: DecimalValue[]): { isValid: boolean; totalFunded: Prisma.Decimal; difference: Prisma.Decimal } {
    const approved = roundMoney(approvedAmount);
    const totalFunded = fundingAmounts.reduce((acc: Prisma.Decimal, val) => acc.plus(toDecimal(val)), new Prisma.Decimal(0));
    const diff = roundMoney(approved.minus(totalFunded));

    return {
      isValid: diff.isZero(),
      totalFunded: roundMoney(totalFunded),
      difference: diff,
    };
  }
}
