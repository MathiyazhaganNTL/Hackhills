import React from 'react';
import { Shield, ShieldAlert, Cpu, Lock, UserCheck, LogOut, RefreshCw } from 'lucide-react';
import { UserProfile, Role } from '../types';

interface NavbarProps {
  currentUser: UserProfile | null;
  onQuickSwitchRole: (username: string) => void;
  onLogout: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onQuickSwitchRole,
  onLogout,
  onRefreshData,
  isRefreshing
}) => {
  const roleBadges: Record<Role, { label: string; color: string; icon: any }> = {
    security_admin: { label: 'Security Admin', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: Shield },
    red_team: { label: 'Red Team Operator', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: ShieldAlert },
    blue_team: { label: 'Blue Team Defender', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Shield },
    auditor: { label: 'Auditor (Read-Only)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: UserCheck },
  };

  const currentBadge = currentUser ? roleBadges[currentUser.role] : null;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322] px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Platform Identifier */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">BAYORA</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              SEC-INFRA v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Isolated AI Red-Team & Safety Evaluation</p>
        </div>
      </div>

      {/* Quick Role & Tenant Switcher Bar for Evaluator Demonstration */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
        <span className="text-xs text-slate-400 px-2 font-mono flex items-center">
          <Lock className="w-3.5 h-3.5 mr-1 text-cyan-400" />
          Test Roles:
        </span>
        <button
          onClick={() => onQuickSwitchRole('admin')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'admin'
              ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Full Administrative privileges & policy management"
        >
          🛡️ Admin
        </button>
        <button
          onClick={() => onQuickSwitchRole('red_operator')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'red_operator'
              ? 'bg-rose-500 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Adversarial evaluation & jailbreak payloads"
        >
          🔴 Red Team
        </button>
        <button
          onClick={() => onQuickSwitchRole('blue_defender')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'blue_defender'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Defensive guardrails & mitigation status"
        >
          🔵 Blue Team
        </button>
        <button
          onClick={() => onQuickSwitchRole('auditor_sec')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'auditor_sec'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Read-only evidence review & audit verification"
        >
          📋 Auditor
        </button>
        <button
          onClick={() => onQuickSwitchRole('tenant2_admin')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'tenant2_admin'
              ? 'bg-amber-600 text-white font-semibold shadow-sm'
              : 'text-amber-400/80 hover:bg-slate-800'
          }`}
          title="Tenant 2 (Contractor) - Click to test cross-tenant 403 Forbidden denial"
        >
          ⚠️ Tenant 2
        </button>
      </div>

      {/* Right Controls: Refresh, Tenant, Profile */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition"
          title="Refresh telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {currentUser && (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{currentUser.full_name}</div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                {currentUser.tenant_name || currentUser.tenant_id}
              </div>
            </div>

            {currentBadge && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${currentBadge.color} hidden md:inline-flex items-center`}>
                <currentBadge.icon className="w-3.5 h-3.5 mr-1" />
                {currentBadge.label}
              </span>
            )}

            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
