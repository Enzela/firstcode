import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  Coins, 
  Shuffle, 
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { EstimateResult, SendSMSResult } from '../types';
import { useAuth } from '../context/AuthContext';

interface SMSComposerProps {
  onSuccess: () => void;
}

export const SMSComposer: React.FC<SMSComposerProps> = ({ onSuccess }) => {
  const { user, updateBalance } = useAuth();
  const [recipientText, setRecipientText] = useState('9841234567, +9779801122334');
  const [messageText, setMessageText] = useState('Welcome to Nest Nepal SMS Gateway! Fast, reliable delivery.');
  const [forceFailRoute, setForceFailRoute] = useState<string>('');
  
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<SendSMSResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parse raw text into array of recipients
  const parsedRecipients = useMemo(() => {
    return recipientText
      .split(/[\n,;\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }, [recipientText]);

  // Live estimate call with debounce
  useEffect(() => {
    if (parsedRecipients.length === 0 || !messageText.trim()) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setEstimating(true);
        const res = await api.estimateSMS(parsedRecipients, messageText);
        setEstimate(res);
        setErrorMsg(null);
      } catch (err: any) {
        console.error(err);
      } finally {
        setEstimating(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [parsedRecipients, messageText]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estimate || estimate.total_valid === 0) {
      setErrorMsg("Please enter at least one valid Nepali mobile number.");
      return;
    }

    if (user && user.balance < estimate.total_cost) {
      setErrorMsg(`Insufficient credits: this send requires ${estimate.total_cost} credits, but your balance is ${user.balance}.`);
      return;
    }

    try {
      setSending(true);
      setErrorMsg(null);
      const res = await api.sendSMS(parsedRecipients, messageText, forceFailRoute);
      setLastResult(res);
      updateBalance(res.final_wallet_balance);
      onSuccess();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail?.message) {
        setErrorMsg(detail.message);
      } else {
        setErrorMsg(detail || "Failed to process SMS request");
      }
    } finally {
      setSending(false);
    }
  };

  const handleFillSampleNepali = () => {
    setMessageText('नमस्ते नेपाल! नेस्ट एसएमएस गेटवेमा स्वागत छ। यो युनिकोड सन्देश हो। 🚀');
  };

  const handleFillFailoverSample = () => {
    setRecipientText('+9779801122334, 9779761234567, 9612345678');
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-nest-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700/70">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-nest-400" />
            <span>Compose & Dispatch SMS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Nepali number normalization (+977/977), GSM-7/Unicode part calculation & failover.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleFillSampleNepali}
            className="text-xs px-2.5 py-1 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition"
          >
            Nepali (Unicode) Sample
          </button>
          <button
            type="button"
            onClick={handleFillFailoverSample}
            className="text-xs px-2.5 py-1 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition"
          >
            Sample Numbers
          </button>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        {/* Recipients input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Recipients (Comma or line separated)
            </label>
            <span className="text-xs text-slate-400">
              {parsedRecipients.length} entered
            </span>
          </div>
          <textarea
            rows={2}
            value={recipientText}
            onChange={(e) => setRecipientText(e.target.value)}
            placeholder="e.g. 9841234567, +9779801122334, 9779761234567"
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-nest-500 font-mono"
          />

          {/* Real-time Recipient Validation Pills */}
          {estimate && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              {estimate.valid_recipients.map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {num}
                </span>
              ))}
              {estimate.invalid_recipients.map((inv, idx) => (
                <span
                  key={idx}
                  title={inv.reason}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400 cursor-help"
                >
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span className="line-through">{inv.input}</span>
                  <span className="text-[10px] text-rose-300">({inv.reason})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Message Content
            </label>
            {estimate && (
              <div className="flex items-center gap-2">
                {/* Encoding Badge */}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  estimate.encoding === 'GSM_7' 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                }`}>
                  {estimate.encoding === 'GSM_7' ? 'GSM-7 (160/153)' : 'Unicode (70/67)'}
                </span>
                {/* Parts Counter */}
                <span className="text-xs text-slate-300 font-mono">
                  {estimate.character_count} chars · <strong className="text-nest-400">{estimate.parts_per_message} {estimate.parts_per_message === 1 ? 'part' : 'parts'}</strong>
                </span>
              </div>
            )}
          </div>
          <textarea
            rows={3}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your SMS message here..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-nest-500"
          />
        </div>

        {/* Test Simulator Controls & Cost Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl">
          {/* Failover Simulator Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
              <Shuffle className="w-3.5 h-3.5 text-nest-400" />
              <span>Simulate Route Scenario</span>
            </label>
            <select
              value={forceFailRoute}
              onChange={(e) => setForceFailRoute(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-nest-500"
            >
              <option value="">Normal Priority Failover (Route A → B → C)</option>
              <option value="ROUTE_A">Force ROUTE_A Failure (Triggers failover to B)</option>
              <option value="ALL">Force ALL Routes Failure (Triggers 100% Refund)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Test how the gateway handles route drops and triggers automated refunds.
            </p>
          </div>

          {/* Pricing & Wallet Estimate */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Valid Recipients:</span>
              <span className="font-semibold text-slate-200 font-mono">{estimate?.total_valid ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-400">Parts Per SMS:</span>
              <span className="font-semibold text-slate-200 font-mono">{estimate?.parts_per_message ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-slate-700/50">
              <span className="font-semibold text-slate-300">Total Credit Cost:</span>
              <span className="text-sm font-extrabold text-amber-400 font-mono flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {estimate?.total_cost ?? 0} credits
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={sending || !estimate || estimate.total_valid === 0}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-nest-600 via-nest-500 to-cyan-600 hover:from-nest-500 hover:to-cyan-500 text-white shadow-lg shadow-nest-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {sending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Transacting & Dispatching...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send SMS ({estimate?.total_cost ?? 0} Credits)</span>
            </>
          )}
        </button>
      </form>

      {/* Dispatch Result Card */}
      {lastResult && (
        <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Batch Result: {lastResult.batch_id.slice(0, 8)}</span>
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Balance: <strong className="text-white">{lastResult.final_wallet_balance} credits</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Sent</span>
              <strong className="text-emerald-400 text-sm">{lastResult.sent_count}</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Failed</span>
              <strong className="text-rose-400 text-sm">{lastResult.failed_count}</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Charged</span>
              <strong className="text-amber-400 text-sm">{lastResult.total_charged} cr</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Auto-Refunded</span>
              <strong className="text-purple-400 text-sm">{lastResult.total_refunded} cr</strong>
            </div>
          </div>

          {/* Show Failover Paths */}
          <div className="space-y-1.5 pt-2">
            {lastResult.sent_messages.map((msg) => (
              <div key={msg.id} className="text-xs p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <span className="font-mono text-slate-300">{msg.recipient}</span>
                <div className="flex items-center gap-1 text-[11px]">
                  {msg.attempts.map((att, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ArrowRight className="w-3 h-3 text-slate-500" />}
                      <span className={`px-1.5 py-0.5 rounded ${
                        att.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {att.route} ({att.status})
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            {lastResult.failed_messages.map((msg) => (
              <div key={msg.id} className="text-xs p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
                <span className="font-mono text-rose-300">{msg.recipient}</span>
                <span className="text-xs text-purple-300 font-medium">
                  Failed on all routes → {msg.cost} credit refunded
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
