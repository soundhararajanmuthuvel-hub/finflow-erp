import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { roundMoney } from '../utils/decimal.js';

export class ClientService {
  static async listClients(companyId: string, search?: string) {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { businessName: { contains: search } },
        { phone: { contains: search } },
        { pan: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        deals: {
          select: {
            id: true,
            dealNumber: true,
            financeAmountApproved: true,
            totalInterest: true,
            totalPrincipalRepaid: true,
            totalInterestRepaid: true,
            outstandingPrincipal: true,
            outstandingTotal: true,
            status: true,
          },
        },
      },
    });

    return clients.map((client) => {
      let totalFinance = new Prisma.Decimal(0);
      let activeFinance = new Prisma.Decimal(0);
      let totalRepaid = new Prisma.Decimal(0);
      let outstanding = new Prisma.Decimal(0);

      client.deals.forEach((d) => {
        totalFinance = totalFinance.plus(d.financeAmountApproved);
        totalRepaid = totalRepaid.plus(d.totalPrincipalRepaid).plus(d.totalInterestRepaid);
        if (d.status === 'ACTIVE' || d.status === 'OVERDUE') {
          activeFinance = activeFinance.plus(d.financeAmountApproved);
          outstanding = outstanding.plus(d.outstandingTotal);
        }
      });

      return {
        ...client,
        totalFinanceReceived: roundMoney(totalFinance).toNumber(),
        activeFinance: roundMoney(activeFinance).toNumber(),
        totalRepaid: roundMoney(totalRepaid).toNumber(),
        outstandingAmount: roundMoney(outstanding).toNumber(),
        dealsCount: client.deals.length,
      };
    });
  }

  static async getClientById(companyId: string, id: string) {
    const client = await prisma.client.findFirst({
      where: { id, companyId },
      include: {
        deals: {
          include: {
            schedules: {
              orderBy: { installmentNumber: 'asc' },
            },
            repayments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) throw new Error('Client not found');

    let totalPrincipal = new Prisma.Decimal(0);
    let totalInterest = new Prisma.Decimal(0);
    let totalRepaid = new Prisma.Decimal(0);
    let outstanding = new Prisma.Decimal(0);
    let overdueAmount = new Prisma.Decimal(0);

    const now = new Date();
    client.deals.forEach((deal) => {
      totalPrincipal = totalPrincipal.plus(deal.financeAmountApproved);
      totalInterest = totalInterest.plus(deal.totalInterest);
      totalRepaid = totalRepaid.plus(deal.totalPrincipalRepaid).plus(deal.totalInterestRepaid);
      outstanding = outstanding.plus(deal.outstandingTotal);

      deal.schedules.forEach((sch) => {
        if (new Date(sch.dueDate) < now && (sch.status === 'DUE' || sch.status === 'OVERDUE' || sch.status === 'PARTIALLY_PAID')) {
          overdueAmount = overdueAmount.plus(sch.balanceAmount);
        }
      });
    });

    return {
      ...client,
      summary: {
        totalFinanceReceived: roundMoney(totalPrincipal).toNumber(),
        totalInterestPayable: roundMoney(totalInterest).toNumber(),
        totalRepaid: roundMoney(totalRepaid).toNumber(),
        outstandingAmount: roundMoney(outstanding).toNumber(),
        overdueAmount: roundMoney(overdueAmount).toNumber(),
      },
    };
  }

  static async createClient(companyId: string, data: any) {
    const count = await prisma.client.count({ where: { companyId } });
    const clientCode = `CLI-${String(count + 1).padStart(4, '0')}`;

    return prisma.client.create({
      data: {
        companyId,
        clientCode,
        fullName: data.fullName,
        businessName: data.businessName || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        pan: data.pan || null,
        gstin: data.gstin || null,
        businessType: data.businessType || null,
        industry: data.industry || null,
        notes: data.notes || null,
      },
    });
  }

  static async updateClient(companyId: string, id: string, data: any) {
    const existing = await prisma.client.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('Client not found');

    return prisma.client.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  static async deleteClient(companyId: string, id: string) {
    const existing = await prisma.client.findFirst({
      where: { id, companyId },
      include: { deals: true, repayments: true },
    });
    if (!existing) throw new Error('Client not found');

    return prisma.$transaction(async (tx) => {
      const dealIds = existing.deals.map((d) => d.id);
      if (dealIds.length > 0) {
        await tx.repaymentAllocation.deleteMany({ where: { schedule: { dealId: { in: dealIds } } } });
        await tx.companyProfit.deleteMany({ where: { distribution: { dealId: { in: dealIds } } } });
        await tx.partnerReturn.deleteMany({ where: { distribution: { dealId: { in: dealIds } } } });
        await tx.investorReturn.deleteMany({ where: { distribution: { dealId: { in: dealIds } } } });
        await tx.distribution.deleteMany({ where: { dealId: { in: dealIds } } });
        await tx.distributionRule.deleteMany({ where: { dealId: { in: dealIds } } });
        await tx.repaymentSchedule.deleteMany({ where: { dealId: { in: dealIds } } });
        await tx.dealFunding.deleteMany({ where: { dealId: { in: dealIds } } });
        await tx.ledgerEntry.deleteMany({ where: { transaction: { dealId: { in: dealIds } } } });
        await tx.transaction.deleteMany({ where: { dealId: { in: dealIds } } });
        await tx.repayment.deleteMany({ where: { clientId: id } });
        await tx.financeDeal.deleteMany({ where: { clientId: id } });
      } else {
        await tx.repayment.deleteMany({ where: { clientId: id } });
      }
      return tx.client.delete({ where: { id } });
    });
  }
}
