import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Download, Printer, Filter, Calendar } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';

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
    { id: 'client-finance', label: '1. Client Finance & Outstanding Report' },
    { id: 'investor-returns', label: '2. Outside Investor Capital & Return Report' },
    { id: 'partner-capital', label: '3. Partner Equity & Profit Share Report' },
    { id: 'company-profit', label: '4. Company Net Profit & Deal Margin Report' },
    { id: 'collections', label: '5. Daily Repayments & Collection Statement' },
    { id: 'overdue', label: '6. Portfolio Overdue & Aging Analysis Report' },
  ];

  return (
    <div className="space-y-6 print-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Financial Intelligence & Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Exportable audits, investor yield statements, collection ledgers and profit reconciliations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Printer className="h-4 w-4 text-blue-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector & Date Filters */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <div className="w-full md:w-96">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Select Financial Report
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {reportOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Report Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {reportOptions.find((r) => r.id === reportType)?.label}
          </h3>
          <span className="text-[11px] text-slate-400">Total Records: {reportData?.length || 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                {reportData?.length > 0 &&
                  Object.keys(reportData[0]).map((col) => (
                    <th key={col} className="py-3 px-4 uppercase tracking-wider text-[11px]">
                      {col.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Generating report calculations...
                  </td>
                </tr>
              ) : reportData?.length > 0 ? (
                reportData.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-950/40">
                    {Object.entries(row).map(([key, val]: any, cIdx: number) => {
                      const isMoney =
                        typeof val === 'number' &&
                        (key.toLowerCase().includes('amount') ||
                          key.toLowerCase().includes('repaid') ||
                          key.toLowerCase().includes('balance') ||
                          key.toLowerCase().includes('profit') ||
                          key.toLowerCase().includes('invested') ||
                          key.toLowerCase().includes('principal') ||
                          key.toLowerCase().includes('interest') ||
                          key.toLowerCase().includes('commission') ||
                          key.toLowerCase().includes('payout'));

                      return (
                        <td key={cIdx} className="py-3 px-4">
                          {isMoney ? (
                            <span className="font-mono font-bold text-white">{formatCurrency(val)}</span>
                          ) : key.toLowerCase().includes('date') ? (
                            <span>{formatDate(val)}</span>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No records found for the selected period.
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
