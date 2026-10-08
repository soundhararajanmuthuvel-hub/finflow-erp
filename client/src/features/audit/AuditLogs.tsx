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
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-[#D6CFC4]">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#1A1A1A] tracking-tight">
          System Audit Trail
        </h1>
        <p className="text-sm sm:text-base font-medium text-[#52525B] mt-1">
          Immutable event log of all sensitive financial operations, status transitions, and user actions
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-3.5 px-5 text-sm font-bold">Timestamp</th>
                <th className="py-3.5 px-5 text-sm font-bold">Action Performed</th>
                <th className="py-3.5 px-5 text-sm font-bold">Operator</th>
                <th className="py-3.5 px-5 text-sm font-bold">Target Entity</th>
                <th className="py-3.5 px-5 text-sm font-bold">Recorded Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-base font-bold text-[#52525B]">
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
                    <td className="py-3.5 px-5 text-[#52525B] font-mono text-xs sm:text-sm font-bold whitespace-nowrap">
                      {formatDate(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EAF5EE] text-[#1F6B3A] border border-[#A7D9B7] text-xs font-bold">
                        <ShieldCheck className="h-3.5 w-3.5 stroke-[2.3]" />
                        <span>{log.action}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-base text-[#1A1A1A]">
                      {log.user?.fullName || 'System Automated'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-sm font-bold text-[#8B1A1A]">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-[#52525B] max-w-md break-words">
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
