import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Layers, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';

export const LedgerJournal: React.FC = () => {
  const [activeView, setActiveView] = useState<'journal' | 'accounts'>('journal');

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: async () => {
      const res: any = await apiClient.get('/ledger/accounts');
      return res.data || [];
    },
  });

  const { data: transactions, isLoading: txnsLoading } = useQuery({
    queryKey: ['ledger-transactions'],
    queryFn: async () => {
      const res: any = await apiClient.get('/ledger/journal');
      return res.data || [];
    },
  });

  return (
    <div className="space-y-8">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Double-Entry Financial Ledger
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
            Immutable general journal transactions, balanced debit/credit entries, and chart of accounts
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-[#FAF7F2] border-2 border-[#D6CFC4] rounded-2xl p-1.5 shrink-0">
          <button
            onClick={() => setActiveView('journal')}
            className={`h-12 px-5 text-base font-bold rounded-xl transition-all ${
              activeView === 'journal'
                ? 'bg-[#8B1A1A] text-white shadow-md'
                : 'text-[#1A1A1A] hover:bg-[#EDE7DE]'
            }`}
          >
            General Journal
          </button>
          <button
            onClick={() => setActiveView('accounts')}
            className={`h-12 px-5 text-base font-bold rounded-xl transition-all ${
              activeView === 'accounts'
                ? 'bg-[#8B1A1A] text-white shadow-md'
                : 'text-[#1A1A1A] hover:bg-[#EDE7DE]'
            }`}
          >
            Chart of Accounts
          </button>
        </div>
      </div>

      {activeView === 'journal' ? (
        <div className="space-y-6">
          {txnsLoading ? (
            <div className="p-12 text-center text-lg font-bold text-[#52525B]">
              Loading journal entries...
            </div>
          ) : transactions?.length > 0 ? (
            transactions.map((txn: any) => (
              <AccessibleCard key={txn.id} withTopAccent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#EDE7DE] pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-[#8B1A1A] bg-[#FAF7F2] px-3.5 py-1.5 rounded-xl border border-[#D6CFC4]">
                      {txn.transactionNo}
                    </span>
                    <span className="text-sm font-bold text-[#1F6B3A] bg-[#EAF5EE] px-3 py-1 rounded-lg border border-[#A7D9B7]">
                      {txn.transactionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-base text-[#52525B] font-bold whitespace-nowrap">
                    {formatDate(txn.transactionDate)}
                  </span>
                </div>

                <p className="text-lg font-medium text-[#1A1A1A] leading-relaxed">
                  {txn.description}
                </p>

                {/* Journal Double-Entry Lines Table */}
                <div className="rounded-xl bg-[#FAF7F2] border-2 border-[#D6CFC4] overflow-x-auto">
                  <table className="w-full text-left text-base">
                    <thead className="bg-white text-[#1A1A1A] font-bold border-b-2 border-[#D6CFC4]">
                      <tr>
                        <th className="py-3 px-5">Account Code & Title</th>
                        <th className="py-3 px-5">Narration</th>
                        <th className="py-3 px-5 text-right font-extrabold text-[#1F6B3A]">Debit (Dr)</th>
                        <th className="py-3 px-5 text-right font-extrabold text-[#1E3A8A]">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
                      {txn.ledgerEntries?.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-white transition-colors">
                          <td className="py-3.5 px-5 font-bold">
                            <span className="text-[#8B1A1A] font-mono mr-2">
                              {entry.account?.accountCode}
                            </span>
                            <span>{entry.account?.accountName}</span>
                          </td>
                          <td className="py-3.5 px-5 text-[#52525B] text-sm font-medium">
                            {entry.narration || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right font-extrabold text-lg text-[#1F6B3A]">
                            {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right font-extrabold text-lg text-[#1E3A8A]">
                            {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccessibleCard>
            ))
          ) : (
            <AccessibleEmptyState
              icon={BookOpen}
              title="No ledger entries recorded yet"
              description="Transactions will be automatically posted when deals are disbursed or repayments are recorded."
            />
          )}
        </div>
      ) : (
        /* Chart of Accounts */
        <div className="rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
                <tr>
                  <th className="py-4 px-6 text-base font-bold">Account Code</th>
                  <th className="py-4 px-6 text-base font-bold">Account Title</th>
                  <th className="py-4 px-6 text-base font-bold">Account Category</th>
                  <th className="py-4 px-6 text-base font-bold text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
                {accountsLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-lg font-bold text-[#52525B]">
                      Loading chart of accounts...
                    </td>
                  </tr>
                ) : (
                  accounts?.map((acc: any, index: number) => (
                    <tr
                      key={acc.id}
                      className={`hover:bg-[#FAF7F2] transition-colors ${
                        index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                      }`}
                    >
                      <td className="py-5 px-6 font-mono font-bold text-[#8B1A1A] text-lg whitespace-nowrap">
                        {acc.accountCode}
                      </td>
                      <td className="py-5 px-6 font-bold text-lg text-[#1A1A1A]">
                        {acc.accountName}
                      </td>
                      <td className="py-5 px-6 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#D6CFC4] text-sm font-bold text-[#1A1A1A]">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right font-extrabold text-xl text-[#1A1A1A] whitespace-nowrap">
                        {formatCurrency(acc.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerJournal;
