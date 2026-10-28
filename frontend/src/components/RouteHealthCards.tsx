import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Sliders, 
  Server, 
  RefreshCw, 
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import { RouteHealth } from '../types';

export const RouteHealthCards: React.FC = () => {
  const [routes, setRoutes] = useState<RouteHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editFailureRate, setEditFailureRate] = useState<number>(0);
  const [showFormula, setShowFormula] = useState(false);

  const fetchHealth = async () => {
    try {
      const data = await api.getRouteHealth();
      setRoutes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Poll every 5s for live route stats
    return () => clearInterval(interval);
  }, []);

  const handleSaveFailureRate = async (name: string) => {
    try {
      await api.updateRouteConfig(name, { failure_rate: editFailureRate });
      setEditingRoute(null);
      await fetchHealth();
    } catch (err) {
      console.error(err);
    }
  };

  const getHealthBadgeColor = (health: number) => {
    if (health >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (health >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/70">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>SMS Provider Routes & Health Monitor</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time balance, 24h success metrics, and health scores across fake providers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center gap-1 text-xs text-nest-400 hover:text-nest-300 font-medium px-2.5 py-1 rounded-lg bg-nest-500/10 border border-nest-500/20"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Health Formula</span>
          </button>
          <button
            onClick={fetchHealth}
            title="Refresh route health"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Formula Explanation Accordion */}
      {showFormula && (
        <div className="p-3.5 rounded-xl bg-nest-950/40 border border-nest-700/30 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-nest-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-nest-400" />
            <span>Nest SMS Dynamic Route Health Formula</span>
          </div>
          <p className="font-mono bg-slate-900/80 p-2 rounded-lg text-emerald-300 text-[11px]">
            Health % = (Success_Rate_24h × 0.60) + (Balance_Availability × 0.30) + (Configured_Reliability × 0.10)
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
            <li><strong>Success Rate (60% weight):</strong> Percentage of successful dispatches over the last 24 hours.</li>
            <li><strong>Balance Availability (30% weight):</strong> Proportion of available route credits (target: 200 credits).</li>
            <li><strong>Configured Reliability (10% weight):</strong> Baseline (1 - configured failure rate).</li>
          </ul>
        </div>
      )}

      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => {
          const isEditing = editingRoute === route.route_name;

          return (
            <div
              key={route.route_name}
              className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-600 transition"
            >
              {/* Top: Name & Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-nest-400" />
                    <span className="font-bold text-white tracking-wide">{route.route_name}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Priority #{route.priority}
                  </span>
                </div>

                {/* Health % Big Gauge */}
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Health Score</span>
                  <span className={`text-xl font-extrabold font-mono px-2 py-0.5 rounded-lg border ${getHealthBadgeColor(route.health_percentage)}`}>
                    {route.health_percentage}%
                  </span>
                </div>

                {/* Health Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      route.health_percentage >= 80 ? 'bg-emerald-400' : route.health_percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${route.health_percentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Balance</span>
                  <span className="font-bold text-slate-200 font-mono">{route.balance} SMS</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">24h Success</span>
                  <span className="font-bold text-emerald-400 font-mono">{route.success_rate_24h}%</span>
                </div>
              </div>

              {/* Configurable Failure Rate & Edit Controls */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-slate-500" />
                    <span>Failure Rate:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {route.failure_rate_percent}%
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={editFailureRate * 100}
                      onChange={(e) => setEditFailureRate(Number(e.target.value) / 100)}
                      className="w-full accent-nest-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{Math.round(editFailureRate * 100)}%</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingRoute(null)}
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveFailureRate(route.route_name)}
                          className="px-2 py-0.5 rounded bg-nest-600 text-white font-medium hover:bg-nest-500"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingRoute(route.route_name);
                      setEditFailureRate(route.failure_rate);
                    }}
                    className="w-full py-1 text-[11px] text-center text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition"
                  >
                    Adjust Failure Rate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
