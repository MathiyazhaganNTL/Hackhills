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
  Lock,
  ExternalLink
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
  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        {
          id: 'dashboard' as ViewType,
          label: 'SOC Dashboard',
          icon: LayoutDashboard,
          roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
        },
      ],
    },
    {
      group: 'EVALUATION & DEFENSE',
      items: [
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
          badge: 'ADVERSARIAL',
          badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
        },
        {
          id: 'blue_team' as ViewType,
          label: 'Blue-Team Guardrails',
          icon: ShieldCheck,
          roles: ['security_admin', 'blue_team'],
          badge: 'DEFENSE',
          badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
        },
        {
          id: 'reports' as ViewType,
          label: 'Reports & Evidence',
          icon: BarChart3,
          roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
        },
      ],
    },
    {
      group: 'SECURITY & GOVERNANCE',
      items: [
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
          badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        },
      ],
    },
    {
      group: 'SYSTEM & ADMIN',
      items: [
        {
          id: 'admin' as ViewType,
          label: 'Users & RBAC',
          icon: Users,
          roles: ['security_admin'],
        },
        {
          id: 'system' as ViewType,
          label: 'Host & Isolation Health',
          icon: Server,
          roles: ['security_admin', 'red_team', 'blue_team', 'auditor'],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xs flex flex-col justify-between select-none transition-colors">
      <div className="py-4 px-3 space-y-4">
        {navSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
              {sec.group}
            </div>

            {sec.items.map((item) => {
              const isAllowed = userRole ? item.roles.includes(userRole) : true;
              const isActive = currentView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30 font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-primary'
                          : isAllowed
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/40'
                      }`}
                    />
                    <span className={!isAllowed ? 'opacity-60' : ''}>{item.label}</span>
                  </div>

                  {!isAllowed ? (
                    <Lock className="w-3 h-3 text-muted-foreground/50" />
                  ) : item.badge ? (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Security Badge */}
      <div className="p-3.5 m-3 rounded-lg bg-secondary/80 border border-border text-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PERIMETER SECURE</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">v1.0</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Default-deny egress & container sandbox boundaries active.
        </p>
      </div>
    </aside>
  );
};
