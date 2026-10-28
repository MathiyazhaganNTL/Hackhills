import React from 'react';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  LogOut,
  RefreshCw,
  FlaskConical,
  Radio
} from 'lucide-react';
import { UserProfile, Role } from '../types';
import { ThemeSwitcher } from './common/ThemeSwitcher';
import { SimulationNotice } from './common/SimulationNotice';

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
  isRefreshing,
}) => {
  const roleBadges: Record<Role, { label: string; color: string; icon: any }> = {
    security_admin: { label: 'Security Admin', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', icon: Shield },
    red_team: { label: 'Red Team Operator', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', icon: ShieldAlert },
    blue_team: { label: 'Blue Team Defender', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: Shield },
    auditor: { label: 'Auditor (Read-Only)', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: UserCheck },
  };

  const currentBadge = currentUser ? roleBadges[currentUser.role] : null;

  return (
    <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 select-none transition-colors">
      {/* Brand & Platform Identifier */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xs">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base tracking-wider text-foreground font-mono">BAYORA</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-secondary text-primary border border-border">
              SEC-INFRA v1.0
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            AI Red-Teaming & Safety Infrastructure Console
          </p>
        </div>
      </div>

      {/* Development-Only Role Switcher Bar */}
      <div className="hidden xl:flex items-center space-x-1.5 bg-secondary/80 p-1 rounded-lg border border-border">
        <div className="flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase font-bold border-r border-border mr-1">
          <FlaskConical className="w-3 h-3 mr-1 text-amber-500" />
          <span>Dev Roles:</span>
        </div>

        <button
          onClick={() => onQuickSwitchRole('admin')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'admin'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
          title="Security Administrator: full administrative control"
        >
          🛡️ Admin
        </button>

        <button
          onClick={() => onQuickSwitchRole('red_operator')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'red_operator'
              ? 'bg-rose-600 text-white font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
          title="Red Team: execute adversarial evaluation probes"
        >
          🔴 Red Team
        </button>

        <button
          onClick={() => onQuickSwitchRole('blue_defender')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'blue_defender'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
          title="Blue Team: defensive rules & mitigation tracker"
        >
          🔵 Blue Team
        </button>

        <button
          onClick={() => onQuickSwitchRole('auditor_sec')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'auditor_sec'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
          title="Auditor: read-only evidence & audit hash verification"
        >
          📋 Auditor
        </button>

        <button
          onClick={() => onQuickSwitchRole('tenant2_admin')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            currentUser?.username === 'tenant2_admin'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : 'text-amber-600 dark:text-amber-400 hover:bg-card'
          }`}
          title="Contractor Tenant 2: verify cross-tenant denial (403 Forbidden)"
        >
          ⚠️ Tenant 2
        </button>
      </div>

      {/* Right Controls: ThemeSwitcher, Refresh, Profile */}
      <div className="flex items-center space-x-3">
        {/* Live Scrape Status Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded bg-secondary text-[11px] font-mono text-muted-foreground border border-border">
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Telemetry Scrape Active</span>
        </div>

        <ThemeSwitcher />

        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition"
          title="Refresh telemetry"
          aria-label="Refresh telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        </button>

        {currentUser && (
          <div className="flex items-center space-x-2.5 pl-2 border-l border-border">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-foreground">{currentUser.full_name}</div>
              <div className="text-[11px] text-muted-foreground font-mono flex items-center justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                {currentUser.tenant_name || currentUser.tenant_id}
              </div>
            </div>

            {currentBadge && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${currentBadge.color} hidden lg:inline-flex items-center`}>
                <currentBadge.icon className="w-3.5 h-3.5 mr-1" />
                {currentBadge.label}
              </span>
            )}

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
