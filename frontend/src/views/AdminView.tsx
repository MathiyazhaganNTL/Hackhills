import React, { useState } from 'react';
import {
  Users,
  Shield,
  Lock,
  Key,
  Check,
  X,
  Server,
  Search,
  Filter,
  Layers,
  Cpu,
  HardDrive,
  Network,
  Info,
  ShieldCheck,
  Building
} from 'lucide-react';
import { UserProfile, IsolationPolicy } from '../types';
import { CopyButton } from '../components/common/CopyButton';

interface AdminViewProps {
  users: UserProfile[];
  policies: IsolationPolicy[];
}

export const AdminView: React.FC<AdminViewProps> = ({ users, policies }) => {
  const [userSearch, setUserSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('ALL');

  const permissionsMatrix = [
    { permission: 'Manage Users & Roles', admin: true, red: false, blue: false, auditor: false, desc: 'Create, update, and manage tenant users and identities' },
    { permission: 'Configure Isolation Policies', admin: true, red: false, blue: false, auditor: false, desc: 'Modify cgroups quotas, seccomp filters, and storage limits' },
    { permission: 'Create / Terminate Sessions', admin: true, red: false, blue: false, auditor: false, desc: 'Lifecycle transition control of sandbox containers' },
    { permission: 'View Sessions (Tenant-Scoped)', admin: true, red: true, blue: true, auditor: true, desc: 'Read session telemetry within authenticated tenant boundary' },
    { permission: 'Execute Red-Team Probes', admin: true, red: true, blue: false, auditor: false, desc: 'Trigger adversarial safety benchmarks against LLM endpoints' },
    { permission: 'Configure Blue-Team Guardrails', admin: true, red: false, blue: true, auditor: false, desc: 'Define regex filters, toxicity limits, and block actions' },
    { permission: 'Record Mitigation Workflows', admin: true, red: false, blue: true, auditor: false, desc: 'Acknowledge, remediate, and mark findings as mitigated' },
    { permission: 'Invoke Model Gateway', admin: true, red: true, blue: true, auditor: false, desc: 'Send inference queries through rate-limited redaction gateway' },
    { permission: 'View Security Events', admin: true, red: false, blue: false, auditor: true, desc: 'Inspect egress violations, quota breaches, and policy alarms' },
    { permission: 'Inspect Audit Hash-Chain', admin: true, red: false, blue: false, auditor: true, desc: 'Query immutable sequential append-only ledger entries' },
    { permission: 'Verify Audit Integrity', admin: true, red: false, blue: false, auditor: true, desc: 'Execute SHA-256 recursive mathematical cryptographic verification' },
    { permission: 'Export Evidence Packages', admin: true, red: false, blue: true, auditor: true, desc: 'Download verifiable cryptographic JSON/CSV evidence archives' },
  ];

  const tenants = ['ALL', ...Array.from(new Set(users.map((u) => u.tenant_id)))];

  const filteredUsers = users.filter((u) => {
    const matchesTenant = tenantFilter === 'ALL' || u.tenant_id === tenantFilter;
    const matchesSearch =
      !userSearch ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.tenant_id.toLowerCase().includes(userSearch.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Administration & RBAC Matrix
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-tenant access governance, deny-by-default role authorization, and isolation profiles.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-tenant isolation disclaimer badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted-foreground">
          <Building className="w-4 h-4 text-primary" />
          <span>Tenant Enforcement: <strong>Strict SQL Filter (Fail-Closed)</strong></span>
        </div>
      </div>

      {/* Users Directory */}
      <div className="p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <span>Tenant Users & Assigned Roles</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono">
                {filteredUsers.length} Users
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorized operator identities and tenant scope assignments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search operators…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44"
              />
            </div>

            {/* Tenant Filter */}
            <div className="flex items-center space-x-1 bg-background border border-border rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t} value={t} className="bg-popover text-popover-foreground">
                    Tenant: {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3 font-sans">Full Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Tenant Boundary</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-sans">
                    No users matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-primary">{u.username}</td>
                    <td className="py-2.5 px-3 font-sans font-medium">{u.full_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border text-[11px] font-medium">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px]">
                        {u.tenant_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <CopyButton text={u.id} label="User ID" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Deny-by-Default Role Permission Matrix</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enforced cryptographically and programmatically at FastAPI router dependencies. Client-side state has no bypass ability.
            </p>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorized</span>
            </span>
            <span className="flex items-center space-x-1">
              <X className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
              <span>Denied (403)</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-mono uppercase text-[11px] border-b border-border">
              <tr>
                <th className="py-3 px-3">Permission Scope & Operational Impact</th>
                <th className="py-3 px-3 text-center">Security Admin</th>
                <th className="py-3 px-3 text-center">Red Team</th>
                <th className="py-3 px-3 text-center">Blue Team</th>
                <th className="py-3 px-3 text-center">Compliance Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground font-mono">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-sans">
                    <div className="font-semibold text-foreground">{row.permission}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{row.desc}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.admin ? (
                      <div className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex p-1 rounded-full bg-muted text-muted-foreground opacity-40">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.red ? (
                      <div className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex p-1 rounded-full bg-muted text-muted-foreground opacity-40">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.blue ? (
                      <div className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex p-1 rounded-full bg-muted text-muted-foreground opacity-40">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.auditor ? (
                      <div className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex p-1 rounded-full bg-muted text-muted-foreground opacity-40">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configured Isolation Policies Directory */}
      <div className="p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Active Tenant Isolation Policy Profiles</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            cgroups v2 resource ceilings, seccomp profiles, and network containment parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-background border border-border space-y-3 shadow-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground font-mono">{p.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">ID: {p.id.slice(0, 8)}</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span>CPU Limit:</span>
                  </span>
                  <span className="text-foreground font-bold">{p.cpu_limit_cores} Cores</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Memory Limit:</span>
                  </span>
                  <span className="text-foreground font-bold">{p.memory_limit_mb} MB</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center space-x-1.5">
                    <Network className="w-3.5 h-3.5 text-amber-400" />
                    <span>Egress Whitelist:</span>
                  </span>
                  <span className="text-amber-400 font-bold font-mono text-[11px] truncate max-w-[130px]">
                    {p.network_egress_whitelist?.length > 0 ? p.network_egress_whitelist.join(', ') : 'DEFAULT DENY'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
                  <span>Seccomp Profile:</span>
                  <span className="text-emerald-400 font-bold">
                    {p.seccomp_profile_name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
