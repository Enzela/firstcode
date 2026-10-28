import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  AlertOctagon, 
  RefreshCw, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { ConcurrencyTestResult } from '../types';
import { useAuth } from '../context/AuthContext';

interface ConcurrencyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestComplete: () => void;
}

export const ConcurrencyTestModal: React.FC<ConcurrencyTestModalProps> = ({
  isOpen,
  onClose,
  onTestComplete,
}) => {
  const { updateBalance } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ConcurrencyTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    try {
      setRunning(true);
      setError(null);
      setResult(null);
      const res = await api.runConcurrencyTest(10, 20);
      setResult(res);
      updateBalance(res.final_wallet_balance);
      onTestComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Concurrency test failed to execute");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Core Challenge: Concurrency Stress Test</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                20 Parallel Requests
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Verifies: "Fire 20 parallel send requests at a wallet that can only afford 10. Exactly 10 should succeed."
            </p>
          </div>
        </div>

        {/* Challenge Description Box */}
        <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>How This Live Verification Works</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
            <li>Resets your demo wallet to exactly <strong>10 credits</strong>.</li>
            <li>Spawns <strong>20 concurrent threads</strong> firing 1-credit SMS dispatches simultaneously.</li>
            <li>Our backend uses <strong>exclusive row-level locking</strong> and ACID transactions.</li>
            <li>Expectation: Exactly <strong>10 requests succeed (HTTP 200)</strong>, <strong>10 rejected with 402 (Insufficient Credits)</strong>, and ending balance is exactly <strong>0</strong>.</li>
          </ol>
        </div>

        {/* Trigger Button */}
        <button
          onClick={handleRunTest}
          disabled={running}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simulating 20 Parallel Requests...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Fire 20 Parallel Requests Now</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result View */}
        {result && (
          <div className="p-5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${result.test_passed ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span className="font-bold text-white text-sm">
                  {result.test_passed ? 'VERIFIED: Zero Double-Spend Guarantee Passed!' : 'Result Mismatch'}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                result.test_passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {result.test_passed ? '100% SUCCESS' : 'FAILED'}
              </span>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Successful (HTTP 200)</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">{result.success_count} / 10</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rejected (HTTP 402)</span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">{result.rejected_count} / 10</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ending Wallet Balance</span>
                <span className="text-xl font-extrabold text-cyan-400 font-mono">{result.final_wallet_balance} credits</span>
              </div>
            </div>

            {/* Visual 20 Requests Grid */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Parallel Execution Grid (All 20 Dispatches):
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {result.requests.map((req) => (
                  <div
                    key={req.index}
                    title={req.message}
                    className={`p-2 rounded-lg text-center text-xs font-mono border transition ${
                      req.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <span className="text-[10px] block opacity-70">#{req.index}</span>
                    <strong className="text-[11px] block">{req.status === 'SUCCESS' ? '200 OK' : '402 LOW'}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
