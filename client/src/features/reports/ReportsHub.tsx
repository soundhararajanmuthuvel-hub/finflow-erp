import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Download, Printer, Filter, Calendar } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';

export const ReportsHub: React.FC = () => {
  const [reportType, setReportType] = useState('client-finance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', reportType, startDate, endDate],
    queryFn: async () => {
      let endpoint = `/reports/${reportType}`;
      if (startDate || endDate) {
        endpoint += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res: any = await apiClient.get(endpoint);
      return res.data || [];
    },
  });

  const exportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map((row: any) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportOptions = [
    { value: 'client-finance', label: '1. Client Finance & Outstanding Portfolio Report' },
    { value: 'investor-returns', label: '2. Outside Investor Capital & Return Report' },
    { value: 'partner-capital', label: '3. Partner Equity & Profit Share Report' },
    { value: 'company-profit', label: '4. Company Net Profit & Margin Report' },
    { value: 'collections', label: '5. Repayments & Collection Statement' },
    { value: 'overdue', label: '6. Portfolio Overdue & Aging Analysis Report' },
  ];

  return (
    <div className="space-y-6 print-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 no-print">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Financial Intelligence & Reports
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Exportable audits, investor statements, collection ledgers, and profit reconciliations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AccessibleButton
            variant="outline"
            size="normal"
            icon={Download}
            onClick={exportCSV}
          >
            Export CSV
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            size="normal"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Report
          </AccessibleButton>
        </div>
      </div>

      {/* Report Selector & Date Filters Card */}
      <AccessibleCard withTopAccent className="p-4 sm:p-5 no-print space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <AccessibleSelect
              label="Select Financial Report"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportOptions}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
            <AccessibleInput
              label="From Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <AccessibleInput
              label="To Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </AccessibleCard>

      {/* Dynamic Report Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            {reportOptions.find((r) => r.value === reportType)?.label}
          </h3>
          <span className="text-xs sm:text-sm font-semibold text-[#8B1A1A] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Total Records: {reportData?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <tr>
                {reportData?.length > 0 &&
                  Object.keys(reportData[0]).map((col) => (
                    <th key={col} className="py-3 px-4 font-semibold whitespace-nowrap">
                      {col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm font-medium text-slate-500">
                    Generating financial report...
                  </td>
                </tr>
              ) : reportData?.length > 0 ? (
                reportData.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/80 transition-colors bg-white"
                  >
                    {Object.entries(row).map(([k, val]: [string, any], j: number) => {
                      const isMoney =
                        typeof val === 'number' &&
                        (k.toLowerCase().includes('amount') ||
                          k.toLowerCase().includes('capital') ||
                          k.toLowerCase().includes('profit') ||
                          k.toLowerCase().includes('interest') ||
                          k.toLowerCase().includes('repaid') ||
                          k.toLowerCase().includes('total'));

                      return (
                        <td key={j} className="py-3 px-4 whitespace-nowrap text-sm sm:text-base">
                          {isMoney ? (
                            <span className="font-bold text-[#1A1A1A] font-mono text-sm sm:text-base whitespace-nowrap">
                              {formatCurrency(val)}
                            </span>
                          ) : (
                            <span className="font-medium text-[#1A1A1A]">{String(val || '—')}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12">
                    <AccessibleEmptyState
                      icon={FileSpreadsheet}
                      title="No matching records found"
                      description="Adjust date range or filter criteria to see financial activity."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsHub;
