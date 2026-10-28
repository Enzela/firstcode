import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { SMSLogItem, PaginatedLogs } from '../types';

interface SMSLogsTableProps {
  refreshTrigger: number;
  onOpenDeliveryReportModal: (msgId: string, currentStatus: string) => void;
}

export const SMSLogsTable: React.FC<SMSLogsTableProps> = ({ 
  refreshTrigger, 
  onOpenDeliveryReportModal 
}) => {
  const [logs, setLogs] = useState<SMSLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [numberFilter, setNumberFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res: PaginatedLogs = await api.getSMSLogs({
        page,
        page_size: 10,
        status: statusFilter || undefined,
        number: numberFilter || undefined,
        date_from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
        date_to: dateTo ? `${dateTo}T23:59:59` : undefined,
      });
      setLogs(res.items);
      setTotalPages(res.total_pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, refreshTrigger]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setNumberFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const getStatusBadge = (status: string, refunded: boolean) => {
    switch (status.toUpperCase()) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Sent
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <CheckCircle className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <XCircle className="w-3 h-3" />
            Failed {refunded && '· Refunded'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/70">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-nest-400" />
            <span>SMS Delivery Logs & Webhooks</span>
          </h2>
          <p className="text-xs text-slate-400">
            Filtered audit trail of every SMS dispatched, route selected, and refund event.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total Logs: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-nest-500"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Number Search */}
        <div>
          <input
            type="text"
            placeholder="Search phone number..."
            value={numberFilter}
            onChange={(e) => setNumberFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-nest-500 font-mono"
          />
        </div>

        {/* Date From */}
        <div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-nest-500"
          />
        </div>

        {/* Date To */}
        <div>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-nest-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-3 py-2 bg-nest-600 hover:bg-nest-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-md transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
            <tr>
              <th className="p-3">Recipient</th>
              <th className="p-3">Message</th>
              <th className="p-3">Encoding</th>
              <th className="p-3">Parts / Cost</th>
              <th className="p-3">Route</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3 text-right">Webhook Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  {loading ? 'Loading logs...' : 'No SMS logs found matching the filter.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                    {log.recipient}
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs truncate" title={log.message}>
                    {log.message}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      log.encoding === 'GSM_7' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {log.encoding}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {log.parts} part{log.parts > 1 ? 's' : ''} · <strong className="text-amber-400">{log.cost} cr</strong>
                  </td>
                  <td className="p-3 whitespace-nowrap font-medium text-slate-300">
                    {log.provider_name ? (
                      <span className="text-nest-400 font-semibold">{log.provider_name}</span>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {getStatusBadge(log.status, log.refunded)}
                  </td>
                  <td className="p-3 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenDeliveryReportModal(log.id, log.status)}
                      title="Simulate carrier delivery webhook (Bonus B3)"
                      className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition inline-flex items-center gap-1"
                    >
                      <span>Simulate Webhook</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
