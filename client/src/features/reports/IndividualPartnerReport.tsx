import React, { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Printer,
  Download,
  Image,
  Copy,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Briefcase,
  TrendingUp,
  CreditCard,
  Building,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Hash,
  PieChart,
  Wallet,
} from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { exportElementAsJpg } from '../../services/documents/imageExporter';
import { StatusBadge } from '../../components/common/Badge';
import {
  AccessibleButton,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';

export const IndividualPartnerReport: React.FC = () => {
  const { company } = useCompanyProfile();
  const reportRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerSearch, setPartnerSearch] = useState<string>('');
  const [period, setPeriod] = useState<string>('all-time');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeSectionTab, setActiveSectionTab] = useState<
    'ledger' | 'deals' | 'distributions' | 'payouts' | 'reconciliation'
  >('ledger');

  // Export State
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Fetch partner options for selector dropdown
  const { data: partnersList, isLoading: isLoadingPartners } = useQuery({
    queryKey: ['partner-options'],
    queryFn: async () => {
      const res: any = await apiClient.get('/reports/partner-options');
      return res.data || [];
    },
  });

  // Auto-select first partner if none selected
  React.useEffect(() => {
    if (!selectedPartnerId && partnersList && partnersList.length > 0) {
      setSelectedPartnerId(partnersList[0].id);
    }
  }, [partnersList, selectedPartnerId]);

  // Filtered partners for search
  const filteredPartners = useMemo(() => {
    if (!partnersList) return [];
    if (!partnerSearch.trim()) return partnersList;
    const q = partnerSearch.toLowerCase().trim();
    return partnersList.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.partnerCode?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.pan?.toLowerCase().includes(q)
    );
  }, [partnersList, partnerSearch]);

  // 2. Fetch Individual Partner Report data
  const {
    data: reportData,
    isLoading: isLoadingReport,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['individual-partner-report', selectedPartnerId, period, startDate, endDate],
    queryFn: async () => {
      if (!selectedPartnerId) return null;
      let url = `/reports/partners/${selectedPartnerId}/statement?period=${period}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res: any = await apiClient.get(url);
      return res.data;
    },
    enabled: !!selectedPartnerId,
  });

  const partner = reportData?.partner;
  const summary = reportData?.summary || {
    totalCapitalContribution: 0,
    additionalCapitalAdded: 0,
    totalFundedToDeals: 0,
    capitalWithdrawn: 0,
    currentCapitalBalance: 0,
    activeCapitalInDeals: 0,
    profitShareEarned: 0,
    profitSharePaid: 0,
    pendingProfitShare: 0,
    totalAmountPaid: 0,
    totalOutstandingPayable: 0,
    totalDealsParticipated: 0,
    activeDealsCount: 0,
  };
  const periodSummary = reportData?.periodSummary;
  const sections = reportData?.sections || {};
  const transactions = reportData?.periodTransactions || [];

  // Export handlers
  const exportJPG = async () => {
    if (!reportRef.current || !partner) return;
    try {
      setIsExportingJpg(true);
      const filename = `Partner_Report_${partner.partnerCode}_${partner.name.replace(/\s+/g, '_')}_${period}.jpg`;
      await exportElementAsJpg(reportRef.current, filename, 2.5);
    } catch (err) {
      console.error('Failed to export JPG:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  const exportCSV = () => {
    if (!reportData || !partner) return;

    const lines: string[] = [];
    lines.push(`"${company.name || 'FinFlow ERP'} — Partner Capital & Profit Share Statement"`);
    lines.push(`"Partner Name","${partner.name}","Partner Code","${partner.partnerCode}"`);
    lines.push(`"Phone","${partner.phone || '—'}","PAN","${partner.pan || '—'}"`);
    lines.push(`"Equity Share","${partner.sharePercentage}%","Status","${partner.status || 'ACTIVE'}"`);
    lines.push(`"Report Period","${reportData.period?.label || 'All-Time'}","Generated At","${new Date(reportData.generatedAt).toLocaleString('en-IN')}"`);
    lines.push('');

    // Summary KPIs
    lines.push('"CAPITAL & PROFIT KPI SUMMARY"');
    lines.push('"Total Capital Contribution","Additional Capital Added","Capital Withdrawn / Returned","Current Capital Balance","Profit Share Earned","Profit Share Paid","Pending Profit Share","Total Amount Paid","Total Outstanding Payable"');
    lines.push(
      `"${summary.totalCapitalContribution}","${summary.additionalCapitalAdded}","${summary.capitalWithdrawn}","${summary.currentCapitalBalance}","${summary.profitShareEarned}","${summary.profitSharePaid}","${summary.pendingProfitShare}","${summary.totalAmountPaid}","${summary.totalOutstandingPayable}"`
    );
    lines.push('');

    // Transactions Table
    lines.push('"TRANSACTION AUDIT LEDGER"');
    lines.push('"Date","Reference / Receipt","Deal Number","Client Name","Transaction Type","Description","Credit / Contribution","Debit / Payment","Capital Balance","Status"');

    transactions.forEach((t: any) => {
      lines.push(
        `"${formatDate(t.date)}","${t.reference}","${t.dealNumber}","${t.clientName}","${t.typeLabel}","${t.description}","${t.credit}","${t.debit}","${t.balance}","${t.paymentStatus}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Partner_Report_${partner.partnerCode}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySummaryText = async () => {
    if (!reportData || !partner) return;

    const lines: string[] = [];
    lines.push(`*${(company.name || 'FINFLOW ERP').toUpperCase()}*`);
    lines.push(`*PARTNER CAPITAL & PROFIT SHARE STATEMENT*`);
    lines.push('──────────────────────────────');
    lines.push(`👤 *Partner:* ${partner.name} (${partner.partnerCode})`);
    lines.push(`📊 *Equity Share:* ${partner.sharePercentage}%`);
    if (partner.phone) lines.push(`📞 *Phone:* ${partner.phone}`);
    if (partner.pan) lines.push(`🆔 *PAN:* ${partner.pan}`);
    lines.push(`📅 *Period:* ${reportData.period?.label || 'All-Time'}`);
    lines.push(`🕒 *Generated:* ${new Date(reportData.generatedAt).toLocaleDateString('en-IN')}`);
    lines.push('──────────────────────────────');
    lines.push(`💼 *Total Capital Contribution:* ${formatCurrency(summary.totalCapitalContribution)}`);
    lines.push(`➕ *Additional Capital Added:* ${formatCurrency(summary.additionalCapitalAdded)}`);
    lines.push(`↩️ *Capital Withdrawn / Returned:* ${formatCurrency(summary.capitalWithdrawn)}`);
    lines.push(`🏦 *Current Capital Balance:* ${formatCurrency(summary.currentCapitalBalance)}`);
    lines.push(`📈 *Profit Share Earned:* ${formatCurrency(summary.profitShareEarned)}`);
    lines.push(`💸 *Profit Share Paid:* ${formatCurrency(summary.profitSharePaid)}`);
    lines.push(`⏳ *Pending Profit Share:* ${formatCurrency(summary.pendingProfitShare)}`);
    lines.push(`✅ *Total Amount Paid:* ${formatCurrency(summary.totalAmountPaid)}`);
    lines.push(`🎯 *Total Outstanding Payable:* ${formatCurrency(summary.totalOutstandingPayable)}`);
    lines.push('──────────────────────────────');

    if (sections.dealFundings && sections.dealFundings.length > 0) {
      lines.push('*PARTICIPATING DEALS:*');
      sections.dealFundings.forEach((d: any, idx: number) => {
        lines.push(
          `${idx + 1}. Deal ${d.dealNumber} (${d.clientName}) — Funded: ${formatCurrency(d.partnerAmount)} (${d.sharePercentage}%) | Returned: ${formatCurrency(d.principalReturned)} | Status: ${d.dealStatus}`
        );
      });
      lines.push('──────────────────────────────');
    }

    lines.push(`_Confidential Statement generated by ${company.name || 'FinFlow'}_`);

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setPeriod('all-time');
    setStartDate('');
    setEndDate('');
    setPartnerSearch('');
  };

  return (
    <div className="space-y-6">
      {/* ── PARTNER SELECTION & DATE FILTER TOOLBAR (Non-Printable) ── */}
      <AccessibleCard withTopAccent className="p-4 sm:p-5 no-print space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Partner Selector */}
          <div className="lg:col-span-5 space-y-1.5">
            <label htmlFor="partner-select" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-700" />
                Select Partner <span className="text-rose-600">*</span>
              </span>
              {partner && (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {partner.partnerCode} • {partner.sharePercentage}% Share
                </span>
              )}
            </label>

            <div className="relative">
              <select
                id="partner-select"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full h-11 pl-3 pr-10 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  {isLoadingPartners ? 'Loading partners...' : '-- Select a Partner --'}
                </option>
                {filteredPartners.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.partnerCode} — {p.name} {p.sharePercentage ? `(${p.sharePercentage}% Equity)` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Quick Partner Filter Input */}
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
              <input
                type="text"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                placeholder="Search partner by name, code, phone, or PAN..."
                className="w-full h-8 pl-8 pr-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>

          {/* Quick Period Buttons */}
          <div className="lg:col-span-7 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-700" />
                Reporting Period
              </label>
              {(period !== 'all-time' || startDate || endDate || partnerSearch) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Filters
                </button>
              )}
            </div>

            {/* Pill Buttons for Periods */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all-time', label: 'All-Time' },
                { id: 'this-week', label: 'This Week' },
                { id: 'previous-week', label: 'Previous Week' },
                { id: 'this-month', label: 'This Month' },
                { id: 'previous-month', label: 'Previous Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map((pItem) => (
                <button
                  key={pItem.id}
                  type="button"
                  onClick={() => handlePeriodChange(pItem.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    period === pItem.id
                      ? 'bg-rose-900 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pItem.label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </AccessibleCard>

      {/* ── EMPTY STATE WHEN NO PARTNER SELECTED ── */}
      {!selectedPartnerId ? (
        <AccessibleEmptyState
          icon={User}
          title="No Partner Selected"
          description="Please select a partner from the dropdown above to view their individual Partner Capital & Profit Share Statement."
        />
      ) : isLoadingReport ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-rose-700 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Generating Partner Capital & Profit Share Statement...</p>
        </div>
      ) : !reportData || !partner ? (
        <AccessibleEmptyState
          icon={AlertCircle}
          title="Statement Unavailable"
          description="Unable to generate the statement for the selected partner. Please verify permissions or select another partner."
        />
      ) : (
        /* ── REPORT DOCUMENT WRAPPER (Printable Document) ── */
        <div ref={reportRef} className="space-y-6 print:space-y-4 print:text-black">
          {/* ── TOP ACTION BAR (Non-Printable) ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                Verified Partner Statement
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {reportData.period?.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AccessibleButton
                variant="outline"
                size="compact"
                icon={copySuccess ? CheckCircle2 : Copy}
                onClick={copySummaryText}
              >
                {copySuccess ? 'Copied!' : 'Copy Summary'}
              </AccessibleButton>

              <AccessibleButton
                variant="outline"
                size="compact"
                icon={Download}
                onClick={exportCSV}
              >
                Export CSV
              </AccessibleButton>

              <AccessibleButton
                variant="outline"
                size="compact"
                icon={Image}
                onClick={exportJPG}
                isLoading={isExportingJpg}
              >
                Export Image
              </AccessibleButton>

              <AccessibleButton
                variant="primary"
                size="compact"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print / PDF
              </AccessibleButton>
            </div>
          </div>

          {/* ── REPORT HEADER (Official A4 Format) ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs relative overflow-hidden print:border-none print:shadow-none print:p-0">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-800 via-rose-700 to-amber-600 no-print" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
              {/* Company Branding */}
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name || 'Company Logo'}
                    className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-900 to-rose-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    {(company.name || 'FF').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {company.name || 'FinFlow — Private Finance Management'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Private Finance & Syndication Management ERP
                  </p>
                  {(company.phone || company.email || company.address) && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {[company.phone, company.email, company.address].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Document Identity */}
              <div className="sm:text-right space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-900 border border-rose-200">
                  Audit-Verified Statement
                </span>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Partner Capital & Profit Share Statement
                </h1>
                <p className="text-xs font-semibold text-slate-600">
                  Period: <span className="text-slate-900">{reportData.period?.label}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Generated: {new Date(reportData.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Selected Partner Details Header Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Partner Name & Code</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{partner.name}</span>
                <span className="text-[11px] font-bold text-rose-700">{partner.partnerCode}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Equity Ownership</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{partner.sharePercentage}% Equity</span>
                <span className="text-[11px] font-semibold text-emerald-700">Status: {partner.status || 'ACTIVE'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Contact Details</span>
                <span className="text-slate-800 font-semibold block mt-0.5">{partner.phone || '—'}</span>
                <span className="text-slate-500 text-[11px] truncate block">{partner.email || '—'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Tax ID & Registration</span>
                <span className="text-slate-900 font-mono font-bold block mt-0.5">PAN: {partner.pan || '—'}</span>
                <span className="text-slate-400 text-[11px] block truncate">{partner.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* ── 9 FINANCIAL SUMMARY CARDS (Senior-Friendly, High Contrast) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total Capital Contribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Capital Contribution
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(summary.totalCapitalContribution)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Committed partner equity capital
              </p>
            </div>

            {/* Card 2: Additional Capital Added */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Additional Capital Added
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-700 tracking-tight">
                {formatCurrency(summary.additionalCapitalAdded)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Capital deployed during period ({summary.totalDealsParticipated} total deals)
              </p>
            </div>

            {/* Card 3: Capital Withdrawn / Returned */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Capital Withdrawn / Returned
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">
                {formatCurrency(summary.capitalWithdrawn)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Principal recovered from repayments
              </p>
            </div>

            {/* Card 4: Current Capital Balance */}
            <div className="bg-white p-5 rounded-2xl border-2 border-rose-900/20 shadow-xs space-y-2 bg-gradient-to-br from-rose-50/40 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                  Current Capital Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-900 text-white flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-rose-900 tracking-tight">
                {formatCurrency(summary.currentCapitalBalance)}
              </p>
              <p className="text-[11px] font-bold text-rose-800">
                Remaining equity capital in organization
              </p>
            </div>

            {/* Card 5: Profit Share Earned */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Profit Share Earned
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-700 tracking-tight">
                {formatCurrency(summary.profitShareEarned)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Allocated profit share from deal collections
              </p>
            </div>

            {/* Card 6: Profit Share Paid */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Profit Share Paid
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-teal-700 tracking-tight">
                {formatCurrency(summary.profitSharePaid)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Profit share disbursed and verified
              </p>
            </div>

            {/* Card 7: Pending Profit Share */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pending Profit Share
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-700 tracking-tight">
                {formatCurrency(summary.pendingProfitShare)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Earned profit awaiting disbursement
              </p>
            </div>

            {/* Card 8: Total Amount Paid */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Amount Paid
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-800 tracking-tight">
                {formatCurrency(summary.totalAmountPaid)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Capital returned + Profit share paid
              </p>
            </div>

            {/* Card 9: Total Outstanding Payable */}
            <div className="bg-white p-5 rounded-2xl border-2 border-amber-600/30 shadow-xs space-y-2 bg-gradient-to-br from-amber-50/40 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Total Outstanding Payable
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-900 tracking-tight">
                {formatCurrency(summary.totalOutstandingPayable)}
              </p>
              <p className="text-[11px] font-bold text-amber-800">
                Current Capital Balance + Pending Profit
              </p>
            </div>
          </div>

          {/* ── PARTNER EQUITY & OWNERSHIP DETAILS ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-700" />
              Partner Equity & Capital Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Base Capital Contribution</span>
                <span className="text-base font-black text-slate-900 block mt-0.5">{formatCurrency(partner.capitalContribution)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Equity Ownership Share</span>
                <span className="text-base font-black text-rose-700 block mt-0.5">{partner.sharePercentage}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Active Capital in Deals</span>
                <span className="text-base font-black text-blue-700 block mt-0.5">{formatCurrency(summary.activeCapitalInDeals)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Active Deals Count</span>
                <span className="text-base font-black text-emerald-700 block mt-0.5">{summary.activeDealsCount} Deals</span>
              </div>
            </div>
          </div>

          {/* ── DETAILED STATEMENT SECTION TABS ── */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 no-print">
              {[
                { id: 'ledger', label: '1. Transaction Audit Ledger', count: transactions.length },
                { id: 'deals', label: '2. Deal-Wise Breakdown', count: sections.dealFundings?.length || 0 },
                { id: 'distributions', label: '3. Repayment Distributions', count: sections.repaymentDistributions?.length || 0 },
                { id: 'reconciliation', label: '4. Period Audit Reconciliation' },
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSectionTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeSectionTab === tab.id
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        activeSectionTab === tab.id
                          ? 'bg-rose-800 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB 1: MASTER TRANSACTION AUDIT LEDGER */}
            {activeSectionTab === 'ledger' && (
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Partner Transaction Audit Ledger
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Chronological ledger showing all capital additions, deployments, repayments, and running capital balance
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {transactions.length} Records
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    No transactions recorded for this partner in the selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Reference</th>
                          <th className="py-3 px-4">Transaction Type</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 text-right">Credit / Contribution</th>
                          <th className="py-3 px-4 text-right">Debit / Payment</th>
                          <th className="py-3 px-4 text-right">Capital Balance</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {transactions.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-medium whitespace-nowrap text-slate-900">
                              {formatDate(t.date)}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                              {t.reference}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.transactionType === 'INITIAL_CAPITAL'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : t.transactionType === 'DEAL_FUNDING'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : t.transactionType === 'REVERSAL'
                                    ? 'bg-red-50 text-red-800 border border-red-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {t.typeLabel}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600 max-w-xs truncate">
                              {t.description}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                              {t.credit > 0 ? formatCurrency(t.credit) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {t.debit > 0 ? formatCurrency(t.debit) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-rose-900">
                              {formatCurrency(t.balance)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={t.paymentStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DEAL-WISE BREAKDOWN */}
            {activeSectionTab === 'deals' && (
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Participating Deals & Capital Allocations
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Breakdown of loan deals funded by this partner with principal returned and profit share earned
                    </p>
                  </div>
                </div>

                {!sections.dealFundings || sections.dealFundings.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    No deals funded by this partner.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Deal Number</th>
                          <th className="py-3 px-4">Client Name</th>
                          <th className="py-3 px-4">Investment Date</th>
                          <th className="py-3 px-4 text-right">Partner Funded</th>
                          <th className="py-3 px-4 text-right">Equity Share %</th>
                          <th className="py-3 px-4 text-right">Principal Returned</th>
                          <th className="py-3 px-4 text-right">Profit Earned</th>
                          <th className="py-3 px-4 text-right">Remaining Principal</th>
                          <th className="py-3 px-4 text-center">Deal Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sections.dealFundings.map((d: any) => (
                          <tr key={d.fundingId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-rose-900">
                              <Link to={`/deals/${d.dealId}`} className="hover:underline">
                                {d.dealNumber}
                              </Link>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {d.clientName}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {formatDate(d.investmentDate)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900">
                              {formatCurrency(d.partnerAmount)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-700">
                              {d.sharePercentage}%
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                              {formatCurrency(d.principalReturned)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-700">
                              {formatCurrency(d.profitShareEarned)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-rose-900">
                              {formatCurrency(d.remainingPrincipal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={d.dealStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REPAYMENT DISTRIBUTIONS */}
            {activeSectionTab === 'distributions' && (
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Repayment Collections & Partner Distributions
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Itemized breakdown of payments received and waterfall splits distributed to this partner
                    </p>
                  </div>
                </div>

                {!sections.repaymentDistributions || sections.repaymentDistributions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    No distributions recorded for this partner in the selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Receipt #</th>
                          <th className="py-3 px-4">Deal Number</th>
                          <th className="py-3 px-4">Client Name</th>
                          <th className="py-3 px-4 text-right">Client Payment</th>
                          <th className="py-3 px-4 text-right">Principal Share</th>
                          <th className="py-3 px-4 text-right">Profit Share</th>
                          <th className="py-3 px-4 text-right">Total Payout</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sections.repaymentDistributions.map((r: any) => (
                          <tr key={r.returnId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-medium whitespace-nowrap text-slate-900">
                              {formatDate(r.date)}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {r.receiptNumber}
                            </td>
                            <td className="py-3 px-4 font-mono text-rose-800 font-semibold">
                              {r.dealNumber}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {r.clientName}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-500">
                              {formatCurrency(r.totalClientRepayment)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                              {formatCurrency(r.partnerPrincipalShare)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-700">
                              {formatCurrency(r.partnerProfitShare)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900">
                              {formatCurrency(r.partnerTotalPayout)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={r.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PERIOD AUDIT RECONCILIATION */}
            {activeSectionTab === 'reconciliation' && periodSummary && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Period Audit Reconciliation Summary
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Mathematical proof demonstrating opening balances + period activity = closing balances
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Opening */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">
                      A. Opening Balance (Prior to Period)
                    </span>
                    <div className="space-y-1.5 pt-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Capital Balance:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(periodSummary.opening.capitalBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active in Deals:</span>
                        <span className="font-bold">{formatCurrency(periodSummary.opening.activeInDeals)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Principal Returned:</span>
                        <span className="font-bold">{formatCurrency(periodSummary.opening.principalReturned)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Share Earned:</span>
                        <span className="font-bold">{formatCurrency(periodSummary.opening.profitShareEarned)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1">
                        <span className="font-bold">Total Disbursed:</span>
                        <span className="font-black text-rose-900">{formatCurrency(periodSummary.opening.totalAmountPaid)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Period Activity */}
                  <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                    <span className="font-bold text-rose-800 uppercase text-[10px] block">
                      B. Activity During Period
                    </span>
                    <div className="space-y-1.5 pt-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Capital Deployed:</span>
                        <span className="font-bold text-blue-700">+{formatCurrency(periodSummary.period.fundedToDeals)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Principal Returned:</span>
                        <span className="font-bold text-emerald-700">+{formatCurrency(periodSummary.period.principalReturned)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Share Earned:</span>
                        <span className="font-bold text-amber-700">+{formatCurrency(periodSummary.period.profitShareEarned)}</span>
                      </div>
                      <div className="flex justify-between border-t border-rose-200 pt-1">
                        <span className="font-bold">Total Payouts in Period:</span>
                        <span className="font-black text-rose-900">{formatCurrency(periodSummary.period.totalPayout)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Closing */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">
                      C. Closing Balance (A + B)
                    </span>
                    <div className="space-y-1.5 pt-1 text-slate-300">
                      <div className="flex justify-between">
                        <span>Capital Balance:</span>
                        <span className="font-bold text-white">{formatCurrency(periodSummary.closing.capitalBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active in Deals:</span>
                        <span className="font-bold text-white">{formatCurrency(periodSummary.closing.activeInDeals)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cumulative Returned:</span>
                        <span className="font-bold text-white">{formatCurrency(periodSummary.closing.principalReturned)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cumulative Profit:</span>
                        <span className="font-bold text-white">{formatCurrency(periodSummary.closing.profitShareEarned)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-1">
                        <span className="font-bold text-rose-300">Total Amount Paid:</span>
                        <span className="font-black text-rose-300">{formatCurrency(periodSummary.closing.totalAmountPaid)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Audit Reconciliation Passed: Opening Balance ({formatCurrency(periodSummary.opening.capitalBalance)}) - Period Returned ({formatCurrency(periodSummary.period.principalReturned)}) = Closing Capital Balance ({formatCurrency(periodSummary.closing.capitalBalance)}).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER & SIGNATURE SECTION (A4 Ready) ── */}
          <div className="pt-8 border-t border-slate-200 text-xs text-slate-500 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6">
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-900">Partner Signature</p>
                <p className="text-[11px] text-slate-400">{partner.name}</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-900">Managing Partner / Director</p>
                <p className="text-[11px] text-slate-400">{company.name || 'Authorized Signatory'}</p>
              </div>
              <div className="border-t border-slate-300 pt-2 hidden sm:block">
                <p className="font-bold text-slate-900">Verification Seal</p>
                <p className="text-[11px] text-slate-400">FinFlow ERP System Generated</p>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 pt-4">
              This statement is generated automatically by FinFlow Private Finance ERP (Product by MSR Solutions). All figures are subject to final statutory audit.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
