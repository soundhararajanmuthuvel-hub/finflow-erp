import { Prisma } from '@prisma/client';
import { roundMoney, toDecimal, DecimalValue } from '../utils/decimal.js';

export interface FundingParticipant {
  id: string;
  sourceType: 'COMPANY' | 'PARTNER' | 'OUTSIDE_INVESTOR';
  partnerId?: string | null;
  investorId?: string | null;
  amount: Prisma.Decimal;
  percentage: Prisma.Decimal;
  expectedReturnRate: Prisma.Decimal;
}

export interface DistributionConfig {
  companyCommissionRate: Prisma.Decimal;
  outsideInvestorReturnRate?: Prisma.Decimal;
  partnerProfitShareRate?: Prisma.Decimal;
}

export interface InvestorReturnResult {
  investorId: string;
  principalReturned: Prisma.Decimal;
  interestEarned: Prisma.Decimal;
  totalPayout: Prisma.Decimal;
}

export interface PartnerReturnResult {
  partnerId: string;
  principalReturned: Prisma.Decimal;
  profitShare: Prisma.Decimal;
  totalPayout: Prisma.Decimal;
}

export interface CompanyProfitResult {
  principalRecovered: Prisma.Decimal;
  managementCommission: Prisma.Decimal;
  retainedInterestMargin: Prisma.Decimal;
  totalCompanyProfit: Prisma.Decimal;
}

export interface DistributionResult {
  totalPrincipalSplit: Prisma.Decimal;
  totalInterestSplit: Prisma.Decimal;
  totalDistributed: Prisma.Decimal;
  investorReturns: InvestorReturnResult[];
  partnerReturns: PartnerReturnResult[];
  companyProfit: CompanyProfitResult;
}

export class DistributionEngine {
  static executeRepaymentSplit(
    principalReceived: DecimalValue,
    interestReceived: DecimalValue,
    totalDealAmount: DecimalValue,
    fundings: FundingParticipant[],
    config: DistributionConfig
  ): DistributionResult {
    const P_rec = roundMoney(principalReceived);
    const I_rec = roundMoney(interestReceived);

    const investorReturns: InvestorReturnResult[] = [];
    const partnerReturns: PartnerReturnResult[] = [];

    let totalInvestorPrincipal = new Prisma.Decimal(0);
    let totalInvestorInterest = new Prisma.Decimal(0);

    let totalPartnerPrincipal = new Prisma.Decimal(0);
    let totalPartnerProfit = new Prisma.Decimal(0);

    let companyPrincipalRecovered = new Prisma.Decimal(0);

    // 1. Calculate Company Management/Collection Commission
    const commRate = toDecimal(config.companyCommissionRate);
    const managementCommission = roundMoney(I_rec.times(commRate).dividedBy(100));
    
    // Net distributable interest
    const netDistributableInterest = roundMoney(I_rec.minus(managementCommission));

    // 2. Loop through funding sources
    for (const funding of fundings) {
      const shareFraction = funding.percentage.dividedBy(100);
      const principalShare = roundMoney(P_rec.times(shareFraction));

      if (funding.sourceType === 'OUTSIDE_INVESTOR' && funding.investorId) {
        const interestShare = roundMoney(netDistributableInterest.times(shareFraction));
        const totalPayout = roundMoney(principalShare.plus(interestShare));

        investorReturns.push({
          investorId: funding.investorId,
          principalReturned: principalShare,
          interestEarned: interestShare,
          totalPayout,
        });

        totalInvestorPrincipal = totalInvestorPrincipal.plus(principalShare);
        totalInvestorInterest = totalInvestorInterest.plus(interestShare);
      } else if (funding.sourceType === 'PARTNER' && funding.partnerId) {
        const profitShare = roundMoney(netDistributableInterest.times(shareFraction));
        const totalPayout = roundMoney(principalShare.plus(profitShare));

        partnerReturns.push({
          partnerId: funding.partnerId,
          principalReturned: principalShare,
          profitShare,
          totalPayout,
        });

        totalPartnerPrincipal = totalPartnerPrincipal.plus(principalShare);
        totalPartnerProfit = totalPartnerProfit.plus(profitShare);
      } else if (funding.sourceType === 'COMPANY') {
        companyPrincipalRecovered = companyPrincipalRecovered.plus(principalShare);
      }
    }

    const totalDistributedInterestToPartnersAndInvestors = totalInvestorInterest.plus(totalPartnerProfit);
    const retainedInterestMargin = roundMoney(
      netDistributableInterest.minus(totalDistributedInterestToPartnersAndInvestors)
    );

    const totalCompanyProfit = roundMoney(managementCommission.plus(retainedInterestMargin));

    const companyProfit: CompanyProfitResult = {
      principalRecovered: companyPrincipalRecovered,
      managementCommission,
      retainedInterestMargin,
      totalCompanyProfit,
    };

    const totalPrincipalSplit = roundMoney(
      totalInvestorPrincipal.plus(totalPartnerPrincipal).plus(companyPrincipalRecovered)
    );

    const totalInterestSplit = roundMoney(
      totalInvestorInterest.plus(totalPartnerProfit).plus(totalCompanyProfit)
    );

    const totalDistributed = roundMoney(totalPrincipalSplit.plus(totalInterestSplit));

    return {
      totalPrincipalSplit,
      totalInterestSplit,
      totalDistributed,
      investorReturns,
      partnerReturns,
      companyProfit,
    };
  }
}
