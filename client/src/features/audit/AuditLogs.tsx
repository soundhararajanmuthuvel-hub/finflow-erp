import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ShieldCheck, User, Clock, Terminal } from 'lucide-react';
import apiClient from '../../api/client';
import { formatDate } from '../../utils/formatters';
import {
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';

export const AuditLogs: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res: any = await apiClient.get('/audit-logs');
      return res.data || [];
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b-2 border-[#D6CFC4]">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
          System Audit Trail
        </h1>
        <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
          Immutable event log of all sensitive financial operations, status transitions, and user actions
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-4 px-6 text-base">Timestamp</th>
                <th className="py-4 px-6 text-base">Action Performed</th>
                <th className="py-4 px-6 text-base">Operator</th>
                <th className="py-4 px-6 text-base">Target Entity</th>
                <th className="py-4 px-6 text-base">Recorded Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-lg font-bold text-[#52525B]">
                    Loading audit trail events...
                  </td>
                </tr>
              ) : logs?.length > 0 ? (
                logs.map((log: any, index: number) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-[#FAF7F2] transition-colors ${
                      index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
                  >
                    <td className="py-4 px-6 text-[#52525B] font-mono text-sm font-bold whitespace-nowrap">
                      {formatDate(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EAF5EE] text-[#1F6B3A] border border-[#A7D9B7] text-sm font-extrabold">
                        <ShieldCheck className="h-4 w-4 stroke-[2.3]" />
                        <span>{log.action}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-lg text-[#1A1A1A]">
                      {log.user?.fullName || 'System Automated'}
                    </td>
                    <td className="py-4 px-6 font-mono text-base font-bold text-[#8B1A1A]">
                      {log.entity}
                    </td>
                    <td className="py-4 px-6 text-sm font-mono text-[#52525B] max-w-md break-words">
                      {log.newValues || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12">
                    <AccessibleEmptyState
                      icon={History}
                      title="No audit events logged yet"
                      description="Sensitive operations and ledger postings will appear here in chronological order."
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

export default AuditLogs;
