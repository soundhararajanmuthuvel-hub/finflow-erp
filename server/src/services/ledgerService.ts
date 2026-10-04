import { PrismaClient, Prisma } from '@prisma/client';
import { TransactionType, AccountType } from '../types/enums.js';
import { roundMoney, DecimalValue } from '../utils/decimal.js';

export interface LedgerEntryItem {
  accountCode: string;
  accountName?: string;
  accountType?: AccountType;
  debit: DecimalValue;
  credit: DecimalValue;
  narration?: string;
}

export interface CreateTransactionParams {
  companyId: string;
  dealId?: string;
  repaymentId?: string;
  transactionType: TransactionType;
  amount: DecimalValue;
  transactionDate?: Date;
  description: string;
  referenceNo?: string;
  entries: LedgerEntryItem[];
}

export class LedgerService {
  static async initializeChartOfAccounts(prismaTx: PrismaClient | any, companyId: string) {
    const standardAccounts = [
      { code: '1000', name: 'Cash and Bank Pool', type: AccountType.ASSET },
      { code: '1100', name: 'Client Loans Receivable', type: AccountType.ASSET },
      { code: '2000', name: 'Investor Capital Payable', type: AccountType.LIABILITY },
      { code: '2100', name: 'Investor Returns Payable', type: AccountType.LIABILITY },
      { code: '3000', name: 'Company Capital Pool', type: AccountType.EQUITY },
      { code: '3100', name: 'Partner Capital Accounts', type: AccountType.EQUITY },
      { code: '3200', name: 'Partner Profit Distributions Payable', type: AccountType.LIABILITY },
      { code: '4000', name: 'Finance Interest Revenue', type: AccountType.REVENUE },
      { code: '4100', name: 'Company Management Commission Income', type: AccountType.REVENUE },
      { code: '5000', name: 'General Operating Expenses', type: AccountType.EXPENSE },
    ];

    for (const acc of standardAccounts) {
      const existing = await prismaTx.ledgerAccount.findFirst({
        where: { companyId, accountCode: acc.code },
      });

      if (!existing) {
        await prismaTx.ledgerAccount.create({
          data: {
            companyId,
            accountCode: acc.code,
            accountName: acc.name,
            accountType: acc.type,
            isSystemAccount: true,
          },
        });
      }
    }
  }

  static async recordJournalTransaction(
    prismaTx: PrismaClient | any,
    params: CreateTransactionParams
  ) {
    const { companyId, dealId, repaymentId, transactionType, amount, transactionDate, description, referenceNo, entries } = params;

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const entry of entries) {
      totalDebit = totalDebit.plus(roundMoney(entry.debit));
      totalCredit = totalCredit.plus(roundMoney(entry.credit));
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new Error(
        `Ledger integrity violation: Total Debits (${totalDebit.toFixed(2)}) must equal Total Credits (${totalCredit.toFixed(2)})`
      );
    }

    const transactionNo = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const txn = await prismaTx.transaction.create({
      data: {
        dealId: dealId || null,
        repaymentId: repaymentId || null,
        transactionNo,
        transactionType,
        amount: roundMoney(amount).toString(),
        transactionDate: transactionDate || new Date(),
        description,
        referenceNo: referenceNo || null,
      },
    });

    for (const entry of entries) {
      let account = await prismaTx.ledgerAccount.findFirst({
        where: { companyId, accountCode: entry.accountCode },
      });

      if (!account) {
        account = await prismaTx.ledgerAccount.create({
          data: {
            companyId,
            accountCode: entry.accountCode,
            accountName: entry.accountName || `Account ${entry.accountCode}`,
            accountType: entry.accountType || AccountType.ASSET,
            isSystemAccount: true,
          },
        });
      }

      const decDebit = roundMoney(entry.debit);
      const decCredit = roundMoney(entry.credit);

      await prismaTx.ledgerEntry.create({
        data: {
          transactionId: txn.id,
          accountId: account.id,
          debit: decDebit.toString(),
          credit: decCredit.toString(),
          narration: entry.narration || description,
        },
      });

      const currentBalance = new Prisma.Decimal(account.balance);
      let updatedBalance = currentBalance;

      if (account.accountType === AccountType.ASSET || account.accountType === AccountType.EXPENSE) {
        updatedBalance = updatedBalance.plus(decDebit).minus(decCredit);
      } else {
        updatedBalance = updatedBalance.plus(decCredit).minus(decDebit);
      }

      await prismaTx.ledgerAccount.update({
        where: { id: account.id },
        data: { balance: updatedBalance.toString() },
      });
    }

    return txn;
  }
}
