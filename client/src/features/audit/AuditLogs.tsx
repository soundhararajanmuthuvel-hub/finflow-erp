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
      <div className="pb-4 border-b border-slate-200/60">
        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
          System Audit Trail
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Immutable event log of all sensitive financial operations, status transitions, and user actions
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Action Performed</th>
                <th className="py-3 px-5">Operator</th>
                <th className="py-3 px-5">Target Entity</th>
                <th className="py-3 px-5">Recorded Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-500">
                    Loading audit trail events...
                  </td>
                </tr>
              ) : logs?.length > 0 ? (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors bg-white"
                  >
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {formatDate(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{log.action}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-slate-900">
                      {log.user?.fullName || 'System Automated'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-[#8B1A1A]">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-slate-500 max-w-md break-words">
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
