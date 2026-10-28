import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface DeliveryReportModalProps {
  isOpen: boolean;
  messageId: string | null;
  onClose: () => void;
  onReportSubmitted: () => void;
}

export const DeliveryReportModal: React.FC<DeliveryReportModalProps> = ({
  isOpen,
  messageId,
  onClose,
  onReportSubmitted,
}) => {
  const [status, setStatus] = useState('DELIVERED');
  const [provider, setProvider] = useState('ROUTE_A');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !messageId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.submitDeliveryReport({
        message_id: messageId,
        status,
        provider,
      });
      setSuccessMsg(res.message);
      onReportSubmitted();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit webhook report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Carrier Webhook Simulator</h3>
            <p className="text-xs text-slate-400">Bonus B3: Update message delivery receipt status</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 truncate">
          Message ID: <strong className="text-white">{messageId}</strong>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              New Carrier Delivery Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-nest-500"
            >
              <option value="DELIVERED">DELIVERED (Handset Delivered)</option>
              <option value="UNDELIVERED">UNDELIVERED (Network timeout/unreachable)</option>
              <option value="FAILED">FAILED (Carrier Rejected)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reporting Carrier / Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-nest-500"
            >
              <option value="ROUTE_A">ROUTE_A</option>
              <option value="ROUTE_B">ROUTE_B</option>
              <option value="ROUTE_C">ROUTE_C</option>
            </select>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-nest-600 hover:bg-nest-500 text-white shadow-md disabled:opacity-50 transition flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>POST /webhooks/delivery-report</span>
          </button>
        </form>
      </div>
    </div>
  );
};
