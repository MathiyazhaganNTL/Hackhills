import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertTriangle,
  Key,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, isLoading, error }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('BayoraPass123!@#');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const handleQuickFill = (u: string) => {
    setUsername(u);
    setPassword('BayoraPass123!@#');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 items-center justify-center shadow-xl shadow-cyan-500/20 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-100 font-mono">
            BAYORA
          </h1>
          <p className="text-xs text-slate-400">
            Secure AI Red-Teaming & Safety Evaluation Infrastructure
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[11px] text-slate-500 font-mono">Tenant Principal</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, red_operator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[11px] text-slate-500 font-mono">Bcrypt Authenticated</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 font-mono">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Authenticating Principal...' : 'Sign In to Infrastructure'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Evaluator Profiles */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono block">
              Quick-Fill Evaluator Test Profiles (Password: BayoraPass123!@#):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-left transition"
              >
                🛡️ admin (SecOps)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('red_operator')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-400 text-left transition"
              >
                🔴 red_operator (Attacks)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('blue_defender')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 text-left transition"
              >
                🔵 blue_defender (Defenses)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('auditor_sec')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-left transition"
              >
                📋 auditor_sec (Read-Only)
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill('tenant2_admin')}
              className="w-full p-2 rounded bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 text-amber-400 text-left transition text-[11px] font-mono"
            >
              ⚠️ tenant2_admin (Test Cross-Tenant Denial)
            </button>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          Strict deny-by-default RBAC & cryptographic audit chain active
        </div>
      </div>
    </div>
  );
};
