import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { roundMoney } from '../utils/decimal.js';

export class InvestorService {
  static async listInvestors(companyId: string, search?: string) {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { pan: { contains: search } },
      ];
    }

    const investors = await prisma.investor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        fundings: {
          include: {
            deal: {
              select: {
                id: true,
                dealNumber: true,
                status: true,
                financeAmountApproved: true,
              },
            },
          },
        },
        returns: true,
      },
    });

    return investors.map((investor) => {
      let totalInvested = new Prisma.Decimal(0);
      let principalReturned = new Prisma.Decimal(0);
      let interestEarned = new Prisma.Decimal(0);

      investor.fundings.forEach((f) => {
        totalInvested = totalInvested.plus(f.amount);
      });

      investor.returns.forEach((r) => {
        principalReturned = principalReturned.plus(r.principalReturned);
        interestEarned = interestEarned.plus(r.interestEarned);
      });

      const pendingPrincipal = roundMoney(totalInvested.minus(principalReturned));
      const totalPayout = roundMoney(principalReturned.plus(interestEarned));

      return {
        ...investor,
        totalInvested: roundMoney(totalInvested).toNumber(),
        principalReturned: roundMoney(principalReturned).toNumber(),
        interestEarned: roundMoney(interestEarned).toNumber(),
        totalPayout: totalPayout.toNumber(),
        pendingPrincipal: pendingPrincipal.toNumber(),
        activeDealsCount: investor.fundings.filter((f) => f.deal.status === 'ACTIVE').length,
      };
    });
  }

  static async getInvestorById(companyId: string, id: string) {
    const investor = await prisma.investor.findFirst({
      where: { id, companyId },
      include: {
        fundings: {
          include: {
            deal: {
              include: { client: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        returns: {
          include: {
            distribution: {
              include: {
                deal: true,
                repayment: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!investor) throw new Error('Investor not found');

    let totalInvested = new Prisma.Decimal(0);
    let principalReturned = new Prisma.Decimal(0);
    let interestEarned = new Prisma.Decimal(0);

    investor.fundings.forEach((f) => {
      totalInvested = totalInvested.plus(f.amount);
    });

    investor.returns.forEach((r) => {
      principalReturned = principalReturned.plus(r.principalReturned);
      interestEarned = interestEarned.plus(r.interestEarned);
    });

    const pendingPrincipal = roundMoney(totalInvested.minus(principalReturned));

    return {
      ...investor,
      portfolioSummary: {
        totalInvested: roundMoney(totalInvested).toNumber(),
        principalReturned: roundMoney(principalReturned).toNumber(),
        interestEarned: roundMoney(interestEarned).toNumber(),
        totalPayout: roundMoney(principalReturned.plus(interestEarned)).toNumber(),
        pendingPrincipal: pendingPrincipal.toNumber(),
        activeDealsCount: investor.fundings.filter((f) => f.deal.status === 'ACTIVE').length,
      },
    };
  }

  static async createInvestor(companyId: string, data: any) {
    const count = await prisma.investor.count({ where: { companyId } });
    const investorCode = `INV-${String(count + 1).padStart(4, '0')}`;

    return prisma.investor.create({
      data: {
        companyId,
        investorCode,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        pan: data.pan || null,
        bankName: data.bankName || null,
        bankAccountNo: data.bankAccountNo || null,
        ifscCode: data.ifscCode || null,
        notes: data.notes || null,
      },
    });
  }

  static async updateInvestor(companyId: string, id: string, data: any) {
    const existing = await prisma.investor.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('Investor not found');

    return prisma.investor.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        email: data.email !== undefined ? data.email : existing.email,
        address: data.address !== undefined ? data.address : existing.address,
        pan: data.pan !== undefined ? data.pan : existing.pan,
        bankName: data.bankName !== undefined ? data.bankName : existing.bankName,
        bankAccountNo: data.bankAccountNo !== undefined ? data.bankAccountNo : existing.bankAccountNo,
        ifscCode: data.ifscCode !== undefined ? data.ifscCode : existing.ifscCode,
        status: data.status !== undefined ? data.status : existing.status,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });
  }

  static async deleteInvestor(companyId: string, id: string) {
    const existing = await prisma.investor.findFirst({
      where: { id, companyId },
      include: { fundings: true, returns: true },
    });
    if (!existing) throw new Error('Investor not found');

    return prisma.$transaction(async (tx) => {
      await tx.investorReturn.deleteMany({ where: { investorId: id } });
      await tx.dealFunding.deleteMany({ where: { investorId: id } });
      return tx.investor.delete({ where: { id } });
    });
  }
}
