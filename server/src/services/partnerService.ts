import prisma from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { roundMoney } from '../utils/decimal.js';

export class PartnerService {
  static async listPartners(companyId: string) {
    const partners = await prisma.partner.findMany({
      where: { companyId },
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
        partnerReturns: true,
      },
    });

    return partners.map((partner) => {
      let totalInvested = new Prisma.Decimal(0);
      let principalReturned = new Prisma.Decimal(0);
      let profitEarned = new Prisma.Decimal(0);

      partner.fundings.forEach((f) => {
        totalInvested = totalInvested.plus(f.amount);
      });

      partner.partnerReturns.forEach((r) => {
        principalReturned = principalReturned.plus(r.principalReturned);
        profitEarned = profitEarned.plus(r.profitShare);
      });

      const pendingPrincipal = roundMoney(totalInvested.minus(principalReturned));

      return {
        ...partner,
        totalInvested: roundMoney(totalInvested).toNumber(),
        principalReturned: roundMoney(principalReturned).toNumber(),
        profitEarned: roundMoney(profitEarned).toNumber(),
        pendingPrincipal: pendingPrincipal.toNumber(),
        activeDealsCount: partner.fundings.filter((f) => f.deal.status === 'ACTIVE').length,
      };
    });
  }

  static async getPartnerById(companyId: string, id: string) {
    const partner = await prisma.partner.findFirst({
      where: { id, companyId },
      include: {
        fundings: {
          include: {
            deal: {
              include: { client: true },
            },
          },
        },
        partnerReturns: {
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

    if (!partner) throw new Error('Partner not found');
    return partner;
  }

  static async createPartner(companyId: string, data: any) {
    const count = await prisma.partner.count({ where: { companyId } });
    const partnerCode = `PRT-${String(count + 1).padStart(4, '0')}`;

    return prisma.partner.create({
      data: {
        companyId,
        partnerCode,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        pan: data.pan || null,
        capitalContribution: data.capitalContribution ? new Prisma.Decimal(data.capitalContribution).toString() : '0.00',
        sharePercentage: data.sharePercentage ? new Prisma.Decimal(data.sharePercentage).toString() : '0.00',
        notes: data.notes || null,
      },
    });
  }

  static async updatePartner(companyId: string, id: string, data: any) {
    const existing = await prisma.partner.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('Partner not found');

    return prisma.partner.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        email: data.email !== undefined ? data.email : existing.email,
        address: data.address !== undefined ? data.address : existing.address,
        pan: data.pan !== undefined ? data.pan : existing.pan,
        capitalContribution: data.capitalContribution !== undefined ? new Prisma.Decimal(data.capitalContribution).toString() : existing.capitalContribution,
        sharePercentage: data.sharePercentage !== undefined ? new Prisma.Decimal(data.sharePercentage).toString() : existing.sharePercentage,
        status: data.status !== undefined ? data.status : existing.status,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });
  }

  static async deletePartner(companyId: string, id: string) {
    const existing = await prisma.partner.findFirst({
      where: { id, companyId },
      include: { fundings: true, partnerReturns: true },
    });
    if (!existing) throw new Error('Partner not found');

    return prisma.$transaction(async (tx) => {
      await tx.partnerReturn.deleteMany({ where: { partnerId: id } });
      await tx.dealFunding.deleteMany({ where: { partnerId: id } });
      return tx.partner.delete({ where: { id } });
    });
  }
}
