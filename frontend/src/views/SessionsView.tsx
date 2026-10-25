import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Square,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Eye,
  Filter
} from 'lucide-react';
import { Session, ModelItem, IsolationPolicy, ExecutionProfile } from '../types';

interface SessionsViewProps {
  sessions: Session[];
  models: ModelItem[];
  policies: IsolationPolicy[];
  profiles: ExecutionProfile[];
  onSelectSession: (id: string) => void;
  onStartSession: (id: string) => Promise<void>;
  onTerminateSession: (id: string) => Promise<void>;
  onCreateSession: (payload: any) => Promise<void>;
  isActionLoading?: boolean;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  models,
  policies,
  profiles,
  onSelectSession,
  onStartSession,
  onTerminateSession,
  onCreateSession,
  isActionLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Session form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetModelId, setTargetModelId] = useState(models[0]?.id || 'llama-3-70b-instruct');
  const [isolationPolicyId, setIsolationPolicyId] = useState(policies[0]?.id || 'policy-hardened-01');
  const [executionProfileId, setExecutionProfileId] = useState(profiles[0]?.id || 'exec-profile-01');

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateSession({
      name,
      description,
      target_model_id: targetModelId,
      isolation_policy_id: isolationPolicyId,
      execution_profile_id: executionProfileId
    });
    setName('');
    setDescription('');
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            RUNNING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center w-max">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            COMPLETED
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center w-max">
            <Clock className="w-3.5 h-3.5 mr-1" />
            DRAFT
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center w-max">
            <Square className="w-3.5 h-3.5 mr-1" />
            TERMINATED
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center w-max">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>AI Safety Evaluation Sessions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Governed test sessions with strictly partitioned execution environments, models, and defensive policies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition shadow-sm flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sessions by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Session Name & ID</th>
                <th className="py-3 px-4">Target Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Isolation Tier</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No matching evaluation sessions found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{session.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{session.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {session.target_model_id}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                        Hardened-Sandbox
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {session.status === 'DRAFT' && (
                          <button
                            onClick={() => onStartSession(session.id)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                        )}

                        {session.status === 'RUNNING' && (
                          <button
                            onClick={() => onTerminateSession(session.id)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center space-x-1"
                          >
                            <Square className="w-3 h-3" />
                            <span>Terminate</span>
                          </button>
                        )}

                        <button
                          onClick={() => onSelectSession(session.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 border border-slate-700"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Session Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Create Evaluation Session</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AdvBench Jailbreak Resilience Evaluation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  placeholder="Evaluation scope, target parameters, and defensive ruleset."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 h-20"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Model Endpoint</label>
                <select
                  value={targetModelId}
                  onChange={(e) => setTargetModelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Isolation Policy</label>
                <select
                  value={isolationPolicyId}
                  onChange={(e) => setIsolationPolicyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (CPU: {p.cpu_limit_cores}c, Mem: {p.memory_limit_mb}MB, Egress: Whitelist)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Execution Profile</label>
                <select
                  value={executionProfileId}
                  onChange={(e) => setExecutionProfileId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {profiles.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} ({pr.runner_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
