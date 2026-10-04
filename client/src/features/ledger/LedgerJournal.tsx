import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Layers, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Double-Entry Financial Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable journal entries, chart of accounts & balanced debit/credit audit trail
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={() => setActiveView('journal')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeView === 'journal'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            General Journal
          </button>
          <button
            onClick={() => setActiveView('accounts')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeView === 'accounts'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chart of Accounts
          </button>
        </div>
      </div>

      {activeView === 'journal' ? (
        <div className="space-y-4">
          {txnsLoading ? (
            <div className="py-12 text-center text-slate-500">Loading journal transactions...</div>
          ) : transactions?.length > 0 ? (
            transactions.map((txn: any) => (
              <div
                key={txn.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {txn.transactionNo}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {txn.transactionType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(txn.transactionDate)}</span>
                </div>

                <p className="text-xs text-slate-300">{txn.description}</p>

                {/* Journal Double-Entry Lines */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Account Code & Title</th>
                        <th className="py-2.5 px-4">Narration</th>
                        <th className="py-2.5 px-4 text-right">Debit (Dr)</th>
                        <th className="py-2.5 px-4 text-right">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
                      {txn.ledgerEntries?.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-4 text-white">
                            <span className="text-emerald-400 font-bold">{entry.account?.accountCode}</span> -{' '}
                            {entry.account?.accountName}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-sans text-[11px]">
                            {entry.narration || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">
                            {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-blue-400 font-bold">
                            {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
              No transactions recorded in journal yet.
            </div>
          )}
        </div>
      ) : (
        /* Chart of Accounts */
        <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Account Code</th>
                <th className="py-3.5 px-5">Account Title</th>
                <th className="py-3.5 px-5">Category / Type</th>
                <th className="py-3.5 px-5 text-right">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {accounts?.map((acc: any) => (
                <tr key={acc.id} className="hover:bg-slate-950/40">
                  <td className="py-4 px-5 font-bold text-emerald-400">{acc.accountCode}</td>
                  <td className="py-4 px-5 font-sans font-bold text-white">{acc.accountName}</td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold">
                      {acc.accountType}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-bold text-white">
                    {formatCurrency(acc.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
