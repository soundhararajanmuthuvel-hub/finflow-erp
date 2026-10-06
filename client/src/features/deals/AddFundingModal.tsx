import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, PlusCircle, Building2, User, TrendingUp } from 'lucide-react';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
} from '../../components/common/AccessibleComponents';

interface AddFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  approvedAmount: number;
  currentFundedAmount: number;
}

export const AddFundingModal: React.FC<AddFundingModalProps> = ({
  isOpen,
  onClose,
  dealId,
  approvedAmount,
  currentFundedAmount,
}) => {
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<'COMPANY' | 'PARTNER' | 'OUTSIDE_INVESTOR'>('OUTSIDE_INVESTOR');
  const [partnerId, setPartnerId] = useState('');
  const [investorId, setInvestorId] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('12');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const remainingCap = Math.max(0, approvedAmount - currentFundedAmount);

  const { data: partners } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const res: any = await apiClient.get('/partners');
      return res.data || [];
    },
    enabled: isOpen,
  });

  const { data: investors } = useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const res: any = await apiClient.get('/investors');
      return res.data || [];
    },
    enabled: isOpen,
  });

  const addFundingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post(`/deals/${dealId}/funding`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to add funding participant');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Please enter a valid funding amount');
      return;
    }

    if (numAmount > remainingCap) {
      setErrorMsg(
        `Amount (${formatCurrency(numAmount)}) exceeds remaining unallocated funding capacity of ${formatCurrency(remainingCap)}`
      );
      return;
    }

    if (sourceType === 'PARTNER' && !partnerId) {
      setErrorMsg('Please select a company partner');
      return;
    }

    if (sourceType === 'OUTSIDE_INVESTOR' && !investorId) {
      setErrorMsg('Please select an outside investor');
      return;
    }

    addFundingMutation.mutate({
      sourceType,
      partnerId: sourceType === 'PARTNER' ? partnerId : undefined,
      investorId: sourceType === 'OUTSIDE_INVESTOR' ? investorId : undefined,
      amount: numAmount,
      expectedReturnRate: Number(expectedReturnRate || 0),
      notes,
    });
  };

  const handleClose = () => {
    setAmount('');
    setNotes('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Capital Participant"
      subtitle="Allocate funding tranche from company, partner, or outside investor"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Remaining Capacity Card */}
        <div className="p-5 rounded-2xl bg-[#EFF6FF] border-2 border-[#BFDBFE] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#1E3A8A] block">
              Remaining Unfunded Gap
            </span>
            <p className="text-2xl font-black text-[#1E3A8A] mt-0.5 whitespace-nowrap">
              {formatCurrency(remainingCap)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#52525B] block">
              Deal Approved Total
            </span>
            <p className="text-lg font-bold text-[#1A1A1A] whitespace-nowrap">{formatCurrency(approvedAmount)}</p>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-[#FEE2E2] border-2 border-[#FECACA] text-[#B91C1C] flex items-start gap-3 text-base font-bold"
          >
            <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 stroke-[2.3]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Source Type Radios */}
        <div className="space-y-2">
          <label className="block text-base sm:text-lg font-bold text-[#1A1A1A]">
            Capital Source Category (Required)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'OUTSIDE_INVESTOR', label: 'Outside Investor', icon: TrendingUp },
              { type: 'PARTNER', label: 'Company Partner', icon: User },
              { type: 'COMPANY', label: 'Company Capital', icon: Building2 },
            ].map((st) => (
              <button
                key={st.type}
                type="button"
                onClick={() => setSourceType(st.type as any)}
                className={`h-16 px-4 rounded-xl border-2 font-bold text-base flex items-center justify-center gap-2.5 transition-all ${
                  sourceType === st.type
                    ? 'bg-[#8B1A1A] text-white border-[#8B1A1A] shadow-md'
                    : 'bg-white text-[#1A1A1A] border-[#D6CFC4] hover:border-[#8B1A1A]'
                }`}
              >
                <st.icon className="h-5 w-5 stroke-[2.3]" />
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Participant Selection */}
        {sourceType === 'PARTNER' && (
          <AccessibleSelect
            label="Select Company Partner"
            required
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
          >
            <option value="">-- Choose registered partner --</option>
            {partners?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.partnerCode})
              </option>
            ))}
          </AccessibleSelect>
        )}

        {sourceType === 'OUTSIDE_INVESTOR' && (
          <AccessibleSelect
            label="Select Outside Investor"
            required
            value={investorId}
            onChange={(e) => setInvestorId(e.target.value)}
          >
            <option value="">-- Choose registered investor --</option>
            {investors?.map((inv: any) => (
              <option key={inv.id} value={inv.id}>
                {inv.name} ({inv.investorCode})
              </option>
            ))}
          </AccessibleSelect>
        )}

        {/* Amount & Expected Return Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AccessibleInput
            label="Funding Amount (₹)"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50000"
            max={remainingCap}
          />

          <AccessibleInput
            label="Expected ROI Return Rate (%)"
            type="number"
            value={expectedReturnRate}
            onChange={(e) => setExpectedReturnRate(e.target.value)}
            placeholder="12"
          />
        </div>

        <AccessibleInput
          label="Internal Notes / Covenants"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Committed via Cheque / Bank Transfer"
        />

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t-2 border-[#EDE7DE]">
          <AccessibleButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </AccessibleButton>
          <AccessibleButton
            type="submit"
            variant="primary"
            isLoading={addFundingMutation.isPending}
          >
            Commit Capital
          </AccessibleButton>
        </div>
      </form>
    </Modal>
  );
};
