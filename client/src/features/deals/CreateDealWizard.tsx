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
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleBanner,
} from '../../components/common/AccessibleComponents';

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
    { sourceType: 'COMPANY', amount: 100000, expectedReturnRate: 0 },
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Create Finance Deal</h1>
        <p className="text-base text-stone-600 font-medium mt-1">
          Multi-party capital syndication, outside investor allocation & automated schedule generation
        </p>
      </div>

      {/* Step Progress Bar */}
      <AccessibleCard className="p-4 bg-white border-2 border-stone-200">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Client & Terms' },
            { num: 2, label: 'Syndicate Funding' },
            { num: 3, label: 'Profit Rules' },
            { num: 4, label: 'Schedule & Submit' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                  step === s.num
                    ? 'bg-maroon-800 text-white shadow-md'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-600'
                    : 'bg-stone-100 text-stone-600 border border-stone-300'
                }`}
              >
                {step > s.num ? <Check className="h-6 w-6 stroke-[3]" /> : s.num}
              </div>
              <span
                className={`text-base font-bold hidden sm:inline ${
                  step === s.num ? 'text-maroon-900 font-extrabold' : step > s.num ? 'text-stone-800' : 'text-stone-500'
                }`}
              >
                {s.label}
              </span>
              {s.num < 4 && <ChevronRight className="h-5 w-5 text-stone-400 hidden sm:inline" />}
            </div>
          ))}
        </div>
      </AccessibleCard>

      {errorMsg && (
        <AccessibleBanner
          variant="danger"
          title="Validation Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      {/* STEP 1: Client & Finance Terms */}
      {step === 1 && (
        <AccessibleCard className="p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-stone-100 pb-4">
            <h3 className="text-2xl font-bold text-stone-900">Step 1: Client & Finance Terms</h3>
            <p className="text-base text-stone-600 mt-1">Select the borrowing client and define finance terms.</p>
          </div>

          <AccessibleSelect
            label="Select Client"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Choose a client...</option>
            {clientsData?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.businessName || 'Individual'}) - {c.phone}
              </option>
            ))}
          </AccessibleSelect>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Finance Amount Required (₹)"
              type="number"
              value={financeAmountRequired}
              onChange={(e) => setFinanceAmountRequired(e.target.value)}
            />
            <AccessibleInput
              label="Finance Amount Approved (₹)"
              type="number"
              required
              value={financeAmountApproved}
              onChange={(e) => {
                setFinanceAmountApproved(e.target.value);
                // Update default funding if only 1 item
                if (fundings.length === 1 && fundings[0].sourceType === 'COMPANY') {
                  setFundings([{ ...fundings[0], amount: Number(e.target.value) || 0 }]);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <AccessibleSelect
              label="Interest Calculation Type"
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
            >
              <option value="FLAT">Flat Interest</option>
              <option value="FIXED_WEEKLY">Fixed Weekly Payment</option>
              <option value="FIXED_MONTHLY">Fixed Monthly Payment</option>
              <option value="PRINCIPAL_PLUS_INTEREST">Principal + Interest</option>
              <option value="REDUCING_BALANCE">Reducing Balance (EMI)</option>
              <option value="CUSTOM">Custom Schedule</option>
            </AccessibleSelect>

            <AccessibleInput
              label="Annual Interest Rate (%)"
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />

            <AccessibleSelect
              label="Repayment Frequency"
              value={repaymentFrequency}
              onChange={(e) => setRepaymentFrequency(e.target.value)}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="DAILY">Daily</option>
            </AccessibleSelect>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Number of Repayments / Installments"
              type="number"
              value={numberOfRepayments}
              onChange={(e) => setNumberOfRepayments(Number(e.target.value))}
            />

            <AccessibleInput
              label="Disbursement / Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <AccessibleInput
            label="Finance Purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Working capital, expansion, equipment purchase..."
          />

          <div className="flex justify-end pt-6 border-t-2 border-stone-200">
            <AccessibleButton
              type="button"
              variant="primary"
              onClick={() => {
                if (!clientId) {
                  setErrorMsg('Please select a client');
                  return;
                }
                setErrorMsg(null);
                setStep(2);
              }}
              icon={<ChevronRight className="h-6 w-6" />}
            >
              Next: Syndicate Funding
            </AccessibleButton>
          </div>
        </AccessibleCard>
      )}

      {/* STEP 2: Multi-Party Syndicate Funding */}
      {step === 2 && (
        <AccessibleCard className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-stone-100 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-stone-900">Step 2: Syndicate Funding Allocation</h3>
              <p className="text-base text-stone-600 mt-1">
                Split funding across Company Capital, Internal Partners, and Outside Investors.
              </p>
            </div>
            <div className="sm:text-right bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <span className="text-sm font-bold text-stone-600 block">Approved Target:</span>
              <p className="text-2xl font-black text-maroon-800 whitespace-nowrap">{formatCurrency(approvedAmountNum)}</p>
            </div>
          </div>

          {/* Funding Status Indicator */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between text-base ${
              isFundingValid
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                : 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
            }`}
          >
            <div>
              <span className="font-extrabold text-lg">Total Allocated: {formatCurrency(totalFundedAmount)}</span>
              <p className="text-sm mt-0.5 opacity-90 font-medium">
                {isFundingValid
                  ? '✓ Funding matches 100% of approved finance amount'
                  : `! Remaining to allocate: ${formatCurrency(fundingDifference)}`}
              </p>
            </div>
            {!isFundingValid && <ShieldAlert className="h-7 w-7 text-amber-600 shrink-0" />}
          </div>

          {/* Funding Rows */}
          <div className="space-y-4">
            {fundings.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-maroon-800 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-base font-bold text-stone-900">
                      {item.sourceType === 'COMPANY' ? 'Company Capital' : item.sourceType === 'PARTNER' ? 'Partner Equity' : 'Outside Investor'}
                    </span>
                  </div>
                  {fundings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFundingItem(idx)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="Remove Funding"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <AccessibleSelect
                    label="Funding Source"
                    value={item.sourceType}
                    onChange={(e) => handleUpdateFunding(idx, 'sourceType', e.target.value)}
                  >
                    <option value="COMPANY">Company Own Capital</option>
                    <option value="PARTNER">Partner Capital</option>
                    <option value="OUTSIDE_INVESTOR">Outside Investor</option>
                  </AccessibleSelect>

                  {item.sourceType === 'PARTNER' && (
                    <AccessibleSelect
                      label="Select Partner"
                      value={item.partnerId || ''}
                      onChange={(e) => handleUpdateFunding(idx, 'partnerId', e.target.value)}
                    >
                      {partnersData?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </AccessibleSelect>
                  )}

                  {item.sourceType === 'OUTSIDE_INVESTOR' && (
                    <AccessibleSelect
                      label="Select Investor"
                      value={item.investorId || ''}
                      onChange={(e) => handleUpdateFunding(idx, 'investorId', e.target.value)}
                    >
                      {investorsData?.map((inv: any) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name}
                        </option>
                      ))}
                    </AccessibleSelect>
                  )}

                  <AccessibleInput
                    label="Funding Amount (₹)"
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleUpdateFunding(idx, 'amount', Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Funding Source Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => handleAddFundingItem('COMPANY')}
              icon={<Plus className="h-5 w-5 text-maroon-800" />}
            >
              + Company Capital
            </AccessibleButton>
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => handleAddFundingItem('PARTNER')}
              icon={<Plus className="h-5 w-5 text-blue-800" />}
            >
              + Partner Capital
            </AccessibleButton>
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => handleAddFundingItem('OUTSIDE_INVESTOR')}
              icon={<Plus className="h-5 w-5 text-purple-800" />}
            >
              + Outside Investor
            </AccessibleButton>
          </div>

          <div className="flex justify-between pt-6 border-t-2 border-stone-200">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              icon={<ChevronLeft className="h-6 w-6" />}
            >
              Back
            </AccessibleButton>
            <AccessibleButton
              type="button"
              variant="primary"
              disabled={!isFundingValid}
              onClick={() => {
                setErrorMsg(null);
                setStep(3);
              }}
              icon={<ChevronRight className="h-6 w-6" />}
            >
              Next: Profit Rules
            </AccessibleButton>
          </div>
        </AccessibleCard>
      )}

      {/* STEP 3: Profit & Commission Rules */}
      {step === 3 && (
        <AccessibleCard className="p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-stone-100 pb-4">
            <h3 className="text-2xl font-bold text-stone-900">Step 3: Profit & Commission Rules</h3>
            <p className="text-base text-stone-600 mt-1">
              Configure how collected repayment interest is distributed between Outside Investors, Company Commission, and Partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
              <AccessibleInput
                label="Company Management Commission (%)"
                type="number"
                value={distributionRule.companyCommissionRate}
                onChange={(e) =>
                  setDistributionRule({ ...distributionRule, companyCommissionRate: Number(e.target.value) })
                }
              />
              <p className="text-sm text-stone-500 font-medium mt-2">Company collection & admin fee on interest</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
              <AccessibleInput
                label="Investor Return Target (%)"
                type="number"
                value={distributionRule.outsideInvestorReturnRate}
                onChange={(e) =>
                  setDistributionRule({ ...distributionRule, outsideInvestorReturnRate: Number(e.target.value) })
                }
              />
              <p className="text-sm text-stone-500 font-medium mt-2">Contracted ROI for external investors</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200">
              <AccessibleInput
                label="Partner Profit Share (%)"
                type="number"
                value={distributionRule.partnerProfitShareRate}
                onChange={(e) =>
                  setDistributionRule({ ...distributionRule, partnerProfitShareRate: Number(e.target.value) })
                }
              />
              <p className="text-sm text-stone-500 font-medium mt-2">Share allocated to partner equity pool</p>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t-2 border-stone-200">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              icon={<ChevronLeft className="h-6 w-6" />}
            >
              Back
            </AccessibleButton>
            <AccessibleButton
              type="button"
              variant="primary"
              onClick={() => {
                handleFetchPreview();
                setStep(4);
              }}
              icon={<ChevronRight className="h-6 w-6" />}
            >
              Next: Preview Schedule
            </AccessibleButton>
          </div>
        </AccessibleCard>
      )}

      {/* STEP 4: Schedule Preview & Submit */}
      {step === 4 && (
        <AccessibleCard className="p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-stone-100 pb-4">
            <h3 className="text-2xl font-bold text-stone-900">Step 4: Preview Repayment Schedule & Submit</h3>
            <p className="text-base text-stone-600 mt-1">Review the calculated repayment installments and submit for approval.</p>
          </div>

          {schedulePreview ? (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border-2 border-stone-200">
                  <span className="text-sm font-bold text-stone-600">Approved Amount</span>
                  <p className="text-xl sm:text-2xl font-black text-stone-900 mt-1 whitespace-nowrap">
                    {formatCurrency(schedulePreview.totals.principal)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
                  <span className="text-sm font-bold text-emerald-800">Total Interest</span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 whitespace-nowrap">
                    {formatCurrency(schedulePreview.totals.totalInterest)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
                  <span className="text-sm font-bold text-blue-800">Total Payable</span>
                  <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1 whitespace-nowrap">
                    {formatCurrency(schedulePreview.totals.totalPayable)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
                  <span className="text-sm font-bold text-amber-800">Installment Due</span>
                  <p className="text-xl sm:text-2xl font-black text-amber-900 mt-1 whitespace-nowrap">
                    {formatCurrency(schedulePreview.totals.installmentAmount)}
                  </p>
                </div>
              </div>

              {/* Installment Table Preview */}
              <div className="overflow-hidden rounded-2xl border-2 border-stone-300 bg-white shadow-sm">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-base">
                    <thead className="bg-stone-100 text-stone-800 font-bold sticky top-0 border-b-2 border-stone-200">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-right">Principal</th>
                        <th className="py-3 px-4 text-right">Interest</th>
                        <th className="py-3 px-4 text-right">Total Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-800">
                      {schedulePreview.schedule.map((row: any) => (
                        <tr key={row.installmentNumber} className="hover:bg-stone-50">
                          <td className="py-3 px-4 font-mono font-bold text-stone-600">
                            {row.installmentNumber}
                          </td>
                          <td className="py-3 px-4 font-medium">{formatDate(row.dueDate)}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(row.principalAmount)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatCurrency(row.interestAmount)}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-stone-900">{formatCurrency(row.totalDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-base font-medium text-stone-500">Generating schedule preview...</div>
          )}

          <div className="flex justify-between pt-6 border-t-2 border-stone-200">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              icon={<ChevronLeft className="h-6 w-6" />}
            >
              Back
            </AccessibleButton>
            <AccessibleButton
              type="button"
              variant="primary"
              disabled={createDealMutation.isPending}
              onClick={handleSubmitDeal}
              icon={<FileCheck className="h-6 w-6" />}
            >
              {createDealMutation.isPending ? 'Creating Deal...' : 'Submit Finance Deal for Approval'}
            </AccessibleButton>
          </div>
        </AccessibleCard>
      )}
    </div>
  );
};
