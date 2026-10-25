import React from 'react';
import {
  Users,
  Shield,
  Lock,
  Key,
  Check,
  X,
  Server
} from 'lucide-react';
import { UserProfile, IsolationPolicy } from '../types';

interface AdminViewProps {
  users: UserProfile[];
  policies: IsolationPolicy[];
}

export const AdminView: React.FC<AdminViewProps> = ({ users, policies }) => {
  const permissionsMatrix = [
    { permission: 'Manage Users & Roles', admin: true, red: false, blue: false, auditor: false },
    { permission: 'Configure Isolation Policies', admin: true, red: false, blue: false, auditor: false },
    { permission: 'Create / Terminate Sessions', admin: true, red: false, blue: false, auditor: false },
    { permission: 'View Sessions (Tenant-Scoped)', admin: true, red: true, blue: true, auditor: true },
    { permission: 'Execute Red-Team Probes', admin: true, red: true, blue: false, auditor: false },
    { permission: 'Configure Blue-Team Guardrails', admin: true, red: false, blue: true, auditor: false },
    { permission: 'Record Mitigation Workflows', admin: true, red: false, blue: true, auditor: false },
    { permission: 'Invoke Model Gateway', admin: true, red: true, blue: true, auditor: false },
    { permission: 'View Security Events', admin: true, red: false, blue: false, auditor: true },
    { permission: 'Inspect Audit Hash-Chain', admin: true, red: false, blue: false, auditor: true },
    { permission: 'Verify Audit Integrity', admin: true, red: false, blue: false, auditor: true },
    { permission: 'Export Evidence Packages', admin: true, red: false, blue: true, auditor: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <span>User, Role & Multi-Tenant Administration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deny-by-default RBAC policies, strict tenant boundaries, and cryptographic capability governance.
        </p>
      </div>

      {/* Users Directory */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-200">Tenant Users & Assigned Roles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Tenant ID</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{u.username}</td>
                  <td className="py-2.5 px-3 font-sans">{u.full_name}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{u.tenant_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Deny-by-Default Role Permission Matrix</span>
        </h2>
        <p className="text-xs text-slate-400">
          Enforced strictly at the API layer on every endpoint using dependency injection. No client-side bypass is possible.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Permission Scope</th>
                <th className="py-2.5 px-3 text-center">Security Admin</th>
                <th className="py-2.5 px-3 text-center">Red Team</th>
                <th className="py-2.5 px-3 text-center">Blue Team</th>
                <th className="py-2.5 px-3 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{row.permission}</td>
                  <td className="py-2.5 px-3 text-center">
                    {row.admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.red ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.blue ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.auditor ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
