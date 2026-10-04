import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { Role, DealStatus, RepaymentFrequency, PaymentMethod } from '../types/enums.js';
import { CalculationEngine } from './calculationEngine.js';
import { RepaymentService } from './repaymentService.js';
import { LedgerService } from './ledgerService.js';
import bcrypt from 'bcryptjs';

export class DemoService {
  static async resetDemoData(companyId: string, userId: string) {
    // 1. Ensure Company ledger accounts
    await LedgerService.initializeChartOfAccounts(prisma, companyId);

    // 2. Ensure Partners
    const partnerA = await prisma.partner.upsert({
      where: { partnerCode: 'PRT-0001' },
      update: {},
      create: {
        companyId,
        partnerCode: 'PRT-0001',
        name: 'Partner A (Vikram Singhania)',
        phone: '+91 98111 00001',
        email: 'vikram@partners.in',
        capitalContribution: '500000.00',
        sharePercentage: '50.00',
      },
    });

    const partnerB = await prisma.partner.upsert({
      where: { partnerCode: 'PRT-0002' },
      update: {},
      create: {
        companyId,
        partnerCode: 'PRT-0002',
        name: 'Partner B (Ananya Mehta)',
        phone: '+91 98111 00002',
        email: 'ananya@partners.in',
        capitalContribution: '500000.00',
        sharePercentage: '50.00',
      },
    });

    // 3. Ensure Outside Investors
    const investorA = await prisma.investor.upsert({
      where: { investorCode: 'INV-0001' },
      update: {},
      create: {
        companyId,
        investorCode: 'INV-0001',
        name: 'Investor A (Suresh Rao)',
        phone: '+91 98222 00001',
        email: 'suresh.rao@investor.in',
        pan: 'ABCDE1234F',
        bankName: 'HDFC Bank',
        bankAccountNo: '50100234567890',
        ifscCode: 'HDFC0000123',
      },
    });

    const investorB = await prisma.investor.upsert({
      where: { investorCode: 'INV-0002' },
      update: {},
      create: {
        companyId,
        investorCode: 'INV-0002',
        name: 'Investor B (Meera Iyer)',
        phone: '+91 98222 00002',
        email: 'meera.iyer@investor.in',
        pan: 'BCDEF2345G',
        bankName: 'ICICI Bank',
        bankAccountNo: '001101567890',
        ifscCode: 'ICIC0000011',
      },
    });

    // 4. Ensure Client ABC Traders
    const client = await prisma.client.upsert({
      where: { clientCode: 'CLI-0001' },
      update: {
        fullName: 'ABC Traders',
        businessName: 'ABC Wholesale & Trading Co.',
      },
      create: {
        companyId,
        clientCode: 'CLI-0001',
        fullName: 'ABC Traders',
        businessName: 'ABC Wholesale & Trading Co.',
        phone: '+91 98333 11111',
        email: 'contact@abctraders.in',
        address: 'Plot 45, Commercial Market Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        pan: 'ABCDE1234Z',
        gstin: '27ABCDE1234Z1Z5',
        businessType: 'Partnership Firm',
        industry: 'FMCG & Wholesale Trading',
      },
    });

    // 5. Clean existing deals for ABC Traders or FDL-00001
    const oldDeals = await prisma.financeDeal.findMany({
      where: {
        companyId,
        OR: [
          { clientId: client.id },
          { dealNumber: 'FIN-000001' },
          { dealNumber: 'FDL-00001' },
        ],
      },
    });

    for (const d of oldDeals) {
      await prisma.repaymentAllocation.deleteMany({ where: { schedule: { dealId: d.id } } });
      await prisma.companyProfit.deleteMany({ where: { distribution: { dealId: d.id } } });
      await prisma.partnerReturn.deleteMany({ where: { distribution: { dealId: d.id } } });
      await prisma.investorReturn.deleteMany({ where: { distribution: { dealId: d.id } } });
      await prisma.distribution.deleteMany({ where: { dealId: d.id } });
      await prisma.distributionRule.deleteMany({ where: { dealId: d.id } });
      await prisma.repaymentSchedule.deleteMany({ where: { dealId: d.id } });
      await prisma.dealFunding.deleteMany({ where: { dealId: d.id } });
      await prisma.ledgerEntry.deleteMany({ where: { transaction: { dealId: d.id } } });
      await prisma.transaction.deleteMany({ where: { dealId: d.id } });
      await prisma.repayment.deleteMany({ where: { dealId: d.id } });
      await prisma.financeDeal.delete({ where: { id: d.id } });
    }

    // 6. Dynamic relative dates
    const now = new Date();
    const startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago

    const P = new Prisma.Decimal('100000.00');
    const N = 10; // 10 weekly installments
    const installmentAmount = new Prisma.Decimal('11000.00'); // ₹11,000 per week
    const totalPayable = new Prisma.Decimal('110000.00');
    const totalInterest = new Prisma.Decimal('10000.00');

    const calculatedEndDate = new Date(startDate.getTime() + N * 7 * 24 * 60 * 60 * 1000);

    const deal = await prisma.financeDeal.create({
      data: {
        companyId,
        dealNumber: 'FIN-000001',
        clientId: client.id,
        financeAmountRequired: P.toString(),
        financeAmountApproved: P.toString(),
        startDate,
        endDate: calculatedEndDate,
        interestType: 'FIXED_WEEKLY',
        interestRate: '10.00',
        totalInterest: totalInterest.toString(),
        totalPayable: totalPayable.toString(),
        repaymentFrequency: RepaymentFrequency.WEEKLY,
        numberOfRepayments: N,
        installmentAmount: installmentAmount.toString(),
        outstandingPrincipal: P.toString(),
        outstandingTotal: totalPayable.toString(),
        status: DealStatus.ACTIVE,
        purpose: 'Working Capital & Weekly Stock Purchase (DEMO DATA)',
        notes: 'DEMO DATA: Client requested ₹1,00,000. Funded: Company ₹50,000 (50%), Investor A ₹25,000 (25%), Investor B ₹25,000 (25%).',
        createdById: userId,
        approvedById: userId,
        approvedAt: startDate,
        activatedAt: startDate,
      },
    });

    // 7. Funding syndication breakdown
    await prisma.dealFunding.createMany({
      data: [
        {
          dealId: deal.id,
          sourceType: 'COMPANY',
          amount: '50000.00',
          percentage: '50.0000',
          expectedReturnRate: '10.00',
          status: 'DISBURSED',
          notes: 'Company Capital allocation',
        },
        {
          dealId: deal.id,
          sourceType: 'OUTSIDE_INVESTOR',
          investorId: investorA.id,
          amount: '25000.00',
          percentage: '25.0000',
          expectedReturnRate: '10.00',
          status: 'DISBURSED',
          notes: 'Investor A funding allocation',
        },
        {
          dealId: deal.id,
          sourceType: 'OUTSIDE_INVESTOR',
          investorId: investorB.id,
          amount: '25000.00',
          percentage: '25.0000',
          expectedReturnRate: '10.00',
          status: 'DISBURSED',
          notes: 'Investor B funding allocation',
        },
      ],
    });

    // 8. Weekly repayment schedule with dynamic dates
    for (let i = 1; i <= N; i++) {
      const dueDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      await prisma.repaymentSchedule.create({
        data: {
          dealId: deal.id,
          installmentNumber: i,
          dueDate,
          principalAmount: '10000.00',
          interestAmount: '1000.00',
          totalDue: '11000.00',
          balanceAmount: '11000.00',
          status: 'UPCOMING',
        },
      });
    }

    // 9. Distribution rule
    await prisma.distributionRule.create({
      data: {
        dealId: deal.id,
        companyCommissionRate: '10.00',
        outsideInvestorReturnRate: '10.00',
        partnerProfitShareRate: '0.00',
        ruleDescription: '10% Company Commission, Pro-rata Investor Return & Capital recovery',
      },
    });

    // 10. Ledger posting for disbursement
    const disbursementEntries: any[] = [
      {
        accountCode: '1100',
        debit: P,
        credit: 0,
        narration: `Client loan disbursement for Deal ${deal.dealNumber} - ${client.fullName}`,
      },
      {
        accountCode: '1000',
        debit: 0,
        credit: 50000,
        narration: `Company capital contribution for Deal ${deal.dealNumber}`,
      },
      {
        accountCode: '2000',
        debit: 0,
        credit: 25000,
        narration: `Investor A capital contribution for Deal ${deal.dealNumber}`,
      },
      {
        accountCode: '2000',
        debit: 0,
        credit: 25000,
        narration: `Investor B capital contribution for Deal ${deal.dealNumber}`,
      },
    ];

    await LedgerService.recordJournalTransaction(prisma, {
      companyId,
      dealId: deal.id,
      transactionType: 'CLIENT_FINANCE_DISBURSED' as any,
      amount: P,
      description: `Disbursement to ${client.fullName} under Deal ${deal.dealNumber}`,
      entries: disbursementEntries,
    });

    // 11. Record 2 sample weekly collections (Week 1 = 7 days ago, Week 2 = today)
    const paymentDate1 = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const paymentDate2 = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    await RepaymentService.recordRepayment({
      companyId,
      userId,
      dealId: deal.id,
      amountReceived: 11000,
      paymentDate: paymentDate1,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'NEFT-DEMO-001',
      notes: 'Week 1 collection - regular on-time payment (DEMO)',
    });

    await RepaymentService.recordRepayment({
      companyId,
      userId,
      dealId: deal.id,
      amountReceived: 11000,
      paymentDate: paymentDate2,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: 'UPI-DEMO-002',
      notes: 'Week 2 collection - prompt settlement (DEMO)',
    });

    return deal;
  }
}
