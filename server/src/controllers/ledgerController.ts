import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import prisma from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LedgerController {
  static async listAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const accounts = await prisma.ledgerAccount.findMany({
        where: { companyId },
        orderBy: { accountCode: 'asc' },
      });
      sendSuccess(res, accounts, 'Chart of accounts retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async listJournalTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { deal: { companyId } },
            { repayment: { deal: { companyId } } },
          ],
        },
        include: {
          deal: { select: { dealNumber: true } },
          repayment: { select: { receiptNumber: true } },
          ledgerEntries: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      });
      sendSuccess(res, transactions, 'Journal transactions retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
