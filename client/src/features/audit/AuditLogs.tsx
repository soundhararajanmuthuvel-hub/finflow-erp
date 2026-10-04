import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ShieldCheck, User } from 'lucide-react';
import apiClient from '../../api/client';
import { formatDate } from '../../utils/formatters';

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
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable event log of all sensitive financial operations, status transitions, and user actions
        </p>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Operator</th>
                <th className="py-3.5 px-5">Entity</th>
                <th className="py-3.5 px-5">Recorded Changes</th>
                <th className="py-3.5 px-5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs?.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-950/40">
                    <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                      {formatDate(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="py-4 px-5 font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{log.action}</span>
                    </td>
                    <td className="py-4 px-5 font-semibold text-white">
                      {log.user?.fullName || 'System Automated'}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-300">
                      {log.entity} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {log.newValues || '—'}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records logged yet.
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
