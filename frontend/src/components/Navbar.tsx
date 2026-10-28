import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Send, 
  Coins, 
  LogOut, 
  Zap, 
  Layers, 
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onOpenConcurrencyModal: () => void;
  onOpenLedgerModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenConcurrencyModal, 
  onOpenLedgerModal 
}) => {
  const { user, logout, updateBalance } = useAuth();
  const [topUpLoading, setTopUpLoading] = useState(false);

  const handleQuickTopUp = async () => {
    try {
      setTopUpLoading(true);
      const res = await api.topUpWallet(50, "Quick demo top-up (+50 credits)");
      updateBalance(res.balance);
    } catch (err) {
      console.error(err);
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-nest-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-nest-600/20">
              <Send className="w-5 h-5 text-white transform -rotate-12" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  NEST SMS
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-nest-500/10 text-nest-400 border border-nest-500/20">
                  Gateway v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Accept · Charge · Send · Fail over
              </p>
            </div>
          </div>

          {/* User Controls & Actions */}
          <div className="flex items-center space-x-3">
            {/* Wallet Balance Badge */}
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Wallet</span>
                <span className="text-sm font-extrabold text-white leading-tight">
                  {user?.balance ?? 0} <span className="text-xs font-normal text-slate-400">credits</span>
                </span>
              </div>
              <button
                onClick={handleQuickTopUp}
                disabled={topUpLoading}
                title="Quick top up +50 credits"
                className="ml-1 p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              >
                <PlusCircle className={`w-4 h-4 ${topUpLoading ? 'animate-spin text-nest-400' : 'text-emerald-400'}`} />
              </button>
            </div>

            {/* View Ledger */}
            <button
              onClick={onOpenLedgerModal}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Ledger</span>
            </button>

            {/* Concurrency Stress Test Button */}
            <button
              onClick={onOpenConcurrencyModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">20-Parallel</span>
              <span>Test Demo</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title={`Sign out (${user?.email})`}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
