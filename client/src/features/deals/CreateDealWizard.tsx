import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck,
  Calendar,
  Users,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CreateDealWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [financeAmountRequired, setFinanceAmountRequired] = useState('100000');
  const [financeAmountApproved, setFinanceAmountApproved] = useState('100000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [interestType, setInterestType] = useState('FLAT');
  const [interestRate, setInterestRate] = useState('18.00');
  const [repaymentFrequency, setRepaymentFrequency] = useState('MONTHLY');
  const [numberOfRepayments, setNumberOfRepayments] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Funding allocations
  const [fundings, setFundings] = useState<Array<{
    sourceType: 'COMPANY' | 'PARTNER' | 'OUTSIDE_INVESTOR';
    partnerId?: string;
    investorId?: string;
    amount: number;
    expectedReturnRate: number;
  }>>([
    { sourceType: 'COMPANY', amount: 50000, expectedReturnRate: 0 },
  ]);

  // Distribution Rule
  const [distributionRule, setDistributionRule] = useState({
    companyCommissionRate: 10,
    outsideInvestorReturnRate: 15,
    partnerProfitShareRate: 50,
    ruleDescription: 'Standard Commission & Profit Split',
  });

  // Schedule Preview State
  const [schedulePreview, setSchedulePreview] = useState<any | null>(null);

  // Fetch clients, partners, investors
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res: any = await apiClient.get('/clients');
      return res.data || [];
    },
  });

  const { data: partnersData } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const res: any = await apiClient.get('/partners');
      return res.data || [];
    },
  });

  const { data: investorsData } = useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const res: any = await apiClient.get('/investors');
      return res.data || [];
    },
  });

  const totalFundedAmount = fundings.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const approvedAmountNum = Number(financeAmountApproved) || 0;
  const fundingDifference = approvedAmountNum - totalFundedAmount;
  const isFundingValid = Math.abs(fundingDifference) < 0.01;

  const previewMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/deals/preview-schedule', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSchedulePreview(data);
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/deals', payload);
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/deals/${data.id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create finance deal');
    },
  });

  const handleFetchPreview = () => {
    previewMutation.mutate({
      financeAmount: approvedAmountNum,
      interestRate: Number(interestRate),
      interestType,
      frequency: repaymentFrequency,
      numberOfRepayments: Number(numberOfRepayments),
      startDate,
    });
  };

  const handleAddFundingItem = (type: 'COMPANY' | 'PARTNER' | 'OUTSIDE_INVESTOR') => {
    setFundings([
      ...fundings,
      {
        sourceType: type,
        partnerId: type === 'PARTNER' ? partnersData?.[0]?.id : undefined,
        investorId: type === 'OUTSIDE_INVESTOR' ? investorsData?.[0]?.id : undefined,
        amount: Math.max(0, fundingDifference),
        expectedReturnRate: type === 'OUTSIDE_INVESTOR' ? 15 : 0,
      },
    ]);
  };

  const handleRemoveFundingItem = (index: number) => {
    setFundings(fundings.filter((_, idx) => idx !== index));
  };

  const handleUpdateFunding = (index: number, key: string, value: any) => {
    const updated = [...fundings];
    (updated[index] as any)[key] = value;
    setFundings(updated);
  };

  const handleSubmitDeal = () => {
    setErrorMsg(null);
    if (!clientId) {
      setErrorMsg('Please select a client');
      return;
    }
    if (!isFundingValid) {
      setErrorMsg(`Funding total must equal approved amount. Difference: ${formatCurrency(fundingDifference)}`);
      return;
    }

    createDealMutation.mutate({
      clientId,
      financeAmountRequired: Number(financeAmountRequired),
      financeAmountApproved: approvedAmountNum,
      startDate,
      interestType,
      interestRate: Number(interestRate),
      repaymentFrequency,
      numberOfRepayments: Number(numberOfRepayments),
      purpose,
      notes,
      fundings,
      distributionRule,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Create Finance Deal</h1>
        <p className="text-xs text-slate-400 mt-1">
          Multi-party capital syndication, outside investor allocation & automated schedule generation
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        {[
          { num: 1, label: 'Client & Terms' },
          { num: 2, label: 'Syndicate Funding' },
          { num: 3, label: 'Profit Rules' },
          { num: 4, label: 'Schedule & Submit' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-emerald-500 text-white shadow-glow'
                  : step > s.num
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-white' : 'text-slate-500'}`}>
              {s.label}
            </span>
            {s.num < 4 && <ChevronRight className="h-4 w-4 text-slate-700 hidden sm:inline" />}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Client & Finance Terms */}
      {step === 1 && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white">Step 1: Client & Finance Terms</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Choose a client...</option>
              {clientsData?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.businessName || 'Individual'}) - {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Finance Amount Required (₹)
              </label>
              <input
                type="number"
                value={financeAmountRequired}
                onChange={(e) => setFinanceAmountRequired(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Finance Amount Approved (₹) *
              </label>
              <input
                type="number"
                value={financeAmountApproved}
                onChange={(e) => setFinanceAmountApproved(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Interest Calculation Type
              </label>
              <select
                value={interestType}
                onChange={(e) => setInterestType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FLAT">Flat Interest</option>
                <option value="FIXED_WEEKLY">Fixed Weekly Payment</option>
                <option value="FIXED_MONTHLY">Fixed Monthly Payment</option>
                <option value="PRINCIPAL_PLUS_INTEREST">Principal + Interest</option>
                <option value="REDUCING_BALANCE">Reducing Balance (EMI)</option>
                <option value="CUSTOM">Custom Schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Repayment Frequency
              </label>
              <select
                value={repaymentFrequency}
                onChange={(e) => setRepaymentFrequency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="DAILY">Daily</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Number of Repayments / Installments
              </label>
              <input
                type="number"
                value={numberOfRepayments}
                onChange={(e) => setNumberOfRepayments(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Disbursement / Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Finance Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Working capital, expansion, equipment purchase..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (!clientId) {
                  setErrorMsg('Please select a client');
                  return;
                }
                setErrorMsg(null);
                setStep(2);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow"
            >
              <span>Next: Syndicate Funding</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Multi-Party Syndicate Funding */}
      {step === 2 && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Step 2: Syndicate Funding Allocation</h3>
              <p className="text-xs text-slate-400">
                Split funding across Company Capital, Internal Partners, and Outside Investors
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Approved Target:</span>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(approvedAmountNum)}</p>
            </div>
          </div>

          {/* Funding Status Indicator */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
              isFundingValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div>
              <span className="font-bold">Total Allocated: {formatCurrency(totalFundedAmount)}</span>
              <p className="text-[11px] opacity-80">
                {isFundingValid
                  ? 'Funding matches 100% of approved finance amount'
                  : `Remaining to allocate: ${formatCurrency(fundingDifference)}`}
              </p>
            </div>
            {!isFundingValid && <ShieldAlert className="h-5 w-5 text-amber-400" />}
          </div>

          {/* Funding Rows */}
          <div className="space-y-4">
            {fundings.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {item.sourceType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {fundings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFundingItem(idx)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Funding Source
                    </label>
                    <select
                      value={item.sourceType}
                      onChange={(e) => handleUpdateFunding(idx, 'sourceType', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="COMPANY">Company Own Capital</option>
                      <option value="PARTNER">Partner Capital</option>
                      <option value="OUTSIDE_INVESTOR">Outside Investor</option>
                    </select>
                  </div>

                  {item.sourceType === 'PARTNER' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Select Partner
                      </label>
                      <select
                        value={item.partnerId || ''}
                        onChange={(e) => handleUpdateFunding(idx, 'partnerId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {partnersData?.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {item.sourceType === 'OUTSIDE_INVESTOR' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Select Investor
                      </label>
                      <select
                        value={item.investorId || ''}
                        onChange={(e) => handleUpdateFunding(idx, 'investorId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {investorsData?.map((inv: any) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Funding Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleUpdateFunding(idx, 'amount', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Funding Source Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleAddFundingItem('COMPANY')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>+ Company Capital</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddFundingItem('PARTNER')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-blue-400" />
              <span>+ Partner Capital</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddFundingItem('OUTSIDE_INVESTOR')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-purple-400" />
              <span>+ Outside Investor</span>
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={!isFundingValid}
              onClick={() => {
                setErrorMsg(null);
                setStep(3);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow disabled:opacity-50"
            >
              <span>Next: Profit Rules</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Profit & Commission Rules */}
      {step === 3 && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white">Step 3: Profit & Commission Rules</h3>
          <p className="text-xs text-slate-400">
            Configure how collected repayment interest is distributed between Outside Investors, Company Commission, and Partners
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                Company Management Commission (%)
              </label>
              <input
                type="number"
                value={distributionRule.companyCommissionRate}
                onChange={(e) =>
                  setDistributionRule({ ...distributionRule, companyCommissionRate: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Company collection & admin fee on interest</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1.5">
                Investor Return Target (%)
              </label>
              <input
                type="number"
                value={distributionRule.outsideInvestorReturnRate}
                onChange={(e) =>
                  setDistributionRule({ ...distributionRule, outsideInvestorReturnRate: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Contracted ROI for external investors</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
                Partner Profit Share (%)
              </label>
              <input
                type="number"
                value={distributionRule.partnerProfitShareRate}
                onChange={(e) =>
                  setDistributionRule({ ...distributionRule, partnerProfitShareRate: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Share allocated to partner equity pool</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleFetchPreview();
                setStep(4);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow"
            >
              <span>Next: Preview Schedule</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Schedule Preview & Submit */}
      {step === 4 && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white">Step 4: Preview Repayment Schedule & Submit</h3>

          {schedulePreview ? (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase">Approved Amount</span>
                  <p className="text-base font-bold text-white mt-1">
                    {formatCurrency(schedulePreview.totals.principal)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase">Total Interest</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {formatCurrency(schedulePreview.totals.totalInterest)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase">Total Payable</span>
                  <p className="text-base font-bold text-blue-400 mt-1">
                    {formatCurrency(schedulePreview.totals.totalPayable)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase">Installment Due</span>
                  <p className="text-base font-bold text-teal-400 mt-1">
                    {formatCurrency(schedulePreview.totals.installmentAmount)}
                  </p>
                </div>
              </div>

              {/* Installment Table Preview */}
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Due Date</th>
                        <th className="py-2.5 px-4">Principal</th>
                        <th className="py-2.5 px-4">Interest</th>
                        <th className="py-2.5 px-4">Total Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {schedulePreview.schedule.map((row: any) => (
                        <tr key={row.installmentNumber} className="hover:bg-slate-900/40">
                          <td className="py-2 px-4 font-mono font-bold text-slate-400">
                            {row.installmentNumber}
                          </td>
                          <td className="py-2 px-4">{formatDate(row.dueDate)}</td>
                          <td className="py-2 px-4">{formatCurrency(row.principalAmount)}</td>
                          <td className="py-2 px-4 text-emerald-400">{formatCurrency(row.interestAmount)}</td>
                          <td className="py-2 px-4 font-bold text-white">{formatCurrency(row.totalDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">Generating preview...</div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={createDealMutation.isPending}
              onClick={handleSubmitDeal}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-glow disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              <span>{createDealMutation.isPending ? 'Creating Deal...' : 'Submit Finance Deal for Approval'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
