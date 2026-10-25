import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Crosshair,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  FileCheck2,
  BarChart3,
  Users,
  Server,
  Lock
} from 'lucide-react';
import { Role } from '../types';

export type ViewType =
  | 'dashboard'
  | 'sessions'
  | 'red_team'
  | 'blue_team'
  | 'gateway'
  | 'security_events'
  | 'audit'
  | 'reports'
  | 'admin'
  | 'system';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  userRole?: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, userRole }) => {
  const navItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'SOC Overview',
      icon: LayoutDashboard,
      roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
    },
    {
      id: 'sessions' as ViewType,
      label: 'Evaluation Sessions',
      icon: Layers,
      roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
    },
    {
      id: 'red_team' as ViewType,
      label: 'Red-Team Attack Lab',
      icon: Crosshair,
      roles: ['security_admin', 'red_team'],
      badge: 'Adversarial',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'blue_team' as ViewType,
      label: 'Blue-Team Guardrails',
      icon: ShieldCheck,
      roles: ['security_admin', 'blue_team'],
      badge: 'Defense',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'gateway' as ViewType,
      label: 'Secure LLM Gateway',
      icon: Cpu,
      roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
    },
    {
      id: 'security_events' as ViewType,
      label: 'Security Events',
      icon: AlertTriangle,
      roles: ['security_admin', 'auditor'],
    },
    {
      id: 'audit' as ViewType,
      label: 'Audit Hash-Chain',
      icon: FileCheck2,
      roles: ['security_admin', 'auditor'],
      badge: 'SHA-256',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'reports' as ViewType,
      label: 'Evidence & Reports',
      icon: BarChart3,
      roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
    },
    {
      id: 'admin' as ViewType,
      label: 'Admin & RBAC',
      icon: Users,
      roles: ['security_admin'],
    },
    {
      id: 'system' as ViewType,
      label: 'Host & Isolation Health',
      icon: Server,
      roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0a0f1d] flex flex-col justify-between select-none">
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
          Security Controls
        </div>

        {navItems.map((item) => {
          const isAllowed = userRole ? item.roles.includes(userRole) : true;
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 text-cyan-400 border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : isAllowed ? 'text-slate-400' : 'text-slate-600'
                  }`}
                />
                <span className={!isAllowed ? 'text-slate-500' : ''}>{item.label}</span>
              </div>

              {!isAllowed ? (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              ) : item.badge ? (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Footer Security Badge */}
      <div className="p-4 border-t border-slate-800/80 m-2 rounded-lg bg-slate-900/60 border">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold text-emerald-400">ISOLATION ACTIVE</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Deny-by-default egress & container sandbox policies enforced.
        </p>
      </div>
    </aside>
  );
};
