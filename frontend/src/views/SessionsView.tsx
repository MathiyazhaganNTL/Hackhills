import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Square,
  Search,
  Filter,
  Eye,
  Shield,
  Cpu,
  Network,
  Check,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { Session, ModelItem, IsolationPolicy, ExecutionProfile } from '../types';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

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
  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(null);

  // Wizard state: 4 steps
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetModelId, setTargetModelId] = useState(models[0]?.id || 'llama-3-70b-instruct');
  const [isolationPolicyId, setIsolationPolicyId] = useState(policies[0]?.id || 'policy-hardened-01');
  const [executionProfileId, setExecutionProfileId] = useState(profiles[0]?.id || 'exec-profile-01');

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenWizard = () => {
    setWizardStep(1);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateSession({
      name,
      description,
      target_model_id: targetModelId,
      isolation_policy_id: isolationPolicyId,
      execution_profile_id: executionProfileId,
    });
    setIsModalOpen(false);
  };

  const handleConfirmTerminate = async () => {
    if (!sessionToTerminate) return;
    await onTerminateSession(sessionToTerminate);
    setSessionToTerminate(null);
  };

  const selectedModel = models.find((m) => m.id === targetModelId);
  const selectedPolicy = policies.find((p) => p.id === isolationPolicyId);
  const selectedProfile = profiles.find((p) => p.id === executionProfileId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>AI Safety Evaluation Sessions</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Governed test sessions with strictly partitioned execution environments, models, and defensive policies.
          </p>
        </div>

        <button
          onClick={handleOpenWizard}
          className="px-3.5 py-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs transition shadow-xs flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Session Wizard</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sessions by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="QUEUED">Queued</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
            <option value="TERMINATED">Terminated</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px] border-b border-border tracking-wider">
              <tr>
                <th className="py-3 px-4">Session Name & Identifier</th>
                <th className="py-3 px-4">Target Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Isolation Profile</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-mono">
                    No matching evaluation sessions found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-secondary/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{session.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center space-x-1 mt-0.5">
                        <span>{session.id}</span>
                        <CopyButton text={session.id} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-primary">
                      {session.target_model_id}
                    </td>
                    <td className="py-3 px-4">
                      <SessionStatusBadge status={session.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[11px]">
                        Hardened-Sandbox
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {session.status === 'DRAFT' && (
                          <button
                            onClick={() => onStartSession(session.id)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                        )}

                        {session.status === 'RUNNING' && (
                          <button
                            onClick={() => setSessionToTerminate(session.id)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1"
                          >
                            <Square className="w-3 h-3" />
                            <span>Terminate</span>
                          </button>
                        )}

                        <button
                          onClick={() => onSelectSession(session.id)}
                          className="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground text-xs font-medium flex items-center space-x-1 border border-border"
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

      {/* 4-Step Create Session Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-foreground flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>New Evaluation Session Wizard</span>
                </h2>
                <div className="text-xs text-muted-foreground">
                  Step {wizardStep} of 4: {
                    wizardStep === 1 ? 'Session Details' :
                    wizardStep === 2 ? 'Model Configuration' :
                    wizardStep === 3 ? 'Isolation & Security Policy' :
                    'Review & Confirmation'
                  }
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Wizard Steps Stepper Bar */}
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              {[
                { num: 1, label: 'Identity' },
                { num: 2, label: 'Model' },
                { num: 3, label: 'Isolation' },
                { num: 4, label: 'Review' },
              ].map((step) => (
                <div
                  key={step.num}
                  className={`p-2 rounded border text-center transition ${
                    wizardStep === step.num
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : wizardStep > step.num
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'bg-secondary border-border text-muted-foreground'
                  }`}
                >
                  <div className="text-[10px] uppercase">{step.label}</div>
                  <div className="text-[11px]">{wizardStep > step.num ? '✓ Done' : `Step ${step.num}`}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Session Details */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-foreground font-medium mb-1">Session Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HarmBench v2 Jailbreak Safety Evaluation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Evaluation scope, target parameters, and defensive ruleset."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Model Configuration */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-foreground font-medium mb-1">Target Model Endpoint *</label>
                  <select
                    value={targetModelId}
                    onChange={(e) => setTargetModelId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider}) — Limit: {m.token_rate_limit_rpm} RPM
                      </option>
                    ))}
                  </select>
                </div>

                {selectedModel && (
                  <div className="p-3 rounded-lg bg-secondary border border-border space-y-1 font-mono text-[11px]">
                    <div className="text-primary font-bold">{selectedModel.name}</div>
                    <div className="text-muted-foreground">{selectedModel.description}</div>
                    <div className="text-foreground pt-1 flex items-center space-x-3">
                      <span>Rate Limit: {selectedModel.token_rate_limit_rpm} req/min</span>
                      <span>•</span>
                      <span>Context: {selectedModel.context_window} tokens</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Isolation Policy */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-foreground font-medium mb-1">Isolation Policy Profile *</label>
                  <select
                    value={isolationPolicyId}
                    onChange={(e) => setIsolationPolicyId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (CPU: {p.cpu_limit_cores}c, Mem: {p.memory_limit_mb}MB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1">Execution Profile Runtime *</label>
                  <select
                    value={executionProfileId}
                    onChange={(e) => setExecutionProfileId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    {profiles.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name} ({pr.runner_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-secondary border border-border space-y-1 text-[11px] font-mono text-muted-foreground">
                  <div className="text-foreground font-bold flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Hardened Security Enforcements:</span>
                  </div>
                  <div>• Default-deny network egress policy</div>
                  <div>• Ephemeral isolated workspace sandbox</div>
                  <div>• Stripped credential environment variables</div>
                </div>
              </div>
            )}

            {/* Step 4: Review and Create */}
            {wizardStep === 4 && (
              <div className="space-y-3 text-xs font-mono bg-secondary/50 p-4 rounded-lg border border-border">
                <div className="text-foreground font-bold text-sm">{name || 'Untitled Session'}</div>
                <div className="text-muted-foreground text-[11px] font-sans">{description || 'No description provided.'}</div>
                <div className="pt-2 border-t border-border space-y-1 text-[11px]">
                  <div><span className="text-muted-foreground">TARGET MODEL:</span> <span className="text-primary font-bold">{targetModelId}</span></div>
                  <div><span className="text-muted-foreground">ISOLATION POLICY:</span> <span className="text-foreground">{selectedPolicy?.name}</span></div>
                  <div><span className="text-muted-foreground">RUNNER TYPE:</span> <span className="text-foreground">{selectedProfile?.runner_type}</span></div>
                  <div><span className="text-muted-foreground">INITIAL STATUS:</span> <span className="text-emerald-500 font-bold">DRAFT</span></div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep > 1) setWizardStep((prev) => (prev - 1) as any);
                  else setIsModalOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              >
                {wizardStep === 1 ? 'Cancel' : 'Previous'}
              </button>

              {wizardStep < 4 ? (
                <button
                  type="button"
                  disabled={wizardStep === 1 && !name.trim()}
                  onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                  className="px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs flex items-center space-x-1 disabled:opacity-50"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitCreate}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Create Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Session Termination */}
      <ConfirmationDialog
        isOpen={Boolean(sessionToTerminate)}
        title="Confirm Session Termination"
        message="Terminating this session will immediately halt running evaluation workloads, release sandbox resources, and seal the audit log. This action is terminal."
        confirmLabel="Terminate Workload"
        isDestructive={true}
        onConfirm={handleConfirmTerminate}
        onCancel={() => setSessionToTerminate(null)}
      />
    </div>
  );
};
