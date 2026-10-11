import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Modal } from '../../components/common/Modal';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleBanner,
} from '../../components/common/AccessibleComponents';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  onSuccess?: () => void;
}

export const EditDealModal: React.FC<EditDealModalProps> = ({
  isOpen,
  onClose,
  dealId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'params' | 'funding' | 'rules'>('params');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [financeAmountRequired, setFinanceAmountRequired] = useState('');
  const [financeAmountApproved, setFinanceAmountApproved] = useState('');
  const [startDate, setStartDate] = useState('');
  const [interestType, setInterestType] = useState('FLAT');
  const [interestRate, setInterestRate] = useState('18.00');
  const [repaymentFrequency, setRepaymentFrequency] = useState('MONTHLY');
  const [numberOfRepayments, setNumberOfRepayments] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');

  // Syndicate Funding State
  const [fundings, setFundings] = useState<Array<{
    sourceType: 'COMPANY' | 'PARTNER' | 'OUTSIDE_INVESTOR';
    partnerId?: string;
    investorId?: string;
    amount: number;
    expectedReturnRate: number;
    notes?: string;
  }>>([]);

  // Distribution Rule State
  const [distributionRule, setDistributionRule] = useState({
    companyCommissionRate: 10,
    outsideInvestorReturnRate: 15,
    partnerProfitShareRate: 50,
    ruleDescription: 'Standard Commission & Profit Split',
  });

  // Schedule Preview State
  const [schedulePreview, setSchedulePreview] = useState<any | null>(null);

  // Fetch full deal details
  const { data: deal, isLoading: isDealLoading, refetch: refetchDeal } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const res: any = await apiClient.get(`/deals/${dealId}`);
      return res.data;
    },
    enabled: isOpen && !!dealId,
  });

  // Fetch clients, partners, investors
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res: any = await apiClient.get('/clients');
      return res.data || [];
    },
    enabled: isOpen,
  });

  const { data: partnersData } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const res: any = await apiClient.get('/partners');
      return res.data || [];
    },
    enabled: isOpen,
  });

  const { data: investorsData } = useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const res: any = await apiClient.get('/investors');
      return res.data || [];
    },
    enabled: isOpen,
  });

  // Populate form fields when deal is loaded
  useEffect(() => {
    if (deal) {
      setClientId(deal.clientId || '');
      setFinanceAmountRequired(String(deal.financeAmountRequired || ''));
      setFinanceAmountApproved(String(deal.financeAmountApproved || ''));
      setStartDate(deal.startDate ? new Date(deal.startDate).toISOString().split('T')[0] : '');
      setInterestType(deal.interestType || 'FLAT');
      setInterestRate(String(deal.interestRate || '18.00'));
      setRepaymentFrequency(deal.repaymentFrequency || 'MONTHLY');
      setNumberOfRepayments(deal.numberOfRepayments || 12);
      setPurpose(deal.purpose || '');
      setNotes(deal.notes || '');
      setStatus(deal.status || 'DRAFT');

      if (deal.fundings && deal.fundings.length > 0) {
        setFundings(
          deal.fundings.map((f: any) => ({
            sourceType: f.sourceType,
            partnerId: f.partnerId || undefined,
            investorId: f.investorId || undefined,
            amount: Number(f.amount) || 0,
            expectedReturnRate: Number(f.expectedReturnRate) || 0,
            notes: f.notes || '',
          }))
        );
      } else {
        setFundings([
          {
            sourceType: 'COMPANY',
            amount: Number(deal.financeAmountApproved) || 0,
            expectedReturnRate: 0,
          },
        ]);
      }

      if (deal.distributionRules && deal.distributionRules.length > 0) {
        const rule = deal.distributionRules[0];
        setDistributionRule({
          companyCommissionRate: Number(rule.companyCommissionRate) || 0,
          outsideInvestorReturnRate: Number(rule.outsideInvestorReturnRate) || 0,
          partnerProfitShareRate: Number(rule.partnerProfitShareRate) || 0,
          ruleDescription: rule.ruleDescription || 'Standard Commission & Profit Split',
        });
      }

      setErrorMsg(null);
      setSchedulePreview(null);
    }
  }, [deal]);

  // Totals & validation
  const totalFundedAmount = fundings.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const approvedAmountNum = Number(financeAmountApproved) || 0;
  const fundingDifference = approvedAmountNum - totalFundedAmount;
  const isFundingValid = Math.abs(fundingDifference) < 0.01;
  const hasCollections = deal?.repayments && deal.repayments.length > 0;

  // Preview Schedule Mutation
  const previewMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/deals/preview-schedule', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSchedulePreview(data);
    },
  });

  const handleFetchPreview = () => {
    previewMutation.mutate({
      financeAmount: approvedAmountNum,
      interestRate: Number(interestRate),
      interestType,
      frequency: repaymentFrequency,
      numberOfRepayments: Number(numberOfRepayments),
      startDate: startDate || new Date().toISOString(),
    });
  };

  // Funding participant actions
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
    updated[index] = { ...updated[index], [key]: value };
    setFundings(updated);
  };

  const handleAutoBalanceCompany = () => {
    const nonCompanySum = fundings
      .filter((f) => f.sourceType !== 'COMPANY')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const balance = Math.max(0, approvedAmountNum - nonCompanySum);

    const companyIndex = fundings.findIndex((f) => f.sourceType === 'COMPANY');
    if (companyIndex >= 0) {
      handleUpdateFunding(companyIndex, 'amount', balance);
    } else {
      setFundings([
        ...fundings,
        {
          sourceType: 'COMPANY',
          amount: balance,
          expectedReturnRate: 0,
        },
      ]);
    }
  };

  // Update Deal Mutation
  const updateDealMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.patch(`/deals/${dealId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update finance deal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientId) {
      setErrorMsg('Please select a client.');
      setActiveTab('params');
      return;
    }

    if (!approvedAmountNum || approvedAmountNum <= 0) {
      setErrorMsg('Approved finance amount must be greater than zero.');
      setActiveTab('params');
      return;
    }

    if (!isFundingValid && (status === 'APPROVED' || status === 'ACTIVE')) {
      setErrorMsg(
        `Total funding allocation (₹${totalFundedAmount.toLocaleString('en-IN')}) must match approved finance amount (₹${approvedAmountNum.toLocaleString('en-IN')}). Difference: ₹${fundingDifference.toLocaleString('en-IN')}`
      );
      setActiveTab('funding');
      return;
    }

    const payload = {
      clientId,
      financeAmountRequired: Number(financeAmountRequired) || approvedAmountNum,
      financeAmountApproved: approvedAmountNum,
      startDate,
      interestType,
      interestRate: Number(interestRate),
      repaymentFrequency,
      numberOfRepayments: Number(numberOfRepayments),
      purpose,
      notes,
      status,
      fundings: fundings.map((f) => ({
        sourceType: f.sourceType,
        partnerId: f.sourceType === 'PARTNER' ? f.partnerId : null,
        investorId: f.sourceType === 'OUTSIDE_INVESTOR' ? f.investorId : null,
        amount: Number(f.amount) || 0,
        expectedReturnRate: Number(f.expectedReturnRate) || 0,
        notes: f.notes || null,
      })),
      distributionRule: {
        companyCommissionRate: Number(distributionRule.companyCommissionRate) || 0,
        outsideInvestorReturnRate: Number(distributionRule.outsideInvestorReturnRate) || 0,
        partnerProfitShareRate: Number(distributionRule.partnerProfitShareRate) || 0,
        ruleDescription: distributionRule.ruleDescription,
      },
    };

    updateDealMutation.mutate(payload);
  };

  if (isDealLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Finance Deal" maxWidth="4xl">
        <div className="py-12 text-center text-stone-500 font-medium">
          Loading deal information...
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Finance Deal — ${deal?.dealNumber || ''}`}
      subtitle={`Client: ${deal?.client?.fullName || 'Borrower'}`}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-2 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'params'
                ? 'bg-maroon-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>1. Deal Parameters</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('funding')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'funding'
                ? 'bg-maroon-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>2. Syndicate Funding</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isFundingValid ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950 font-bold'
              }`}
            >
              {isFundingValid ? 'Balanced' : 'Discrepancy'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-maroon-800 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>3. Distribution & Schedule</span>
          </button>
        </div>

        {errorMsg && (
          <AccessibleBanner
            variant="danger"
            title="Validation Notice"
            message={errorMsg}
            onClose={() => setErrorMsg(null)}
          />
        )}

        {hasCollections && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-bold">Deal has collections:</span> This deal has already recorded repayment receipts. Paid installments are locked to preserve accounting integrity. Financial term amendments will recalculate future upcoming schedules and outstanding balances based on remaining principal.
            </div>
          </div>
        )}

        {/* TAB 1: DEAL PARAMETERS */}
        {activeTab === 'params' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AccessibleSelect
                label="Borrower / Client"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select borrower...</option>
                {clientsData?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.businessName || 'Individual'}) - {c.phone}
                  </option>
                ))}
              </AccessibleSelect>

              <AccessibleSelect
                label="Deal Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </AccessibleSelect>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AccessibleInput
                label="Requested Finance Amount (₹)"
                type="number"
                value={financeAmountRequired}
                onChange={(e) => setFinanceAmountRequired(e.target.value)}
              />
              <AccessibleInput
                label="Approved Finance Amount (₹)"
                type="number"
                required
                value={financeAmountApproved}
                onChange={(e) => setFinanceAmountApproved(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <AccessibleInput
                label="Contract Start Date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <AccessibleSelect
                label="Interest Calculation Method"
                value={interestType}
                onChange={(e) => setInterestType(e.target.value)}
              >
                <option value="FLAT">Flat Rate (Simple Interest)</option>
                <option value="REDUCING_BALANCE">Reducing Balance (EMI)</option>
                <option value="CUSTOM">Custom Schedule</option>
              </AccessibleSelect>

              <AccessibleInput
                label="Interest Rate (% p.a.)"
                type="number"
                step="0.1"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AccessibleSelect
                label="Repayment Frequency"
                value={repaymentFrequency}
                onChange={(e) => setRepaymentFrequency(e.target.value)}
              >
                <option value="DAILY">Daily Collections</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly (Fortnightly)</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </AccessibleSelect>

              <AccessibleInput
                label="Number of Installments"
                type="number"
                min="1"
                required
                value={numberOfRepayments}
                onChange={(e) => setNumberOfRepayments(Number(e.target.value))}
              />
            </div>

            <div>
              <AccessibleInput
                label="Purpose / Business Objective"
                type="text"
                placeholder="e.g. Working Capital, Inventory Purchase, Expansion"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1.5">
                Contract Remarks & Internal Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal verification notes, collateral remarks, or guarantor details"
                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/20"
              />
            </div>
          </div>
        )}

        {/* TAB 2: SYNDICATE FUNDING */}
        {activeTab === 'funding' && (
          <div className="space-y-5">
            {/* Summary Banner */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-stone-500">Approved Target</p>
                <p className="text-lg font-bold text-stone-900">{formatCurrency(approvedAmountNum)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-500">Total Funded</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalFundedAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-500">Difference</p>
                <p
                  className={`text-lg font-bold ${
                    isFundingValid ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(fundingDifference)}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAutoBalanceCompany}
                  className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-xs font-bold text-stone-800 shadow-2xs"
                >
                  Auto-Balance Company Capital
                </button>
              </div>
            </div>

            {/* Funding Allocation Items */}
            <div className="space-y-3">
              {fundings.map((f, idx) => {
                const itemPercentage = approvedAmountNum > 0
                  ? ((Number(f.amount) || 0) / approvedAmountNum) * 100
                  : 0;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-stone-600">
                        Participant #{idx + 1}: {f.sourceType.replace('_', ' ')}
                      </span>
                      {fundings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFundingItem(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      {f.sourceType === 'COMPANY' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-stone-600 mb-1">
                            Funding Source
                          </label>
                          <div className="px-3 py-2 bg-stone-100 rounded-lg text-sm font-semibold text-stone-800">
                            Company Own Capital Reserves
                          </div>
                        </div>
                      )}

                      {f.sourceType === 'PARTNER' && (
                        <div className="sm:col-span-2">
                          <AccessibleSelect
                            label="Business Partner"
                            required
                            value={f.partnerId || ''}
                            onChange={(e) => handleUpdateFunding(idx, 'partnerId', e.target.value)}
                          >
                            <option value="">Choose partner...</option>
                            {partnersData?.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.partnerCode})
                              </option>
                            ))}
                          </AccessibleSelect>
                        </div>
                      )}

                      {f.sourceType === 'OUTSIDE_INVESTOR' && (
                        <div className="sm:col-span-2">
                          <AccessibleSelect
                            label="Outside Investor"
                            required
                            value={f.investorId || ''}
                            onChange={(e) => handleUpdateFunding(idx, 'investorId', e.target.value)}
                          >
                            <option value="">Choose investor...</option>
                            {investorsData?.map((inv: any) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({inv.investorCode})
                              </option>
                            ))}
                          </AccessibleSelect>
                        </div>
                      )}

                      <div>
                        <AccessibleInput
                          label="Contribution Amount (₹)"
                          type="number"
                          required
                          value={f.amount}
                          onChange={(e) => handleUpdateFunding(idx, 'amount', Number(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Share %
                        </label>
                        <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-900">
                          {itemPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {f.sourceType === 'OUTSIDE_INVESTOR' && (
                      <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AccessibleInput
                          label="Expected Return Rate (% p.a.)"
                          type="number"
                          step="0.1"
                          value={f.expectedReturnRate}
                          onChange={(e) => handleUpdateFunding(idx, 'expectedReturnRate', Number(e.target.value) || 0)}
                        />
                        <AccessibleInput
                          label="Funding Remarks / Reference"
                          type="text"
                          value={f.notes || ''}
                          onChange={(e) => handleUpdateFunding(idx, 'notes', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Participant Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <AccessibleButton
                type="button"
                variant="outline"
                size="compact"
                icon={Plus}
                onClick={() => handleAddFundingItem('COMPANY')}
              >
                Add Company Capital
              </AccessibleButton>
              <AccessibleButton
                type="button"
                variant="outline"
                size="compact"
                icon={Plus}
                onClick={() => handleAddFundingItem('PARTNER')}
              >
                Add Partner Contribution
              </AccessibleButton>
              <AccessibleButton
                type="button"
                variant="outline"
                size="compact"
                icon={Plus}
                onClick={() => handleAddFundingItem('OUTSIDE_INVESTOR')}
              >
                Add Outside Investor
              </AccessibleButton>
            </div>
          </div>
        )}

        {/* TAB 3: DISTRIBUTION RULES & SCHEDULE PREVIEW */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <h4 className="font-bold text-base text-stone-900">Profit & Commission Split Rules</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AccessibleInput
                  label="Company Commission Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={distributionRule.companyCommissionRate}
                  onChange={(e) =>
                    setDistributionRule({
                      ...distributionRule,
                      companyCommissionRate: Number(e.target.value) || 0,
                    })
                  }
                />
                <AccessibleInput
                  label="Outside Investor Return Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={distributionRule.outsideInvestorReturnRate}
                  onChange={(e) =>
                    setDistributionRule({
                      ...distributionRule,
                      outsideInvestorReturnRate: Number(e.target.value) || 0,
                    })
                  }
                />
                <AccessibleInput
                  label="Partner Profit Share Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={distributionRule.partnerProfitShareRate}
                  onChange={(e) =>
                    setDistributionRule({
                      ...distributionRule,
                      partnerProfitShareRate: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <AccessibleInput
                label="Rule Description / Reference"
                type="text"
                value={distributionRule.ruleDescription}
                onChange={(e) =>
                  setDistributionRule({
                    ...distributionRule,
                    ruleDescription: e.target.value,
                  })
                }
              />
            </div>

            {/* Schedule Preview Trigger */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-stone-900">Repayment Plan Preview</h4>
                <p className="text-xs text-stone-500">
                  Inspect newly calculated installments before saving.
                </p>
              </div>
              <AccessibleButton
                type="button"
                variant="outline"
                size="compact"
                icon={RefreshCw}
                onClick={handleFetchPreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? 'Generating...' : 'Calculate Preview'}
              </AccessibleButton>
            </div>

            {schedulePreview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-maroon-50/50 border border-maroon-100 rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-stone-500 block">Total Principal</span>
                    <span className="text-base font-bold text-stone-900">
                      {formatCurrency(schedulePreview.totals?.principal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-500 block">Total Interest</span>
                    <span className="text-base font-bold text-emerald-700">
                      {formatCurrency(schedulePreview.totals?.totalInterest)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-500 block">Total Payable</span>
                    <span className="text-base font-bold text-stone-900">
                      {formatCurrency(schedulePreview.totals?.totalPayable)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-500 block">Installment Amount</span>
                    <span className="text-base font-bold text-maroon-800">
                      {formatCurrency(schedulePreview.totals?.installmentAmount)}
                    </span>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-semibold sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Principal</th>
                        <th className="py-2.5 px-3">Interest</th>
                        <th className="py-2.5 px-3">Total Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {schedulePreview.schedule?.map((item: any) => (
                        <tr key={item.installmentNumber} className="hover:bg-stone-50">
                          <td className="py-2 px-3 font-bold">{item.installmentNumber}</td>
                          <td className="py-2 px-3">{formatDate(item.dueDate)}</td>
                          <td className="py-2 px-3">{formatCurrency(item.principalAmount)}</td>
                          <td className="py-2 px-3 text-emerald-700">{formatCurrency(item.interestAmount)}</td>
                          <td className="py-2 px-3 font-semibold text-stone-900">{formatCurrency(item.totalDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-stone-200">
          <AccessibleButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </AccessibleButton>
          <AccessibleButton
            type="submit"
            variant="primary"
            disabled={updateDealMutation.isPending}
          >
            {updateDealMutation.isPending ? 'Saving Amendments...' : 'Save Changes'}
          </AccessibleButton>
        </div>
      </form>
    </Modal>
  );
};
