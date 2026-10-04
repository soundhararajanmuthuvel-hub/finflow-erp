import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Building,
  DollarSign,
  TrendingUp,
  Percent,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface RecordRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDealId?: string;
  onSuccessCallback?: () => void;
}

export const RecordRepaymentModal: React.FC<RecordRepaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedDealId,
  onSuccessCallback,
}) => {
  const queryClient = useQueryClient();
  const [dealId, setDealId] = useState(preselectedDealId || '');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedDealId) {
      setDealId(preselectedDealId);
    }
  }, [preselectedDealId, isOpen]);

  const { data: dealsData } = useQuery({
    queryKey: ['active-deals-repayment'],
    queryFn: async () => {
      const res: any = await apiClient.get('/deals?status=ACTIVE');
      return res.data || [];
    },
    enabled: isOpen,
  });

  const selectedDeal = dealsData?.find((d: any) => d.id === (dealId || preselectedDealId));

  // Auto-fill suggested installment amount when deal selected
  useEffect(() => {
    if (selectedDeal && !amountReceived) {
      setAmountReceived(String(Number(selectedDeal.installmentAmount || 0)));
    }
  }, [selectedDeal]);

  // Debounced preview calculation from backend
  useEffect(() => {
    const activeDealId = dealId || preselectedDealId;
    const numAmount = Number(amountReceived);

    if (!activeDealId || !numAmount || numAmount <= 0) {
      setPreviewData(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsPreviewLoading(true);
        setErrorMsg(null);
        const res: any = await apiClient.post('/repayments/preview', {
          dealId: activeDealId,
          amountReceived: numAmount,
        });
        setPreviewData(res.data);
      } catch (err: any) {
        setPreviewData(null);
        setErrorMsg(err.message || 'Error generating distribution preview');
      } finally {
        setIsPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [dealId, preselectedDealId, amountReceived]);

  const repaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/repayments', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['deal'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['active-deals'] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to record repayment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    const effectiveDealId = dealId || preselectedDealId;
    if (!effectiveDealId) {
      setErrorMsg('Please select a finance deal');
      return;
    }

    if (!amountReceived || Number(amountReceived) <= 0) {
      setErrorMsg('Please enter a valid repayment amount');
      return;
    }

    repaymentMutation.mutate({
      dealId: effectiveDealId,
      amountReceived: Number(amountReceived),
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    });
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg(null);
    setPreviewData(null);
    setAmountReceived('');
    setReferenceNumber('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Record Client Repayment"
      subtitle="Periodic collection tracking & automated syndicate waterfall distribution"
      maxWidth="4xl"
    >
      {result ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-400">Repayment & Distribution Snapshot Created!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Receipt Number: <span className="font-mono font-bold text-white">{result.repayment?.receiptNumber}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Amount Collected: <span className="font-bold text-emerald-400">{formatCurrency(result.repayment?.amountReceived)}</span> • Principal: <span className="text-white font-bold">{formatCurrency(result.repayment?.principalPortion)}</span> • Interest: <span className="text-emerald-400 font-bold">{formatCurrency(result.repayment?.interestPortion)}</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Settled Waterfall Payouts
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500">Company Principal</p>
                <p className="font-bold text-white mt-1">
                  {formatCurrency(result.distributionResult?.companyProfit?.principalRecovered)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500">Company Commission</p>
                <p className="font-bold text-teal-400 mt-1">
                  {formatCurrency(result.distributionResult?.companyProfit?.managementCommission)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500">Company Net Profit</p>
                <p className="font-bold text-emerald-400 mt-1">
                  {formatCurrency(result.distributionResult?.companyProfit?.totalCompanyProfit)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500">Outstanding Total</p>
                <p className="font-bold text-amber-400 mt-1">
                  {formatCurrency(result.dealUpdated?.outstandingTotal)}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Close & View Deal
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Deal Selector */}
          {!preselectedDealId && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Finance Deal
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select a finance deal...</option>
                {dealsData?.map((deal: any) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.dealNumber} - {deal.client?.fullName} (Outstanding: {formatCurrency(deal.outstandingTotal)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collection Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="e.g. 11000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Collection Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash Collection</option>
                <option value="CHEQUE">Cheque Deposit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reference / UTR Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Week 3 payment received on time"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* WATERFALL ALLOCATION PREVIEW (BEFORE SAVING) */}
          {/* ========================================================================= */}
          {previewData && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Live Waterfall Distribution Preview
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Exact Calculation • Review Before Confirming
                </span>
              </div>

              {/* Allocation Top Row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Received</span>
                  <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(previewData.amountReceived)}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase">Principal Settlement</span>
                  <p className="text-sm font-bold text-blue-300 mt-0.5">{formatCurrency(previewData.principalPortion)}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">Interest / Profit</span>
                  <p className="text-sm font-bold text-emerald-300 mt-0.5">{formatCurrency(previewData.interestPortion)}</p>
                </div>
              </div>

              {/* Visual Waterfall Flow */}
              <div className="space-y-3 pt-1">
                {/* 1. Principal Returns */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      1. Principal Capital Returned (Pro-Rata to Syndicate)
                    </span>
                    <span className="text-white font-mono">{formatCurrency(previewData.principalPortion)}</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60">
                      <span className="text-slate-300">
                        Company Capital ({previewData.waterfall?.companyCapital?.sharePercentage}%)
                      </span>
                      <span className="font-bold text-white font-mono">
                        {formatCurrency(previewData.waterfall?.companyCapital?.principalRecovered)}
                      </span>
                    </div>
                    {previewData.waterfall?.investorReturns?.map((inv: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60">
                        <span className="text-purple-300">
                          {inv.investorName} ({inv.sharePercentage}%)
                        </span>
                        <span className="font-bold text-purple-200 font-mono">
                          {formatCurrency(inv.principalReturned)}
                        </span>
                      </div>
                    ))}
                    {previewData.waterfall?.partnerReturns?.map((prt: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60">
                        <span className="text-cyan-300">
                          {prt.partnerName} ({prt.sharePercentage}%)
                        </span>
                        <span className="font-bold text-cyan-200 font-mono">
                          {formatCurrency(prt.principalReturned)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Profit & Interest Split */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" />
                      2. Interest / Profit Distribution Rules
                    </span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(previewData.interestPortion)}</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {previewData.waterfall?.investorReturns?.map((inv: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60">
                        <span className="text-purple-300">
                          {inv.investorName} Return (Interest)
                        </span>
                        <span className="font-bold text-purple-200 font-mono">
                          {formatCurrency(inv.interestEarned)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60">
                      <span className="text-teal-300">Company Management Commission</span>
                      <span className="font-bold text-teal-200 font-mono">
                        {formatCurrency(previewData.waterfall?.companyCapital?.managementCommission)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60">
                      <span className="text-emerald-300 font-semibold">Company Capital Profit (Margin)</span>
                      <span className="font-bold text-emerald-200 font-mono">
                        {formatCurrency(previewData.waterfall?.companyCapital?.retainedInterestMargin)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-emerald-400 font-bold">Total Company Net Profit</span>
                      <span className="font-black text-emerald-300 font-mono">
                        {formatCurrency(previewData.waterfall?.companyCapital?.totalCompanyProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={repaymentMutation.isPending || isPreviewLoading || !previewData}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            >
              {repaymentMutation.isPending ? 'Executing Waterfall...' : 'Confirm & Record Collection'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
