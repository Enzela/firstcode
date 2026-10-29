import React, { useState, useEffect } from 'react';
import { X, Layers, ArrowUpRight, ArrowDownLeft, RefreshCw, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { LedgerItem } from '../types';

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getWalletLedger(30)
        .then(setEntries)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CHARGE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowUpRight className="w-3 h-3" />
            CHARGE
          </span>
        );
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RotateCcw className="w-3 h-3" />
            REFUND
          </span>
        );
      case 'TOPUP':
      case 'INITIAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-3 h-3" />
            {type}
          </span>
        );
      default:
        return <span className="text-slate-400">{type}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-nest-500/10 flex items-center justify-center text-nest-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Wallet Credit Audit Ledger</h3>
              <p className="text-xs text-slate-400">Immutable record of every balance charge, refund, and top-up.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-nest-400" />
              <span>Loading ledger...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No transactions recorded in the ledger yet.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(item.transaction_type)}
                      <span className="text-slate-300 font-medium">{item.description || 'System entry'}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {new Date(item.created_at).toLocaleString()} · Ref: {item.reference_id?.slice(0, 8) || 'N/A'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${
                      item.transaction_type === 'CHARGE' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {item.transaction_type === 'CHARGE' ? `-${item.amount}` : `+${item.amount}`} cr
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Bal after: <strong className="text-slate-200">{item.balance_after}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

