import React from 'react';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Receipt,
  Printer,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  History,
  CheckCircle2,
  Building,
} from 'lucide-react';

interface PaymentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  repayment: any | null;
  deal: any;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  isOpen,
  onClose,
  repayment,
  deal,
}) => {
  if (!repayment) return null;

  const distribution = repayment.distributions?.[0] || deal.distributions?.find((d: any) => d.repaymentId === repayment.id);
  const companyProfit = distribution?.companyProfits?.[0];
  const investorReturns = distribution?.investorReturns || [];
  const partnerReturns = distribution?.partnerReturns || [];
  const relatedJournal = deal.transactions?.find((t: any) => t.repaymentId === repayment.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Collection Receipt • ${repayment.receiptNumber}`}
      subtitle={`Detailed waterfall distribution breakdown, double-entry ledger & audit trails`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Receipt Header Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {repayment.receiptNumber}
              </span>
              <span className="text-xs text-slate-400">Deal: <span className="text-white font-mono font-bold">{deal.dealNumber}</span></span>
            </div>
            <h3 className="text-lg font-black text-white">{deal.client?.fullName}</h3>
            <p className="text-xs text-slate-400">
              Payment Method: <span className="text-slate-200 font-semibold">{repayment.paymentMethod}</span> • Ref / UTR: <span className="text-slate-200 font-mono">{repayment.referenceNumber || 'N/A'}</span>
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Amount Received</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              {formatCurrency(repayment.amountReceived)}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex sm:justify-end items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(repayment.paymentDate)}</span>
            </p>
          </div>
        </div>

        {/* Principal vs Interest Allocation Strip */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-800/30">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Principal Settled
            </span>
            <p className="text-xl font-black text-blue-300 mt-1">
              {formatCurrency(repayment.principalPortion)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Returned directly to syndicate capital providers</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Interest / Profit Collected
            </span>
            <p className="text-xl font-black text-emerald-300 mt-1">
              {formatCurrency(repayment.interestPortion)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Distributed via configured deal profit rules</p>
          </div>
        </div>

        {/* Section 1: Waterfall Distribution Snapshot */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Immutable Distribution Snapshot
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Locked at time of transaction</span>
          </div>

          {/* Company Share */}
          {companyProfit && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-emerald-400" />
                  Company Allocation
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  Total Profit: {formatCurrency(companyProfit.totalCompanyProfit)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-900">
                <div>
                  <span className="text-slate-500">Principal Recovered</span>
                  <p className="font-bold text-slate-200 mt-0.5">{formatCurrency(companyProfit.principalRecovered)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Commission (10%)</span>
                  <p className="font-bold text-teal-300 mt-0.5">{formatCurrency(companyProfit.managementCommission)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Retained Margin</span>
                  <p className="font-bold text-emerald-300 mt-0.5">{formatCurrency(companyProfit.retainedInterestMargin)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Outside Investors */}
          {investorReturns.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                Outside Investor Returns
              </span>
              <div className="space-y-1.5">
                {investorReturns.map((inv: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-purple-300">{inv.investor?.name || `Investor #${idx + 1}`}</p>
                      <p className="text-[11px] text-slate-400">
                        Principal Returned: <span className="text-white font-semibold">{formatCurrency(inv.principalReturned)}</span> • Profit ROI: <span className="text-purple-300 font-semibold">{formatCurrency(inv.interestEarned)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Payout</span>
                      <p className="font-mono font-bold text-purple-200">{formatCurrency(inv.totalPayout)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partners */}
          {partnerReturns.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                Partner Distributions
              </span>
              <div className="space-y-1.5">
                {partnerReturns.map((prt: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-cyan-300">{prt.partner?.name || `Partner #${idx + 1}`}</p>
                      <p className="text-[11px] text-slate-400">
                        Principal: <span className="text-white font-semibold">{formatCurrency(prt.principalReturned)}</span> • Profit Share: <span className="text-cyan-300 font-semibold">{formatCurrency(prt.profitShare)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Payout</span>
                      <p className="font-mono font-bold text-cyan-200">{formatCurrency(prt.totalPayout)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Double-Entry Ledger Postings */}
        {relatedJournal && relatedJournal.ledgerEntries?.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Double-Entry Ledger Journal ({relatedJournal.transactionNo})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{formatDate(relatedJournal.transactionDate)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                    <th className="pb-2">Account</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Debit (Dr)</th>
                    <th className="pb-2 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {relatedJournal.ledgerEntries.map((entry: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2 font-mono text-slate-300 font-semibold">
                        {entry.account?.accountCode} - {entry.account?.accountName}
                      </td>
                      <td className="py-2 text-slate-400">{entry.narration}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-400">
                        {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-blue-400">
                        {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
          <span>Recorded by: <span className="text-slate-300 font-medium">{repayment.recordedBy?.fullName || 'Finance Staff'}</span></span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
