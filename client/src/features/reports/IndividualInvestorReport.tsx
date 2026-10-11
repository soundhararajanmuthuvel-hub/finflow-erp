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

export const IndividualInvestorReport: React.FC = () => {
  const { company } = useCompanyProfile();
  const reportRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
  const [investorSearch, setInvestorSearch] = useState<string>('');
  const [period, setPeriod] = useState<string>('all-time');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeSectionTab, setActiveSectionTab] = useState<
    'ledger' | 'deals' | 'collections' | 'payouts' | 'pending' | 'reconciliation'
  >('ledger');

  // Export State
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Fetch outside investors options for the dropdown
  const { data: investorsList, isLoading: isLoadingInvestors } = useQuery({
    queryKey: ['investor-options'],
    queryFn: async () => {
      const res: any = await apiClient.get('/reports/investor-options');
      return res.data || [];
    },
  });

  // Auto-select first investor if none selected
  React.useEffect(() => {
    if (!selectedInvestorId && investorsList && investorsList.length > 0) {
      setSelectedInvestorId(investorsList[0].id);
    }
  }, [investorsList, selectedInvestorId]);

  // Filtered investors for the dropdown search
  const filteredInvestors = useMemo(() => {
    if (!investorsList) return [];
    if (!investorSearch.trim()) return investorsList;
    const q = investorSearch.toLowerCase().trim();
    return investorsList.filter(
      (inv: any) =>
        inv.name?.toLowerCase().includes(q) ||
        inv.investorCode?.toLowerCase().includes(q) ||
        inv.phone?.includes(q) ||
        inv.pan?.toLowerCase().includes(q)
    );
  }, [investorsList, investorSearch]);

  // 2. Fetch Individual Investor Report data
  const {
    data: reportData,
    isLoading: isLoadingReport,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['individual-investor-report', selectedInvestorId, period, startDate, endDate],
    queryFn: async () => {
      if (!selectedInvestorId) return null;
      let url = `/reports/investor-statement/${selectedInvestorId}?period=${period}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res: any = await apiClient.get(url);
      return res.data;
    },
    enabled: !!selectedInvestorId,
  });

  const investor = reportData?.investor;
  const summary = reportData?.summary || {
    totalInvested: 0,
    principalReturned: 0,
    remainingPrincipal: 0,
    roiEarned: 0,
    roiPaid: 0,
    pendingRoi: 0,
    totalReturnPaid: 0,
    totalOutstandingPayable: 0,
    totalDealsParticipated: 0,
    activeDealsCount: 0,
  };
  const periodSummary = reportData?.periodSummary;
  const transactions = reportData?.periodTransactions || [];
  const sections = reportData?.sections || {};

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleExportJpg = async () => {
    if (!reportRef.current || !investor) return;
    try {
      setIsExportingJpg(true);
      const filename = `Investor_Report_${investor.investorCode}_${investor.name.replace(/\s+/g, '_')}_${period}.jpg`;
      await exportElementAsJpg(reportRef.current, filename, 2.5);
    } catch (err) {
      console.error('Failed to export JPG:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  const exportCSV = () => {
    if (!reportData || !investor) return;

    const lines: string[] = [];
    lines.push(`"${company.name || 'FinFlow ERP'} — Outside Investor Capital & Return Statement"`);
    lines.push(`"Investor Name","${investor.name}","Investor Code","${investor.investorCode}"`);
    lines.push(`"Phone","${investor.phone || '—'}","PAN","${investor.pan || '—'}"`);
    lines.push(`"Report Period","${reportData.period?.label || 'All-Time'}","Generated At","${new Date(reportData.generatedAt).toLocaleString('en-IN')}"`);
    lines.push('');

    // Summary KPIs
    lines.push('"PORTFOLIO KPI SUMMARY"');
    lines.push('"Total Invested","Principal Returned","Remaining Principal","ROI Earned","ROI Paid","Pending ROI","Total Return Paid","Total Outstanding Payable"');
    lines.push(
      `"${summary.totalInvested}","${summary.principalReturned}","${summary.remainingPrincipal}","${summary.roiEarned}","${summary.roiPaid}","${summary.pendingRoi}","${summary.totalReturnPaid}","${summary.totalOutstandingPayable}"`
    );
    lines.push('');

    // Transactions Table
    lines.push('"TRANSACTION AUDIT LEDGER"');
    lines.push('"Date","Reference / Receipt","Deal Number","Client Name","Transaction Type","Principal Allocated","ROI Earned","Principal Paid","ROI Paid","Total Amount","Status"');

    transactions.forEach((t: any) => {
      lines.push(
        `"${formatDate(t.date)}","${t.reference}","${t.dealNumber}","${t.clientName}","${t.typeLabel}","${t.principalAllocation}","${t.roiEarned}","${t.principalPaid}","${t.roiPaid}","${t.totalAmount}","${t.paymentStatus}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Investor_Report_${investor.investorCode}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyWhatsAppText = async () => {
    if (!reportData || !investor) return;

    const lines: string[] = [];
    lines.push(`*${(company.name || 'FINFLOW ERP').toUpperCase()}*`);
    lines.push(`*OUTSIDE INVESTOR CAPITAL & RETURN STATEMENT*`);
    lines.push('──────────────────────────────');
    lines.push(`👤 *Investor:* ${investor.name} (${investor.investorCode})`);
    if (investor.phone) lines.push(`📞 *Phone:* ${investor.phone}`);
    if (investor.pan) lines.push(`🆔 *PAN:* ${investor.pan}`);
    lines.push(`📅 *Period:* ${reportData.period?.label || 'All-Time'}`);
    lines.push(`🕒 *Generated:* ${new Date(reportData.generatedAt).toLocaleDateString('en-IN')}`);
    lines.push('──────────────────────────────');
    lines.push(`💼 *Total Invested:* ${formatCurrency(summary.totalInvested)}`);
    lines.push(`↩️ *Principal Returned:* ${formatCurrency(summary.principalReturned)}`);
    lines.push(`💰 *Remaining Principal:* ${formatCurrency(summary.remainingPrincipal)}`);
    lines.push(`📈 *ROI Earned:* ${formatCurrency(summary.roiEarned)}`);
    lines.push(`💸 *ROI Paid:* ${formatCurrency(summary.roiPaid)}`);
    lines.push(`⏳ *Pending ROI:* ${formatCurrency(summary.pendingRoi)}`);
    lines.push(`✅ *Total Return Paid:* ${formatCurrency(summary.totalReturnPaid)}`);
    lines.push(`🎯 *Total Outstanding Payable:* ${formatCurrency(summary.totalOutstandingPayable)}`);
    lines.push('──────────────────────────────');

    if (sections.dealFundings && sections.dealFundings.length > 0) {
      lines.push('*PARTICIPATING DEALS:*');
      sections.dealFundings.forEach((d: any, idx: number) => {
        lines.push(
          `${idx + 1}. Deal ${d.dealNumber} (${d.clientName}) — Invested: ${formatCurrency(d.investorAmount)} (${d.sharePercentage}%) | Principal Returned: ${formatCurrency(d.principalReturned)} | Status: ${d.dealStatus}`
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

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. INVESTOR SELECTOR & PERIOD CONTROLS (NO-PRINT) */}
      {/* ========================================================================= */}
      <AccessibleCard withTopAccent className="p-4 sm:p-5 no-print space-y-4">
        {/* Top Selection Row: Search & Investor Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Investor Dropdown */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              Select Outside Investor <span className="text-[#8B1A1A]">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                disabled={isLoadingInvestors}
                className="w-full bg-white border-2 border-stone-300 rounded-xl px-4 py-2.5 text-base font-bold text-purple-900 focus:outline-none focus:border-maroon-800 focus:ring-4 focus:ring-maroon-800/20 transition-all shadow-2xs"
              >
                {filteredInvestors.map((inv: any) => (
                  <option key={inv.id} value={inv.id}>
                    [{inv.investorCode}] {inv.name} {inv.pan ? `• PAN: ${inv.pan}` : ''} {inv.phone ? `• ${inv.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Investor Filter / Search Box */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              Search Investor by Name or Code
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={investorSearch}
                onChange={(e) => setInvestorSearch(e.target.value)}
                placeholder="Filter dropdown by name, code (e.g. INV-0001), or phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-maroon-800 focus:ring-4 focus:ring-maroon-800/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Period Selector Tabs & Date Range */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Period:
            </span>
            {[
              { id: 'all-time', label: 'All-Time Summary' },
              { id: 'this-week', label: 'This Week' },
              { id: 'previous-week', label: 'Previous Week' },
              { id: 'this-month', label: 'This Month' },
              { id: 'custom', label: 'Custom Date Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p.id
                    ? 'bg-[#8B1A1A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs & Refresh Button */}
          <div className="flex flex-wrap items-center gap-3">
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-900 bg-white"
                />
                <span className="text-xs text-slate-500 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-900 bg-white"
                />
              </div>
            )}

            <AccessibleButton
              variant="secondary"
              size="compact"
              icon={RefreshCw}
              isLoading={isFetching}
              onClick={() => refetch()}
            >
              Generate Report
            </AccessibleButton>
          </div>
        </div>

        {/* Report Action Buttons Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Company-level data isolation enforced • Showing only selected investor records</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AccessibleButton
              variant="outline"
              size="compact"
              icon={Copy}
              onClick={copyWhatsAppText}
            >
              {copySuccess ? 'Copied Text!' : 'Copy Text (WhatsApp)'}
            </AccessibleButton>

            <AccessibleButton
              variant="outline"
              size="compact"
              icon={Download}
              onClick={exportCSV}
              disabled={!transactions.length}
            >
              Download CSV
            </AccessibleButton>

            <AccessibleButton
              variant="outline"
              size="compact"
              icon={Image}
              onClick={handleExportJpg}
              disabled={isExportingJpg || !investor}
            >
              {isExportingJpg ? 'Rendering JPG...' : 'Export JPG'}
            </AccessibleButton>

            <AccessibleButton
              variant="primary"
              size="compact"
              icon={Printer}
              onClick={handlePrint}
              disabled={!investor}
            >
              Print / PDF
            </AccessibleButton>
          </div>
        </div>
      </AccessibleCard>

      {/* ========================================================================= */}
      {/* 2. REPORT CONTENT CONTAINER (PRINTABLE / EXPORTABLE) */}
      {/* ========================================================================= */}
      <div
        ref={reportRef}
        className="bg-white rounded-2xl border-2 border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:p-0 print:shadow-none"
      >
        {/* 2.1 Company Header / Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-stone-900 pb-5">
          <div className="space-y-1">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-12 w-auto object-contain mb-2"
              />
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none">
              {company.name}
            </h1>
            {company.legalName && (
              <p className="text-sm text-stone-600 font-semibold">{company.legalName}</p>
            )}
            {[company.address, company.city, company.state, company.pincode].filter((p) =>
              String(p || '').trim()
            ).length > 0 && (
              <p className="text-xs sm:text-sm text-stone-600 max-w-md leading-relaxed">
                {[company.address, company.city, company.state, company.pincode]
                  .filter((p) => String(p || '').trim())
                  .join(', ')}
              </p>
            )}
            {(company.pan || company.gstin) && (
              <p className="text-xs font-mono font-bold text-stone-500 pt-0.5">
                {company.pan && <span>PAN: {company.pan} </span>}
                {company.gstin && <span>• GSTIN: {company.gstin}</span>}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1 text-xs sm:text-sm text-stone-600">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 mb-1">
              Confidential Investor Statement
            </span>
            {company.phone && (
              <p className="font-semibold text-stone-900">
                Phone: <span className="font-normal text-stone-600">{company.phone}</span>
              </p>
            )}
            {company.email && (
              <p className="font-semibold text-stone-900">
                Email: <span className="font-normal text-stone-600">{company.email}</span>
              </p>
            )}
            <p className="text-xs text-stone-500 font-medium pt-1">
              Report Generated: {reportData ? new Date(reportData.generatedAt).toLocaleString('en-IN') : '—'}
            </p>
          </div>
        </div>

        {/* 2.2 Document Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-stone-100 rounded-xl border border-stone-300">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
              Outside Investor Capital & Return Report
            </h2>
            <p className="text-xs font-semibold text-stone-600 mt-0.5">
              Individual statement of capital deployed, client collection distributions, and outstanding balances
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Reporting Period
            </span>
            <span className="text-sm font-extrabold text-[#8B1A1A]">
              {reportData?.period?.label || 'All-Time Investment Summary'}
            </span>
          </div>
        </div>

        {isLoadingReport ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-10 w-10 border-4 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full animate-spin mx-auto" />
            <p className="text-base font-bold text-slate-700">Loading dedicated investor report...</p>
          </div>
        ) : !investor ? (
          <AccessibleEmptyState
            icon={User}
            title="No Investor Selected"
            description="Please choose an investor from the dropdown above to display their financial statement."
          />
        ) : (
          <>
            {/* 2.3 Investor Profile Strip */}
            <div className="p-4 sm:p-5 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#F3E8FF] text-[#6B21A8] border-2 border-[#D8B4FE] flex items-center justify-center font-black text-lg shrink-0">
                    <TrendingUp className="h-5 w-5 stroke-[2.3]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">{investor.name}</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white border border-purple-300 text-[#6B21A8] font-bold">
                        {investor.investorCode}
                      </span>
                      <StatusBadge status={investor.status || 'ACTIVE'} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                      {investor.phone && (
                        <span className="flex items-center gap-1 font-medium">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {investor.phone}
                        </span>
                      )}
                      {investor.email && (
                        <span className="flex items-center gap-1 font-medium">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {investor.email}
                        </span>
                      )}
                      {investor.pan && (
                        <span className="font-mono font-bold text-slate-700">
                          PAN: {investor.pan}
                        </span>
                      )}
                      {investor.address && (
                        <span className="text-slate-500">Address: {investor.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="p-2.5 rounded-lg bg-white border border-purple-200 text-xs">
                  <span className="font-bold text-slate-700 block">Payout Bank Account</span>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {investor.bankName || 'Bank Not Configured'}
                  </p>
                  <p className="font-mono text-slate-500 text-2xs mt-0.5">
                    A/C: {investor.bankAccountNo || '—'} • IFSC: {investor.ifscCode || '—'}
                  </p>
                </div>
              </div>

              {/* Linked Deals Chips */}
              <div className="pt-2 border-t border-purple-200/60 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-purple-700" /> Linked Deals ({sections.dealFundings?.length || 0}):
                </span>
                {sections.dealFundings && sections.dealFundings.length > 0 ? (
                  sections.dealFundings.map((d: any) => (
                    <Link
                      key={d.fundingId}
                      to={`/deals/${d.dealId}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-purple-200 hover:border-purple-400 text-purple-950 font-bold transition-colors no-print"
                      title={`View Deal ${d.dealNumber} - ${d.clientName}`}
                    >
                      <span>{d.dealNumber}</span>
                      <span className="text-2xs font-normal text-slate-500">
                        ({formatCurrency(d.investorAmount)})
                      </span>
                    </Link>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">No linked finance deals</span>
                )}
              </div>
            </div>

            {/* 2.4 Eight Summary KPI Cards (Strict mathematical accuracy) */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Financial Summary Cards
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Invested */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-purple-50/80 border border-purple-200">
                  <span className="text-xs font-bold text-purple-900 block">Total Invested</span>
                  <p className="text-lg sm:text-xl font-black text-purple-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.totalInvested)}
                  </p>
                  <span className="text-2xs font-medium text-purple-700/80 block mt-0.5">
                    Total capital deployed
                  </span>
                </div>

                {/* 2. Principal Returned */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-900 block">Principal Returned</span>
                  <p className="text-lg sm:text-xl font-black text-emerald-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.principalReturned)}
                  </p>
                  <span className="text-2xs font-medium text-emerald-700/80 block mt-0.5">
                    Recovered capital
                  </span>
                </div>

                {/* 3. Remaining Principal */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 block">Remaining Principal</span>
                  <p className="text-lg sm:text-xl font-black text-amber-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.remainingPrincipal)}
                  </p>
                  <span className="text-2xs font-medium text-amber-700/80 block mt-0.5">
                    Principal still at work
                  </span>
                </div>

                {/* 4. ROI Earned */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-900 block">ROI Earned</span>
                  <p className="text-lg sm:text-xl font-black text-emerald-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.roiEarned)}
                  </p>
                  <span className="text-2xs font-medium text-emerald-700/80 block mt-0.5">
                    Profit distributed to date
                  </span>
                </div>

                {/* 5. ROI Paid */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                  <span className="text-xs font-bold text-blue-900 block">ROI Paid</span>
                  <p className="text-lg sm:text-xl font-black text-blue-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.roiPaid)}
                  </p>
                  <span className="text-2xs font-medium text-blue-700/80 block mt-0.5">
                    Verified ROI disbursed
                  </span>
                </div>

                {/* 6. Pending ROI */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50/80 border border-rose-200">
                  <span className="text-xs font-bold text-rose-900 block">Pending ROI</span>
                  <p className="text-lg sm:text-xl font-black text-rose-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.pendingRoi)}
                  </p>
                  <span className="text-2xs font-medium text-rose-700/80 block mt-0.5">
                    Contracted ROI awaiting collection
                  </span>
                </div>

                {/* 7. Total Return Paid */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-teal-50/80 border border-teal-200">
                  <span className="text-xs font-bold text-teal-900 block">Total Return Paid</span>
                  <p className="text-lg sm:text-xl font-black text-teal-800 mt-1 whitespace-nowrap">
                    {formatCurrency(summary.totalReturnPaid)}
                  </p>
                  <span className="text-2xs font-medium text-teal-700/80 block mt-0.5">
                    Principal + ROI disbursed
                  </span>
                </div>

                {/* 8. Total Outstanding Payable */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-stone-100 border-2 border-stone-300">
                  <span className="text-xs font-black text-[#8B1A1A] block">Total Outstanding Payable</span>
                  <p className="text-lg sm:text-xl font-black text-[#8B1A1A] mt-1 whitespace-nowrap">
                    {formatCurrency(summary.totalOutstandingPayable)}
                  </p>
                  <span className="text-2xs font-semibold text-stone-600 block mt-0.5">
                    Remaining Principal + Pending ROI
                  </span>
                </div>
              </div>
            </div>

            {/* 2.5 Weekly / Period Reconciliation Box (if weekly or period filter active) */}
            {periodSummary && period !== 'all-time' && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-300 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#8B1A1A]" />
                    {reportData.period?.label} — Movement & Balance Reconciliation
                  </span>
                  <span className="font-mono text-2xs text-stone-500">
                    Exact Period Accounting
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Opening Balance */}
                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Opening Balance</span>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>Invested Prior:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(periodSummary.opening.invested)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Principal Returned Prior:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatCurrency(periodSummary.opening.principalReturned)}</span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-100">
                      <span>Opening Remaining Principal:</span>
                      <span className="font-mono font-bold text-amber-800">{formatCurrency(periodSummary.opening.remainingPrincipal)}</span>
                    </div>
                  </div>

                  {/* Period Activity */}
                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-[#8B1A1A] block">Period Movements</span>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>New Capital Added:</span>
                      <span className="font-mono font-bold text-purple-700">+{formatCurrency(periodSummary.period.invested)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Principal Returned:</span>
                      <span className="font-mono font-bold text-emerald-700">-{formatCurrency(periodSummary.period.principalReturned)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ROI Earned:</span>
                      <span className="font-mono font-bold text-emerald-700">+{formatCurrency(periodSummary.period.roiEarned)}</span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-100">
                      <span>Total Payout Distributed:</span>
                      <span className="font-mono font-bold text-teal-800">{formatCurrency(periodSummary.period.totalPayout)}</span>
                    </div>
                  </div>

                  {/* Closing Balance */}
                  <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Closing Balance</span>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>Closing Remaining Principal:</span>
                      <span className="font-mono font-bold text-amber-800">{formatCurrency(periodSummary.closing.remainingPrincipal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Closing Pending ROI:</span>
                      <span className="font-mono font-bold text-rose-800">{formatCurrency(periodSummary.closing.pendingRoi)}</span>
                    </div>
                    <div className="flex justify-between text-stone-900 font-black pt-1 border-t border-stone-200">
                      <span>Closing Outstanding Payable:</span>
                      <span className="font-mono text-[#8B1A1A]">{formatCurrency(periodSummary.closing.totalOutstandingPayable)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2.6 Section Navigation Bar (No-Print) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200 no-print">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                View Section:
              </span>
              {[
                { id: 'ledger', label: `Master Ledger (${transactions.length})` },
                { id: 'deals', label: `1. Deal Participations (${sections.dealFundings?.length || 0})` },
                { id: 'collections', label: `2. Collections Allocated (${sections.clientCollections?.length || 0})` },
                { id: 'payouts', label: `3. Payouts Disbursed (${sections.investorPayouts?.length || 0})` },
                { id: 'pending', label: `4. Pending Returns (${sections.pendingReturns?.length || 0})` },
                { id: 'reconciliation', label: '5. Reconciliation Statement' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSectionTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSectionTab === tab.id
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===================================================================== */}
            {/* 2.7 SECTION CONTENT TABLES */}
            {/* ===================================================================== */}

            {/* SECTION A: MASTER TRANSACTION LEDGER */}
            {(activeSectionTab === 'ledger' || window.matchMedia('print').matches) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-[#8B1A1A]" />
                    Master Transaction Audit Ledger
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    Total Transactions: {transactions.length}
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <AccessibleEmptyState
                    icon={FileSpreadsheet}
                    title="No Transactions Found"
                    description={`No financial activity recorded for ${investor.name} during the chosen period.`}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Reference / Receipt</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Deal #</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Client</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Transaction Type</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Principal Alloc</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">ROI Earned</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Principal Paid</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">ROI Paid</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Total Amount</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {transactions.map((t: any) => (
                          <tr
                            key={t.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              t.isReversed ? 'bg-rose-50/40 text-slate-400' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                              {formatDate(t.date)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-slate-700">
                              {t.reference}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-[#8B1A1A]">
                              {t.dealNumber}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-900">
                              {t.clientName}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-2xs font-bold ${
                                  t.transactionType === 'INVESTMENT_DEPLOYED'
                                    ? 'bg-purple-100 text-purple-900'
                                    : t.isReversed
                                    ? 'bg-rose-100 text-rose-800 line-through'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {t.typeLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                              {t.principalAllocation !== 0 ? formatCurrency(t.principalAllocation) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {t.roiEarned !== 0 ? formatCurrency(t.roiEarned) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                              {t.principalPaid !== 0 ? formatCurrency(t.principalPaid) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                              {t.roiPaid !== 0 ? formatCurrency(t.roiPaid) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                              {formatCurrency(t.totalAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <StatusBadge status={t.paymentStatus} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 1: INVESTMENT & FUNDING DETAILS */}
            {(activeSectionTab === 'deals' || window.matchMedia('print').matches) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-700" />
                    Section 1: Investment & Funding Details
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    Deals Participated: {sections.dealFundings?.length || 0}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-purple-50/70 text-purple-950 font-bold text-xs uppercase border-b border-purple-200">
                      <tr>
                        <th className="py-2.5 px-3">Deal #</th>
                        <th className="py-2.5 px-3">Client Name</th>
                        <th className="py-2.5 px-3 text-right">Deal Approved</th>
                        <th className="py-2.5 px-3 text-right">Investor Capital</th>
                        <th className="py-2.5 px-3 text-right">Share %</th>
                        <th className="py-2.5 px-3 text-right">Expected ROI</th>
                        <th className="py-2.5 px-3 text-right">Principal Ret.</th>
                        <th className="py-2.5 px-3 text-right">Remaining Princ.</th>
                        <th className="py-2.5 px-3 text-right">Pending ROI</th>
                        <th className="py-2.5 px-3 text-center">Deal Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sections.dealFundings?.map((d: any) => (
                        <tr key={d.fundingId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#8B1A1A] whitespace-nowrap">
                            <Link to={`/deals/${d.dealId}`} className="hover:underline">
                              {d.dealNumber}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {d.clientName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatCurrency(d.dealApprovedAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900 whitespace-nowrap">
                            {formatCurrency(d.investorAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {d.sharePercentage.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {formatCurrency(d.expectedROI)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {formatCurrency(d.principalReturned)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                            {formatCurrency(d.remainingPrincipal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                            {formatCurrency(d.pendingROI)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <StatusBadge status={d.dealStatus} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 2: CLIENT COLLECTIONS ALLOCATED */}
            {(activeSectionTab === 'collections' || window.matchMedia('print').matches) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                    Section 2: Client Collections Allocated to Investor
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    Collections Distributed: {sections.clientCollections?.length || 0}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-emerald-50/70 text-emerald-950 font-bold text-xs uppercase border-b border-emerald-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Deal #</th>
                        <th className="py-2.5 px-3">Client Name</th>
                        <th className="py-2.5 px-3 text-right">Client Repaid</th>
                        <th className="py-2.5 px-3 text-right">Investor Principal</th>
                        <th className="py-2.5 px-3 text-right">Investor ROI</th>
                        <th className="py-2.5 px-3 text-right">Total Allocated</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sections.clientCollections?.map((c: any) => (
                        <tr
                          key={c.returnId}
                          className={`hover:bg-slate-50 transition-colors ${
                            c.isReversed ? 'bg-rose-50/40 text-slate-400' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                            {formatDate(c.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                            {c.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-[#8B1A1A]">
                            {c.dealNumber}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-900">
                            {c.clientName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatCurrency(c.totalClientRepayment)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {formatCurrency(c.investorPrincipalShare)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {formatCurrency(c.investorROIShare)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(c.investorTotalSplit)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <StatusBadge status={c.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 3: INVESTOR PAYMENTS ACTUALLY SENT */}
            {(activeSectionTab === 'payouts' || window.matchMedia('print').matches) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-700" />
                    Section 3: Investor Return Payments Disbursed
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    Disbursements: {sections.investorPayouts?.length || 0}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-blue-50/70 text-blue-950 font-bold text-xs uppercase border-b border-blue-200">
                      <tr>
                        <th className="py-2.5 px-3">Payout Date</th>
                        <th className="py-2.5 px-3">Receipt / Ref</th>
                        <th className="py-2.5 px-3">Deal #</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Payment Method</th>
                        <th className="py-2.5 px-3 text-right">Principal Disbursed</th>
                        <th className="py-2.5 px-3 text-right">ROI Disbursed</th>
                        <th className="py-2.5 px-3 text-right">Net Paid to Investor</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sections.investorPayouts?.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                            {formatDate(p.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                            {p.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-[#8B1A1A]">
                            {p.dealNumber}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-900">
                            {p.clientName}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-xs font-semibold text-slate-700">
                            {p.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {formatCurrency(p.principalPaid)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                            {formatCurrency(p.roiPaid)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(p.totalPaid)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <StatusBadge status={p.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 4: PENDING INVESTOR RETURNS */}
            {(activeSectionTab === 'pending' || window.matchMedia('print').matches) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-700" />
                    Section 4: Pending Investor Returns & Active Exposure
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    Active Deals: {sections.pendingReturns?.length || 0}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-amber-50/70 text-amber-950 font-bold text-xs uppercase border-b border-amber-200">
                      <tr>
                        <th className="py-2.5 px-3">Deal #</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3 text-right">Invested</th>
                        <th className="py-2.5 px-3 text-right">Principal Ret.</th>
                        <th className="py-2.5 px-3 text-right">Remaining Principal</th>
                        <th className="py-2.5 px-3 text-right">Expected ROI</th>
                        <th className="py-2.5 px-3 text-right">ROI Received</th>
                        <th className="py-2.5 px-3 text-right">Pending ROI</th>
                        <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sections.pendingReturns?.map((p: any) => (
                        <tr key={p.dealId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#8B1A1A] whitespace-nowrap">
                            {p.dealNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {p.clientName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                            {formatCurrency(p.investedAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-800 whitespace-nowrap">
                            {formatCurrency(p.principalReturned)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                            {formatCurrency(p.remainingPrincipal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatCurrency(p.expectedROI)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 whitespace-nowrap">
                            {formatCurrency(p.roiEarned)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                            {formatCurrency(p.pendingROI)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-[#8B1A1A] whitespace-nowrap">
                            {formatCurrency(p.totalOutstandingPayable)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <StatusBadge status={p.dealStatus} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 5: CLOSING BALANCE & AUDIT RECONCILIATION */}
            {(activeSectionTab === 'reconciliation' || window.matchMedia('print').matches) && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-700" />
                  Section 5: Closing Balance & Period Audit Reconciliation
                </h4>

                <div className="rounded-xl border border-stone-300 bg-stone-50 p-5 space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Principal Reconciliation */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-stone-200">
                      <h5 className="font-bold text-stone-900 text-sm border-b pb-1.5 border-stone-100">
                        Principal Balance Proof
                      </h5>
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>Total Invested Capital Deployed:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.totalInvested)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>Less: Principal Returned to Investor:</span>
                        <span className="font-mono font-bold text-emerald-700">-{formatCurrency(summary.principalReturned)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-stone-900 font-bold border-t border-stone-200">
                        <span>Remaining Capital at Risk:</span>
                        <span className="font-mono font-black text-amber-800">{formatCurrency(summary.remainingPrincipal)}</span>
                      </div>
                    </div>

                    {/* ROI & Total Payable Reconciliation */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-stone-200">
                      <h5 className="font-bold text-stone-900 text-sm border-b pb-1.5 border-stone-100">
                        Return & Payable Proof
                      </h5>
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>Remaining Capital Balance:</span>
                        <span className="font-mono font-bold text-amber-800">{formatCurrency(summary.remainingPrincipal)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>Plus: Pending Contracted ROI:</span>
                        <span className="font-mono font-bold text-rose-800">+{formatCurrency(summary.pendingRoi)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-stone-900 font-bold border-t border-stone-200">
                        <span>Total Outstanding Payable to Investor:</span>
                        <span className="font-mono font-black text-[#8B1A1A]">{formatCurrency(summary.totalOutstandingPayable)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Formal Signoff Strip */}
                  <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-500">
                    <p>
                      Statement generated under FinFlow ERP dual-entry syndicate ledger. Confidential and privileged to {investor.name}.
                    </p>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-bold text-stone-700">Authorized Signatory</span>
                      <p className="text-stone-400 font-mono mt-0.5">FinFlow Audit System</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IndividualInvestorReport;
