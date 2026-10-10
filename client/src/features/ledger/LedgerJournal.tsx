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
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Double-Entry Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Immutable general journal transactions, balanced debit/credit entries, and chart of accounts
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 border border-slate-200/80 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveView('journal')}
            className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'journal'
                ? 'bg-[#8B1A1A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            General Journal
          </button>
          <button
            onClick={() => setActiveView('accounts')}
            className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'accounts'
                ? 'bg-[#8B1A1A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            Chart of Accounts
          </button>
        </div>
      </div>

      {activeView === 'journal' ? (
        <div className="space-y-4">
          {txnsLoading ? (
            <div className="p-12 text-center text-sm font-medium text-slate-500">
              Loading journal entries...
            </div>
          ) : transactions?.length > 0 ? (
            transactions.map((txn: any) => (
              <AccessibleCard key={txn.id} withTopAccent className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#8B1A1A] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {txn.transactionNo}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {txn.transactionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">
                    {formatDate(txn.transactionDate)}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {txn.description}
                </p>

                {/* Journal Double-Entry Lines Table */}
                <div className="rounded-xl bg-slate-50/70 border border-slate-200/80 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/90 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Account Code & Title</th>
                        <th className="py-2.5 px-4 font-semibold">Narration</th>
                        <th className="py-2.5 px-4 text-right font-bold text-emerald-700">Debit (Dr)</th>
                        <th className="py-2.5 px-4 text-right font-bold text-blue-700">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {txn.ledgerEntries?.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-white/80 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-sm">
                            <span className="text-[#8B1A1A] font-mono mr-2">
                              {entry.account?.accountCode}
                            </span>
                            <span className="text-slate-900">{entry.account?.accountName}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 text-xs sm:text-sm">
                            {entry.narration || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-sm text-emerald-700 whitespace-nowrap">
                            {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-sm text-blue-700 whitespace-nowrap">
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
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Account Code</th>
                  <th className="py-3 px-5">Account Title</th>
                  <th className="py-3 px-5">Account Category</th>
                  <th className="py-3 px-5 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {accountsLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-500">
                      Loading chart of accounts...
                    </td>
                  </tr>
                ) : (
                  accounts?.map((acc: any) => (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50/80 transition-colors bg-white"
                    >
                      <td className="py-3.5 px-5 font-mono font-semibold text-[#8B1A1A] text-sm whitespace-nowrap">
                        {acc.accountCode}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-sm text-slate-900">
                        {acc.accountName}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-sm text-slate-900 whitespace-nowrap">
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
