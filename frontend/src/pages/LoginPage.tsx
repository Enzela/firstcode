import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Lock, Mail, AlertCircle, ArrowRight, Zap } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    const demoEmail = "demo@nestnepal.com";
    const demoPass = "NestNepal2026!";
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      setLoading(true);
      setError(null);
      // Try logging in, if doesn't exist auto-register
      try {
        await login(demoEmail, demoPass);
      } catch (e) {
        await register(demoEmail, demoPass);
      }
    } catch (err: any) {
      setError("Failed to initialize demo account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nest-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-nest-600 to-cyan-500 items-center justify-center shadow-lg shadow-nest-600/30 mb-2">
            <Send className="w-7 h-7 text-white transform -rotate-12" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            NEST SMS GATEWAY
          </h1>
          <p className="text-xs text-slate-400">
            Mini Bulk SMS Platform · Accept · Charge · Send · Fail over
          </p>
        </div>

        {/* Quick Demo Login Pill for Interviewers */}
        <div className="p-3 bg-gradient-to-r from-nest-950/60 to-slate-900 border border-nest-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-nest-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">Quick Interview Demo Login:</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="text-xs font-bold px-3 py-1 bg-nest-600 hover:bg-nest-500 text-white rounded-lg transition shadow"
          >
            1-Click Demo
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@nestnepal.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-nest-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-nest-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-nest-600 to-cyan-600 hover:from-nest-500 hover:to-cyan-500 text-white shadow-lg shadow-nest-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Gateway'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-nest-400 font-semibold hover:underline"
            >
              Register with 50 Free Credits
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
