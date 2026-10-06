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
import { AccessibleButton, AccessibleCard } from '../../components/common/AccessibleComponents';

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
      subtitle="Detailed waterfall distribution breakdown, double-entry ledger & audit trails"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Receipt Header Card */}
        <AccessibleCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50 border-2 border-stone-200">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-mono font-black text-maroon-900 bg-maroon-100 px-3 py-1 rounded-xl border border-maroon-300">
                {repayment.receiptNumber}
              </span>
              <span className="text-sm text-stone-600 font-medium">Deal: <span className="text-stone-900 font-mono font-bold">{deal.dealNumber}</span></span>
            </div>
            <h3 className="text-2xl font-black text-stone-900">{deal.client?.fullName}</h3>
            <p className="text-base text-stone-600 font-medium">
              Payment Method: <span className="text-stone-900 font-bold">{repayment.paymentMethod}</span> • Ref / UTR: <span className="text-stone-900 font-mono font-bold">{repayment.referenceNumber || 'N/A'}</span>
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-stone-500 font-bold uppercase block">Total Amount Received</span>
            <p className="text-3xl font-black text-emerald-900 mt-0.5">
              {formatCurrency(repayment.amountReceived)}
            </p>
            <p className="text-sm text-stone-600 font-medium mt-1 flex sm:justify-end items-center gap-1.5">
              <Calendar className="h-4 w-4 text-stone-500" />
              <span>{formatDate(repayment.paymentDate)}</span>
            </p>
          </div>
        </AccessibleCard>

        {/* Principal vs Interest Allocation Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
              Principal Settled
            </span>
            <p className="text-2xl font-black text-blue-950 mt-1">
              {formatCurrency(repayment.principalPortion)}
            </p>
            <p className="text-sm text-blue-800 font-medium mt-1">Returned directly to syndicate capital providers</p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
              Interest / Profit Collected
            </span>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {formatCurrency(repayment.interestPortion)}
            </p>
            <p className="text-sm text-emerald-800 font-medium mt-1">Distributed via configured deal profit rules</p>
          </div>
        </div>

        {/* Section 1: Waterfall Distribution Snapshot */}
        <AccessibleCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <h4 className="text-base font-extrabold text-stone-900 uppercase tracking-wide">
                Immutable Distribution Snapshot
              </h4>
            </div>
            <span className="text-sm text-stone-500 font-medium">Locked at time of transaction</span>
          </div>

          {/* Company Share */}
          {companyProfit && (
            <div className="p-4 rounded-xl bg-stone-50 border-2 border-stone-200 space-y-3">
              <div className="flex justify-between items-center text-base">
                <span className="font-bold text-stone-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-maroon-800" />
                  Company Allocation
                </span>
                <span className="font-black text-emerald-900 font-mono text-lg">
                  Total Profit: {formatCurrency(companyProfit.totalCompanyProfit)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-2 border-t border-stone-200">
                <div>
                  <span className="text-stone-500 font-medium">Principal Recovered</span>
                  <p className="font-bold text-stone-900 mt-0.5">{formatCurrency(companyProfit.principalRecovered)}</p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Commission (10%)</span>
                  <p className="font-bold text-stone-900 mt-0.5">{formatCurrency(companyProfit.managementCommission)}</p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Retained Margin</span>
                  <p className="font-bold text-emerald-800 mt-0.5">{formatCurrency(companyProfit.retainedInterestMargin)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Outside Investors */}
          {investorReturns.length > 0 && (
            <div className="space-y-3">
              <span className="text-sm font-bold text-purple-900 uppercase tracking-wider block">
                Outside Investor Returns
              </span>
              <div className="space-y-2">
                {investorReturns.map((inv: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 flex justify-between items-center text-base">
                    <div>
                      <p className="font-bold text-purple-950">{inv.investor?.name || `Investor #${idx + 1}`}</p>
                      <p className="text-sm text-stone-600 mt-0.5">
                        Principal Returned: <span className="text-stone-900 font-bold">{formatCurrency(inv.principalReturned)}</span> • Profit ROI: <span className="text-purple-900 font-bold">{formatCurrency(inv.interestEarned)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-500 font-bold uppercase">Total Payout</span>
                      <p className="font-mono font-black text-purple-950 text-lg">{formatCurrency(inv.totalPayout)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partners */}
          {partnerReturns.length > 0 && (
            <div className="space-y-3">
              <span className="text-sm font-bold text-blue-900 uppercase tracking-wider block">
                Partner Distributions
              </span>
              <div className="space-y-2">
                {partnerReturns.map((prt: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200 flex justify-between items-center text-base">
                    <div>
                      <p className="font-bold text-blue-950">{prt.partner?.name || `Partner #${idx + 1}`}</p>
                      <p className="text-sm text-stone-600 mt-0.5">
                        Principal: <span className="text-stone-900 font-bold">{formatCurrency(prt.principalReturned)}</span> • Profit Share: <span className="text-blue-900 font-bold">{formatCurrency(prt.profitShare)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-500 font-bold uppercase">Total Payout</span>
                      <p className="font-mono font-black text-blue-950 text-lg">{formatCurrency(prt.totalPayout)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AccessibleCard>

        {/* Section 2: Double-Entry Ledger Postings */}
        {relatedJournal && relatedJournal.ledgerEntries?.length > 0 && (
          <AccessibleCard className="p-6 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-800" />
                <h4 className="text-base font-extrabold text-stone-900 uppercase tracking-wide">
                  Double-Entry Ledger Journal ({relatedJournal.transactionNo})
                </h4>
              </div>
              <span className="text-sm text-stone-500 font-mono font-bold">{formatDate(relatedJournal.transactionDate)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b-2 border-stone-200 text-sm text-stone-600 font-bold uppercase">
                    <th className="pb-2">Account</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Debit (Dr)</th>
                    <th className="pb-2 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {relatedJournal.ledgerEntries.map((entry: any, i: number) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="py-2.5 font-mono text-stone-900 font-bold">
                        {entry.account?.accountCode} - {entry.account?.accountName}
                      </td>
                      <td className="py-2.5 text-stone-600">{entry.narration}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-800">
                        {Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-blue-900">
                        {Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccessibleCard>
        )}

        {/* Audit Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-base text-stone-600 pt-4 border-t-2 border-stone-200">
          <span>Recorded by: <span className="text-stone-900 font-bold">{repayment.recordedBy?.fullName || 'Finance Staff'}</span></span>
          <div className="flex items-center gap-3">
            <AccessibleButton
              variant="outline"
              onClick={() => window.print()}
              icon={<Printer className="h-5 w-5" />}
            >
              Print Receipt
            </AccessibleButton>
            <AccessibleButton
              variant="primary"
              onClick={onClose}
            >
              Close
            </AccessibleButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};
