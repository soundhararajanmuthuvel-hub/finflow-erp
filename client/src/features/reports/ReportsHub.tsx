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
    <div className="space-y-8 print-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4] no-print">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Financial Intelligence & Reports
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
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
      <AccessibleCard withTopAccent className="p-6 sm:p-8 no-print space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AccessibleSelect
              label="Select Financial Report"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportOptions}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
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
      <div className="rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="p-5 border-b-2 border-[#EDE7DE] bg-[#FAF7F2] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1A1A1A]">
            {reportOptions.find((r) => r.value === reportType)?.label}
          </h3>
          <span className="text-base font-bold text-[#8B1A1A]">
            Total Records: {reportData?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                {reportData?.length > 0 &&
                  Object.keys(reportData[0]).map((col) => (
                    <th key={col} className="py-4 px-5 text-base font-bold whitespace-nowrap">
                      {col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-lg font-bold text-[#52525B]">
                    Generating financial report...
                  </td>
                </tr>
              ) : reportData?.length > 0 ? (
                reportData.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className={`hover:bg-[#FAF7F2] transition-colors ${
                      i % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
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
                        <td key={j} className="py-4 px-5 whitespace-nowrap">
                          {isMoney ? (
                            <span className="font-bold text-[#1A1A1A] font-mono text-lg whitespace-nowrap">
                              {formatCurrency(val)}
                            </span>
                          ) : (
                            <span className="font-semibold text-[#1A1A1A]">{String(val || '—')}</span>
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
