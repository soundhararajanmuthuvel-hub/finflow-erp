import React, { useRef, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useCompanyProfile } from '../../context/CompanyProfileContext';
import { exportElementAsJpg } from '../../services/documents/imageExporter';
import { Printer, Download, Image, CheckCircle2, AlertCircle, Building, FileText } from 'lucide-react';
import { AccessibleButton, AccessibleCard } from '../../components/common/AccessibleComponents';

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
        <AccessibleCard className="flex flex-wrap items-center justify-between gap-4 p-4 bg-stone-50 border-2 border-stone-200">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-maroon-800" />
            <span className="text-base font-bold text-stone-900">Client-Facing Document</span>
            <span className="text-xs font-bold text-stone-600 bg-stone-200 px-3 py-1 rounded-full">
              Investor details excluded
            </span>
          </div>

          <div className="flex items-center gap-3">
            <AccessibleButton
              variant="outline"
              onClick={handleExportJpg}
              disabled={isExportingJpg}
              icon={<Image className="h-5 w-5" />}
            >
              {isExportingJpg ? 'Rendering JPG...' : 'Download JPG'}
            </AccessibleButton>

            <AccessibleButton
              variant="primary"
              onClick={handlePrint}
              icon={<Printer className="h-5 w-5" />}
            >
              Print / PDF
            </AccessibleButton>
          </div>
        </AccessibleCard>

        {/* ========================================================================= */}
        {/* PRINTABLE / EXPORTABLE A4 LETTERHEAD DOCUMENT CONTAINER */}
        {/* ========================================================================= */}
        <div
          ref={printRef}
          className="bg-white text-stone-900 p-8 sm:p-10 rounded-2xl shadow-xl border-2 border-stone-200 space-y-6 print:p-0 print:border-none print:shadow-none"
        >
          {/* 1. Letterhead Header (Dynamic Company Profile) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-stone-900 pb-6">
            <div className="space-y-1">
              {company.logoUrl && (
                <img src={company.logoUrl} alt={company.name} className="h-12 w-auto object-contain mb-2" />
              )}
              <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-none">{company.name}</h1>
              {company.legalName && (
                <p className="text-base text-stone-600 font-semibold">{company.legalName}</p>
              )}
              {[
                company.address,
                company.city,
                company.state,
                company.pincode,
              ].filter((part) => String(part || '').trim()).length > 0 && (
                <p className="text-sm text-stone-600 max-w-sm leading-relaxed">
                  {[company.address, company.city, company.state, company.pincode]
                    .filter((part) => String(part || '').trim())
                    .join(', ')}
                </p>
              )}
            </div>

            {(company.phone || company.email || company.website) && (
              <div className="sm:text-right space-y-1 text-sm text-stone-600">
                {company.phone && <p className="font-bold text-stone-900">Phone: <span className="font-normal">{company.phone}</span></p>}
                {company.email && <p className="font-bold text-stone-900">Email: <span className="font-normal">{company.email}</span></p>}
                {company.website && <p className="font-bold text-stone-900">Web: <span className="font-normal">{company.website}</span></p>}
              </div>
            )}
          </div>

          {/* 2. Document Title */}
          <div className="text-center py-3 bg-stone-100 rounded-xl border border-stone-300">
            <h2 className="text-xl font-black text-stone-900">
              Client Payment Schedule
            </h2>
          </div>

          {/* 3. Deal & Client Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-stone-50 border border-stone-300 text-sm">
            <div>
              <span className="text-stone-500 font-bold text-xs block">Client Name</span>
              <p className="text-base font-black text-stone-900 mt-0.5">{deal.client?.fullName}</p>
              <p className="text-xs text-stone-600">{deal.client?.businessName || deal.client?.phone}</p>
            </div>

            <div>
              <span className="text-stone-500 font-bold text-xs block">Finance Deal No.</span>
              <p className="text-base font-mono font-black text-stone-900 mt-0.5">{deal.dealNumber}</p>
              <p className="text-xs text-stone-600">Status: <span className="font-bold">{deal.status}</span></p>
            </div>

            <div>
              <span className="text-stone-500 font-bold text-xs block">Finance Amount</span>
              <p className="text-base font-black text-stone-900 mt-0.5 whitespace-nowrap">{formatCurrency(deal.financeAmountApproved)}</p>
              <p className="text-xs text-stone-600">Start Date: {formatDate(deal.startDate)}</p>
            </div>

            <div>
              <span className="text-stone-500 font-bold text-xs block">Repayment Frequency</span>
              <p className="text-base font-bold text-stone-900 mt-0.5">{deal.repaymentFrequency}</p>
              <p className="text-xs text-stone-600">{deal.numberOfRepayments} Installments</p>
            </div>
          </div>

          {/* 4. Payment Schedule Table */}
          <div className="border border-stone-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-900 text-white font-bold text-xs">
                  <th className="p-3.5">No.</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Principal (₹)</th>
                  <th className="p-3.5 text-right">Interest / Charges (₹)</th>
                  <th className="p-3.5 text-right">Total Due (₹)</th>
                  <th className="p-3.5 text-right">Paid (₹)</th>
                  <th className="p-3.5 text-right">Balance (₹)</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {deal.schedules?.map((sch: any) => (
                  <tr key={sch.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono font-bold text-stone-700">#{sch.installmentNumber}</td>
                    <td className="p-3.5 font-medium text-stone-800">{formatDate(sch.dueDate)}</td>
                    <td className="p-3.5 text-right font-mono font-medium text-stone-800 whitespace-nowrap">{formatCurrency(sch.principalAmount)}</td>
                    <td className="p-3.5 text-right font-mono font-medium text-stone-800 whitespace-nowrap">{formatCurrency(sch.interestAmount)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-stone-900 whitespace-nowrap">{formatCurrency(sch.totalDue)}</td>
                    <td className="p-3.5 text-right font-mono font-medium text-emerald-800 whitespace-nowrap">
                      {formatCurrency(sch.paidAmount ?? (Number(sch.paidPrincipal || 0) + Number(sch.paidInterest || 0)))}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                      {formatCurrency(sch.balanceAmount ?? Math.max(0, Number(sch.totalDue || 0) - Number(sch.paidAmount ?? (Number(sch.paidPrincipal || 0) + Number(sch.paidInterest || 0)))))}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sch.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-900'
                            : sch.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-stone-100 text-stone-800'
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5 rounded-xl bg-stone-100 border border-stone-300 text-sm text-center">
            <div>
              <span className="text-stone-500 font-bold text-xs">Total Finance</span>
              <p className="font-bold text-stone-900 text-base mt-0.5 whitespace-nowrap">{formatCurrency(deal.financeAmountApproved)}</p>
            </div>
            <div>
              <span className="text-stone-500 font-bold text-xs">Total Interest</span>
              <p className="font-bold text-stone-900 text-base mt-0.5 whitespace-nowrap">{formatCurrency(deal.totalInterest)}</p>
            </div>
            <div>
              <span className="text-stone-500 font-bold text-xs">Total Payable</span>
              <p className="font-bold text-stone-900 text-base mt-0.5 whitespace-nowrap">{formatCurrency(deal.totalPayable)}</p>
            </div>
            <div>
              <span className="text-emerald-800 font-bold text-xs">Amount Paid</span>
              <p className="font-bold text-emerald-800 text-base mt-0.5 whitespace-nowrap">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <span className="text-rose-800 font-bold text-xs">Outstanding</span>
              <p className="font-bold text-rose-800 text-base mt-0.5 whitespace-nowrap">{formatCurrency(outstanding)}</p>
            </div>
          </div>

          {/* 6. Legal Footer */}
          <div className="pt-6 border-t border-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-stone-500">
            <div>
              <p className="font-bold text-stone-800">{company.name}</p>
              <p className="text-xs">This is an authorized computer-generated repayment schedule.</p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-stone-700">Product by <span className="font-black text-stone-900">MSR Solutions</span></p>
              <p className="text-xs">FinFlow — Private Finance Management</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
