import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Receipt,
  User,
  Calendar,
} from 'lucide-react';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
} from '../../components/common/AccessibleComponents';

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
          <div className="p-6 rounded-2xl bg-[#EAF5EE] border-2 border-[#A7D9B7] flex items-start gap-4">
            <CheckCircle2 className="h-8 w-8 text-[#1F6B3A] shrink-0 mt-0.5 stroke-[2.3]" />
            <div>
              <h4 className="text-xl font-extrabold text-[#1F6B3A]">
                Repayment & Distribution Snapshot Created!
              </h4>
              <p className="text-base text-[#1A1A1A] font-semibold mt-1">
                Receipt Number: <span className="font-mono font-bold text-[#8B1A1A]">{result.repayment?.receiptNumber}</span>
              </p>
              <p className="text-base text-[#52525B] mt-1">
                Amount Collected: <span className="font-extrabold text-[#1F6B3A]">{formatCurrency(result.repayment?.amountReceived)}</span> • Principal: <span className="text-[#1A1A1A] font-bold">{formatCurrency(result.repayment?.principalPortion)}</span> • Interest: <span className="text-[#1F6B3A] font-bold">{formatCurrency(result.repayment?.interestPortion)}</span>
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF7F2] border-2 border-[#D6CFC4] space-y-4">
            <h5 className="text-base font-bold text-[#1A1A1A] uppercase tracking-wider">
              Settled Waterfall Payouts
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-base">
              <div className="p-4 rounded-xl bg-white border-2 border-[#D6CFC4]">
                <p className="text-xs font-bold text-[#52525B] uppercase">Company Principal</p>
                <p className="font-extrabold text-[#1A1A1A] text-lg mt-1">
                  {formatCurrency(result.distributionResult?.companyProfit?.principalRecovered)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border-2 border-[#D6CFC4]">
                <p className="text-xs font-bold text-[#52525B] uppercase">Company Commission</p>
                <p className="font-extrabold text-[#1E3A8A] text-lg mt-1">
                  {formatCurrency(result.distributionResult?.companyProfit?.managementCommission)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#EAF5EE] border-2 border-[#A7D9B7]">
                <p className="text-xs font-bold text-[#1F6B3A] uppercase">Company Net Profit</p>
                <p className="font-extrabold text-[#1F6B3A] text-lg mt-1">
                  {formatCurrency(result.distributionResult?.companyProfit?.totalCompanyProfit)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FEF3C7] border-2 border-[#FDE68A]">
                <p className="text-xs font-bold text-[#B45309] uppercase">Outstanding Remaining</p>
                <p className="font-extrabold text-[#B45309] text-lg mt-1">
                  {formatCurrency(result.dealUpdated?.outstandingTotal)}
                </p>
              </div>
            </div>
          </div>

          <AccessibleButton
            variant="primary"
            size="large"
            onClick={handleReset}
            className="w-full"
          >
            Close & View Deal
          </AccessibleButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-[#FEE2E2] border-2 border-[#FECACA] flex items-start gap-3 text-[#B91C1C] text-base font-bold"
            >
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 stroke-[2.3]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Deal Selector */}
          {!preselectedDealId && (
            <AccessibleSelect
              label="Select Finance Deal"
              required
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
            >
              <option value="">-- Choose active client finance deal --</option>
              {dealsData?.map((deal: any) => (
                <option key={deal.id} value={deal.id}>
                  {deal.dealNumber} - {deal.client?.fullName} (Outstanding: {formatCurrency(deal.outstandingTotal)})
                </option>
              ))}
            </AccessibleSelect>
          )}

          {/* Collection Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <AccessibleInput
              label="Amount Received (₹)"
              type="number"
              step="0.01"
              required
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="e.g. 10000"
            />

            <AccessibleInput
              label="Collection Date"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />

            <AccessibleSelect
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/IMPS)' },
                { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                { value: 'CASH', label: 'Cash Collection' },
                { value: 'CHEQUE', label: 'Cheque Deposit' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Reference / UTR Number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR9876543210"
            />

            <AccessibleInput
              label="Collection Remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekly installment received on time"
            />
          </div>

          {/* WATERFALL ALLOCATION PREVIEW */}
          {previewData && (
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border-2 border-[#A7D9B7] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#D6CFC4] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#1F6B3A] stroke-[2.3]" />
                  <h4 className="text-base font-extrabold text-[#1A1A1A] uppercase tracking-wider">
                    Waterfall Distribution Preview
                  </h4>
                </div>
                <span className="text-xs font-bold text-[#1F6B3A] bg-[#EAF5EE] px-3 py-1 rounded-full border border-[#A7D9B7]">
                  Exact Calculations Verified
                </span>
              </div>

              {/* Allocation Top Row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white border-2 border-[#D6CFC4]">
                  <span className="text-xs text-[#52525B] font-bold uppercase">Total Received</span>
                  <p className="text-xl font-extrabold text-[#1A1A1A] mt-1">
                    {formatCurrency(previewData.amountReceived)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#EFF6FF] border-2 border-[#BFDBFE]">
                  <span className="text-xs text-[#1E3A8A] font-bold uppercase">Principal Portion</span>
                  <p className="text-xl font-extrabold text-[#1E3A8A] mt-1">
                    {formatCurrency(previewData.principalPortion)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#EAF5EE] border-2 border-[#A7D9B7]">
                  <span className="text-xs text-[#1F6B3A] font-bold uppercase">Interest / Finance Charge</span>
                  <p className="text-xl font-extrabold text-[#1F6B3A] mt-1">
                    {formatCurrency(previewData.interestPortion)}
                  </p>
                </div>
              </div>

              {/* Visual Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-white border-2 border-[#D6CFC4] space-y-2">
                  <div className="flex items-center justify-between text-base font-bold text-[#1A1A1A]">
                    <span className="flex items-center gap-2 text-[#1E3A8A]">
                      <ShieldCheck className="h-5 w-5" />
                      1. Principal Recovery Breakdown
                    </span>
                    <span className="font-mono">{formatCurrency(previewData.principalPortion)}</span>
                  </div>
                  <div className="space-y-1.5 text-base pt-1">
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#EDE7DE]">
                      <span>Company Capital ({previewData.waterfall?.companyCapital?.sharePercentage}%)</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(previewData.waterfall?.companyCapital?.principalRecovered)}
                      </span>
                    </div>
                    {previewData.waterfall?.investorReturns?.map((inv: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#EDE7DE]">
                        <span className="text-[#6B21A8]">{inv.investorName} ({inv.sharePercentage}%)</span>
                        <span className="font-bold font-mono text-[#6B21A8]">
                          {formatCurrency(inv.principalReturned)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border-2 border-[#D6CFC4] space-y-2">
                  <div className="flex items-center justify-between text-base font-bold text-[#1A1A1A]">
                    <span className="flex items-center gap-2 text-[#1F6B3A]">
                      <TrendingUp className="h-5 w-5" />
                      2. Profit & Interest Distribution
                    </span>
                    <span className="font-mono text-[#1F6B3A]">{formatCurrency(previewData.interestPortion)}</span>
                  </div>
                  <div className="space-y-1.5 text-base pt-1">
                    {previewData.waterfall?.investorReturns?.map((inv: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#EDE7DE]">
                        <span className="text-[#6B21A8]">{inv.investorName} ROI (Interest)</span>
                        <span className="font-bold font-mono text-[#6B21A8]">
                          {formatCurrency(inv.interestEarned)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#EDE7DE]">
                      <span>Company Management Commission</span>
                      <span className="font-bold font-mono text-[#1E3A8A]">
                        {formatCurrency(previewData.waterfall?.companyCapital?.managementCommission)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#EAF5EE] border border-[#A7D9B7]">
                      <span className="font-bold text-[#1F6B3A]">Total Company Net Profit</span>
                      <span className="font-extrabold font-mono text-[#1F6B3A]">
                        {formatCurrency(previewData.waterfall?.companyCapital?.totalCompanyProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t-2 border-[#EDE7DE]">
            <AccessibleButton type="button" variant="outline" onClick={handleReset}>
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type="submit"
              variant="primary"
              disabled={repaymentMutation.isPending || isPreviewLoading || !previewData}
              isLoading={repaymentMutation.isPending}
            >
              Confirm & Record Repayment
            </AccessibleButton>
          </div>
        </form>
      )}
    </Modal>
  );
};
