import React, { useRef, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { exportElementAsJpg } from '../../services/documents/imageExporter';
import { generateInvestorWhatsAppText } from '../../services/documents/textExporter';
import { Printer, Download, Image, Copy, CheckCircle2, TrendingUp, User, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface InvestorStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: any;
  preselectedInvestorId?: string;
}

export const InvestorStatementModal: React.FC<InvestorStatementModalProps> = ({
  isOpen,
  onClose,
  deal,
  preselectedInvestorId,
}) => {
  const { company } = useCompanyProfile();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState(preselectedInvestorId || '');
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!deal) return null;

  const investorFundings = deal.fundings?.filter((f: any) => f.sourceType === 'OUTSIDE_INVESTOR') || [];

  // Active investor funding
  const activeFunding =
    investorFundings.find((f: any) => f.investorId === (selectedInvestorId || preselectedInvestorId)) ||
    investorFundings[0];

  const currentInvestor = activeFunding?.investor;
  const investedAmount = Number(activeFunding?.amount || 0);
  const sharePercentage = Number(activeFunding?.percentage || 0);
  const principalReturned = Number(activeFunding?.principalReturned || 0);
  const interestEarned = Number(activeFunding?.interestEarned || 0);
  const totalReceived = principalReturned + interestEarned;
  const pendingPrincipal = Math.max(0, investedAmount - principalReturned);

  // Calculate expected total interest return based on share of total interest
  const dealTotalInterest = Number(deal.totalInterest || 0);
  const expectedInterestReturn = (dealTotalInterest * sharePercentage) / 100;
  const expectedTotalReturn = investedAmount + expectedInterestReturn;
  const totalPending = Math.max(0, expectedTotalReturn - totalReceived);

  // Map schedules to investor's pro-rata share
  const investorSchedules = (deal.schedules || []).map((sch: any) => {
    const clientPrincipal = Number(sch.principalAmount || 0);
    const clientInterest = Number(sch.interestAmount || 0);
    const clientTotal = Number(sch.totalDue || 0);

    const investorPrincipal = (clientPrincipal * sharePercentage) / 100;
    const investorInterest = (clientInterest * sharePercentage) / 100;
    const investorShare = investorPrincipal + investorInterest;

    return {
      installmentNumber: sch.installmentNumber,
      dueDate: sch.dueDate,
      clientTotal,
      investorPrincipal,
      investorInterest,
      investorShare,
      status: sch.status,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportJpg = async () => {
    if (!printRef.current) return;
    try {
      setIsExportingJpg(true);
      const investorNameClean = currentInvestor?.name?.replace(/\s+/g, '_') || 'Investor';
      const filename = `Investor_Statement_${deal.dealNumber}_${investorNameClean}.jpg`;
      await exportElementAsJpg(printRef.current, filename, 2.5);
    } catch (err) {
      console.error('Failed to export JPG:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleCopyText = async () => {
    const text = generateInvestorWhatsAppText({
      investorName: currentInvestor?.name || 'Investor',
      clientName: deal.client?.fullName || 'Client',
      dealNumber: deal.dealNumber,
      clientFinanceAmount: Number(deal.financeAmountApproved || 0),
      investorInvestment: investedAmount,
      investorSharePct: sharePercentage,
      expectedPrincipalReturn: investedAmount,
      expectedInterest: expectedInterestReturn,
      expectedTotalReturn,
      totalReceived,
      pendingBalance: totalPending,
      schedules: investorSchedules,
    });

    await navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Investor Payment Statement"
      subtitle="Confidential investor statement showing deal syndication returns & payment schedule"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase">Select Investor:</span>
            <select
              value={activeFunding?.investorId || ''}
              onChange={(e) => setSelectedInvestorId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
            >
              {investorFundings.map((f: any) => (
                <option key={f.id} value={f.investorId}>
                  {f.investor?.name || 'Investor'} ({Number(f.percentage).toFixed(1)}% • {formatCurrency(f.amount)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedSuccess ? 'Copied to Clipboard!' : 'Copy Text (WhatsApp)'}</span>
            </button>

            <button
              onClick={handleExportJpg}
              disabled={isExportingJpg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
            >
              <Image className="h-3.5 w-3.5" />
              <span>{isExportingJpg ? 'Rendering JPG...' : 'Download JPG'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE / EXPORTABLE A4 INVESTOR STATEMENT CONTAINER */}
        {/* ========================================================================= */}
        <div
          ref={printRef}
          className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none"
        >
          {/* 1. FinFlow Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <img
                  src="/brand/apple-touch-icon.png"
                  alt="FinFlow Official Logo"
                  className="h-11 w-11 rounded-xl object-contain shadow-sm bg-[#072661] p-0.5 border border-slate-700/60"
                />
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">FINFLOW</h1>
                  <p className="text-[11px] text-emerald-700 uppercase tracking-wider font-bold mt-0.5">Private Finance Management</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium pt-1">
                Managed under: <span className="font-bold text-slate-900">{company.name}</span>
              </p>
            </div>

            <div className="sm:text-right space-y-1 text-xs text-slate-600">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wider">
                Confidential Investor Statement
              </span>
              <p className="text-slate-500 text-[11px] pt-1">Generated: {formatDate(new Date())}</p>
            </div>
          </div>

          {/* 2. Document Title */}
          <div className="text-center py-2.5 bg-slate-900 rounded-xl text-white">
            <h2 className="text-base font-black tracking-widest uppercase">
              INVESTOR PAYMENT STATEMENT
            </h2>
          </div>

          {/* 3. Investor & Connected Client Deal Details Grid (Requirements 9, 10, 12) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Investor Name</span>
              <p className="text-sm font-black text-purple-900 mt-0.5">{currentInvestor?.name || 'Outside Investor'}</p>
              <p className="text-[11px] text-slate-600 font-mono">{currentInvestor?.investorCode || 'INV'}</p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Connected Client Name</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">{deal.client?.fullName}</p>
              <p className="text-[11px] text-slate-600 font-mono">Deal #{deal.dealNumber}</p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Total Client Finance</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(deal.financeAmountApproved)}</p>
              <p className="text-[11px] text-slate-600">Started: {formatDate(deal.startDate)}</p>
            </div>

            <div>
              <span className="text-purple-700 font-bold uppercase text-[10px] block">Investor Investment</span>
              <p className="text-sm font-black text-purple-900 mt-0.5">{formatCurrency(investedAmount)}</p>
              <p className="text-[11px] font-bold text-purple-700">{sharePercentage.toFixed(2)}% Syndicate Share</p>
            </div>
          </div>

          {/* 4. Financial Returns Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-center">
            <div>
              <span className="text-slate-600 font-bold uppercase text-[10px]">Expected Principal</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrency(investedAmount)}</p>
            </div>
            <div>
              <span className="text-purple-800 font-bold uppercase text-[10px]">Expected Interest Return</span>
              <p className="font-bold text-purple-900 text-sm mt-0.5">{formatCurrency(expectedInterestReturn)}</p>
            </div>
            <div>
              <span className="text-emerald-800 font-bold uppercase text-[10px]">Total Settled Payout</span>
              <p className="font-bold text-emerald-800 text-sm mt-0.5">{formatCurrency(totalReceived)}</p>
            </div>
            <div>
              <span className="text-amber-800 font-bold uppercase text-[10px]">Pending Balance</span>
              <p className="font-bold text-amber-800 text-sm mt-0.5">{formatCurrency(totalPending)}</p>
            </div>
          </div>

          {/* 5. Investor Repayment Schedule Table (Requirement 11) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                  <th className="p-3">No.</th>
                  <th className="p-3">Client Due Date</th>
                  <th className="p-3 text-right">Client Collection (₹)</th>
                  <th className="p-3 text-right">Investor Principal (₹)</th>
                  <th className="p-3 text-right">Investor Profit / ROI (₹)</th>
                  <th className="p-3 text-right">Total Investor Return (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {investorSchedules.map((sch: any) => (
                  <tr key={sch.installmentNumber} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700">#{sch.installmentNumber}</td>
                    <td className="p-3 font-medium text-slate-800">{formatDate(sch.dueDate)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(sch.clientTotal)}</td>
                    <td className="p-3 text-right font-mono font-medium text-slate-800">{formatCurrency(sch.investorPrincipal)}</td>
                    <td className="p-3 text-right font-mono font-medium text-purple-900">{formatCurrency(sch.investorInterest)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(sch.investorShare)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sch.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sch.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 6. Confidentiality Notice & Legal Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800">Confidential Statement for {currentInvestor?.name}</p>
              <p className="text-[11px]">Strictly private. Contains confidential financial information for the named investor only.</p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-slate-700">Product by <span className="font-black text-slate-900">MSR Solutions</span></p>
              <p className="text-[10px]">FinFlow — Private Finance Management</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
