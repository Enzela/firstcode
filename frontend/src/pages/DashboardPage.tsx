import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { SMSComposer } from '../components/SMSComposer';
import { RouteHealthCards } from '../components/RouteHealthCards';
import { SMSLogsTable } from '../components/SMSLogsTable';
import { ConcurrencyTestModal } from '../components/ConcurrencyTestModal';
import { LedgerModal } from '../components/LedgerModal';
import { DeliveryReportModal } from '../components/DeliveryReportModal';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState(0);

  // Modals state
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [deliveryReportMessageId, setDeliveryReportMessageId] = useState<string | null>(null);

  const handleSMSDispatched = () => {
    setLogsRefreshTrigger((prev) => prev + 1);
    refreshUser();
  };

  const handleOpenDeliveryReport = (msgId: string) => {
    setDeliveryReportMessageId(msgId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Navbar
        onOpenConcurrencyModal={() => setIsConcurrencyModalOpen(true)}
        onOpenLedgerModal={() => setIsLedgerModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner with Key Metrics / Architecture Highlights */}
        <div className="rounded-3xl bg-gradient-to-r from-nest-950/80 via-slate-900 to-slate-900/90 border border-nest-700/30 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-nest-600/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  ACID Engine Active · SQLite / Postgres Row-Locking Ready
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Nest SMS Gateway Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Bulk SMS platform accepting traffic, atomically deducting wallet credits, dispatching through priority routes, falling over on drops, and refunding upon total route failure.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsConcurrencyModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Run 20-Parallel Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Core Operations: SMS Composer & Route Health Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <SMSComposer onSuccess={handleSMSDispatched} />
          </div>
          <div className="lg:col-span-5">
            <RouteHealthCards />
          </div>
        </div>

        {/* Full-width SMS Logs & Delivery Reports */}
        <div>
          <SMSLogsTable
            refreshTrigger={logsRefreshTrigger}
            onOpenDeliveryReportModal={handleOpenDeliveryReport}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          Mini SMS Gateway · Nest Nepal Backend Developer Take-Home Coding Assignment · Built with FastAPI & React TypeScript
        </p>
      </footer>

      {/* Modals */}
      <ConcurrencyTestModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
        onTestComplete={() => {
          setLogsRefreshTrigger((prev) => prev + 1);
          refreshUser();
        }}
      />

      <LedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
      />

      <DeliveryReportModal
        isOpen={Boolean(deliveryReportMessageId)}
        messageId={deliveryReportMessageId}
        onClose={() => setDeliveryReportMessageId(null)}
        onReportSubmitted={() => {
          setLogsRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
};
