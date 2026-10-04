import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, PlusCircle } from 'lucide-react';

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
        `Amount (₹${numAmount}) exceeds remaining unallocated funding capacity of ₹${remainingCap}`
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
    setErrorMsg(null);
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Funding Participant"
      subtitle={`Approved Deal: ${formatCurrency(approvedAmount)} • Remaining unallocated: ${formatCurrency(remainingCap)}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Participant Funding Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'COMPANY', label: 'Company Capital' },
              { id: 'PARTNER', label: 'Company Partner' },
              { id: 'OUTSIDE_INVESTOR', label: 'Outside Investor' },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSourceType(t.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  sourceType === t.id
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {sourceType === 'PARTNER' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Partner
            </label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">Select a partner...</option>
              {partners?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partnerCode})
                </option>
              ))}
            </select>
          </div>
        )}

        {sourceType === 'OUTSIDE_INVESTOR' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Outside Investor
            </label>
            <select
              value={investorId}
              onChange={(e) => setInvestorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">Select an investor...</option>
              {investors?.map((inv: any) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.investorCode})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Funding Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Expected Return Rate (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              value={expectedReturnRate}
              onChange={(e) => setExpectedReturnRate(e.target.value)}
              placeholder="e.g. 12"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Notes / Syndication Terms
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Committed capital for 10-week cycle"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={addFundingMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 disabled:opacity-50"
          >
            {addFundingMutation.isPending ? 'Allocating...' : 'Add Funding Participant'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
