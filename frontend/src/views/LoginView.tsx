import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertTriangle,
  Key,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  FlaskConical
} from 'lucide-react';
import { useTheme } from '../services/theme';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, isLoading, error }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('BayoraPass123!@#');
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const handleQuickFill = (u: string) => {
    setUsername(u);
    setPassword('BayoraPass123!@#');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top right theme switcher */}
      <div className="flex justify-end p-2">
        <div className="flex items-center space-x-1 p-1 bg-card border border-border rounded-lg shadow-xs">
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              theme === 'dark' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dark mode"
            aria-label="Switch to dark theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              theme === 'light' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Light mode"
            aria-label="Switch to light theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              theme === 'system' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="System theme"
            aria-label="Use system theme"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto my-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-primary items-center justify-center shadow-xl shadow-cyan-500/20 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-foreground font-mono">
            BAYORA
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            High-Assurance AI Red-Teaming, Blue-Team Defense & Isolated Evaluation Infrastructure
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card text-card-foreground border border-border shadow-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="bayora-username" className="block text-foreground font-medium mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[11px] text-muted-foreground font-mono">Tenant Principal</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  id="bayora-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, red_operator"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bayora-password" className="block text-foreground font-medium mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[11px] text-muted-foreground font-mono">Bcrypt Authenticated</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  id="bayora-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-10 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2 font-mono">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition shadow-md shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating Principal…' : 'Sign In to Security Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Evaluator Profiles with Development Environment Banner */}
          <div className="pt-4 border-t border-border space-y-2.5 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-500 font-mono text-[11px] font-semibold">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>TEST / EVALUATION ENVIRONMENT PROFILES</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select an evaluator identity below to test specific RBAC roles (Dev Password pre-filled):
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="p-2 rounded-lg bg-background hover:bg-muted border border-border text-primary text-left transition-colors font-medium flex items-center justify-between"
              >
                <span>🛡️ admin</span>
                <span className="text-[10px] text-muted-foreground">SecOps</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('red_operator')}
                className="p-2 rounded-lg bg-background hover:bg-muted border border-border text-rose-400 text-left transition-colors font-medium flex items-center justify-between"
              >
                <span>🔴 red_operator</span>
                <span className="text-[10px] text-muted-foreground">Adversary</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('blue_defender')}
                className="p-2 rounded-lg bg-background hover:bg-muted border border-border text-blue-400 text-left transition-colors font-medium flex items-center justify-between"
              >
                <span>🔵 blue_defender</span>
                <span className="text-[10px] text-muted-foreground">Defense</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('auditor_sec')}
                className="p-2 rounded-lg bg-background hover:bg-muted border border-border text-emerald-400 text-left transition-colors font-medium flex items-center justify-between"
              >
                <span>📋 auditor_sec</span>
                <span className="text-[10px] text-muted-foreground">Audit</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleQuickFill('tenant2_admin')}
              className="w-full p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-left transition-colors text-[11px] font-mono flex items-center justify-between font-medium"
            >
              <span>⚠️ tenant2_admin</span>
              <span className="text-[10px]">Test 403 Cross-Tenant Isolation</span>
            </button>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="text-center text-[11px] text-muted-foreground font-mono">
          Strict deny-by-default RBAC & SHA-256 recursive cryptographic audit ledger active
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="p-2"></div>
    </div>
  );
};
