import React, { useRef, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { exportElementAsJpg } from '../../services/documents/imageExporter';
import { Printer, Download, Image, CheckCircle2, AlertCircle, Building, FileText } from 'lucide-react';

interface ClientPaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: any;
}

export const ClientPaymentScheduleModal: React.FC<ClientPaymentScheduleModalProps> = ({
  isOpen,
  onClose,
  deal,
}) => {
  const { company } = useCompanyProfile();
  const printRef = useRef<HTMLDivElement>(null);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!deal) return null;

  const principalRepaid = Number(deal.totalPrincipalRepaid || 0);
  const interestRepaid = Number(deal.totalInterestRepaid || 0);
  const totalPaid = principalRepaid + interestRepaid;
  const totalPayable = Number(deal.totalPayable || 0);
  const outstanding = Math.max(0, totalPayable - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJpg = async () => {
    if (!printRef.current) return;
    try {
      setIsExportingJpg(true);
      const filename = `Client_Payment_Schedule_${deal.dealNumber}_${deal.client?.fullName?.replace(/\s+/g, '_')}.jpg`;
      await exportElementAsJpg(printRef.current, filename, 2.5);
    } catch (err) {
      console.error('Failed to export JPG:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Payment Schedule"
      subtitle="Company-branded repayment schedule for client handover"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Client-Facing Document</span>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              Investor details excluded
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJpg}
              disabled={isExportingJpg}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
            >
              <Image className="h-3.5 w-3.5" />
              <span>{isExportingJpg ? 'Rendering JPG...' : 'Download JPG'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE / EXPORTABLE A4 LETTERHEAD DOCUMENT CONTAINER */}
        {/* ========================================================================= */}
        <div
          ref={printRef}
          className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none"
        >
          {/* 1. Letterhead Header (Dynamic Company Profile) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
            <div className="space-y-1">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-12 w-auto object-contain mb-2" />
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/brand/apple-touch-icon.png"
                    alt="FinFlow Mark"
                    className="h-10 w-10 rounded-xl object-contain bg-[#072661] p-0.5 border border-slate-300"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">FinFlow Letterhead</span>
                </div>
              )}
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{company.name}</h1>
              {company.legalName && (
                <p className="text-xs text-slate-600 font-semibold">{company.legalName}</p>
              )}
              <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                {company.address ? `${company.address}, ` : ''}{company.city ? `${company.city}, ` : ''}{company.state} {company.pincode}
              </p>
            </div>

            <div className="sm:text-right space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-900">Phone: <span className="font-normal">{company.phone || 'N/A'}</span></p>
              <p className="font-bold text-slate-900">Email: <span className="font-normal">{company.email || 'N/A'}</span></p>
              {company.website && <p className="font-bold text-slate-900">Web: <span className="font-normal">{company.website}</span></p>}
            </div>
          </div>

          {/* 2. Document Title */}
          <div className="text-center py-2 bg-slate-100 rounded-xl border border-slate-200">
            <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">
              CLIENT PAYMENT SCHEDULE
            </h2>
          </div>

          {/* 3. Deal & Client Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Client Name</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">{deal.client?.fullName}</p>
              <p className="text-[11px] text-slate-600">{deal.client?.businessName || deal.client?.phone}</p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Finance Deal No.</span>
              <p className="text-sm font-mono font-black text-slate-900 mt-0.5">{deal.dealNumber}</p>
              <p className="text-[11px] text-slate-600">Status: <span className="font-bold">{deal.status}</span></p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Finance Amount</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(deal.financeAmountApproved)}</p>
              <p className="text-[11px] text-slate-600">Start Date: {formatDate(deal.startDate)}</p>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Repayment Frequency</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 uppercase">{deal.repaymentFrequency}</p>
              <p className="text-[11px] text-slate-600">{deal.numberOfRepayments} Installments</p>
            </div>
          </div>

          {/* 4. Payment Schedule Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                  <th className="p-3">No.</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Principal (₹)</th>
                  <th className="p-3 text-right">Interest / Charges (₹)</th>
                  <th className="p-3 text-right">Total Due (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deal.schedules?.map((sch: any) => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700">#{sch.installmentNumber}</td>
                    <td className="p-3 font-medium text-slate-800">{formatDate(sch.dueDate)}</td>
                    <td className="p-3 text-right font-mono font-medium text-slate-800">{formatCurrency(sch.principalAmount)}</td>
                    <td className="p-3 text-right font-mono font-medium text-slate-800">{formatCurrency(sch.interestAmount)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(sch.totalDue)}</td>
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

          {/* 5. Summary Financial Totals at Bottom */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-center">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Total Finance</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrency(deal.financeAmountApproved)}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Total Interest</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrency(deal.totalInterest)}</p>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Total Payable</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrency(deal.totalPayable)}</p>
            </div>
            <div>
              <span className="text-emerald-700 font-bold uppercase text-[10px]">Amount Paid</span>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <span className="text-rose-700 font-bold uppercase text-[10px]">Outstanding</span>
              <p className="font-bold text-rose-700 text-sm mt-0.5">{formatCurrency(outstanding)}</p>
            </div>
          </div>

          {/* 6. Legal Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800">{company.name}</p>
              <p className="text-[11px]">This is an authorized computer-generated repayment schedule.</p>
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
