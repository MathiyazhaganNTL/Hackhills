import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Shield,
  Cpu,
  Network,
  HardDrive,
  FileCheck2,
  Play,
  Square,
  Crosshair,
  Download,
  AlertTriangle,
  Clock,
  Layers,
  Terminal,
  FileText
} from 'lucide-react';
import { Session, IsolationPolicy } from '../types';
import { api } from '../services/api';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

interface SessionDetailViewProps {
  session: Session;
  policy?: IsolationPolicy;
  onBack: () => void;
  onStartSession: (id: string) => Promise<void>;
  onTerminateSession: (id: string) => Promise<void>;
  onNavigateToRedTeam: (sessionId: string) => void;
  onNavigateToAudit: () => void;
  onExportEvidence: (sessionId: string, format: 'json' | 'csv') => void;
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  session,
  policy,
  onBack,
  onStartSession,
  onTerminateSession,
  onNavigateToRedTeam,
  onNavigateToAudit,
  onExportEvidence,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'isolation' | 'resources' | 'history' | 'audit'
  >('overview');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await api.getSessionHistory(session.id);
        setHistory(res.turns || []);
      } catch (e) {
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [session.id]);

  const tabs = [
    { id: 'overview', label: 'Session Overview', icon: Layers },
    { id: 'isolation', label: 'Isolation Policy', icon: Shield },
    { id: 'resources', label: 'Resource Quotas', icon: Cpu },
    { id: 'history', label: `Inference Log (${history.length})`, icon: Terminal },
    { id: 'audit', label: 'Audit Records', icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Sessions</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {session.status === 'DRAFT' && (
            <button
              onClick={() => onStartSession(session.id)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Execution</span>
            </button>
          )}

          {session.status === 'RUNNING' && (
            <>
              <button
                onClick={() => onNavigateToRedTeam(session.id)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Launch Red-Team Payload</span>
              </button>
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs flex items-center space-x-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Terminate</span>
              </button>
            </>
          )}

          <button
            onClick={() => onExportEvidence(session.id, 'json')}
            className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-medium flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export Evidence</span>
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{session.name}</h1>
              <SessionStatusBadge status={session.status} />
            </div>
            <div className="text-xs text-muted-foreground font-mono flex items-center space-x-2">
              <span>UUID: {session.id}</span>
              <CopyButton text={session.id} />
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground font-mono">
            <div>Target Model: <span className="text-primary font-bold">{session.target_model_id}</span></div>
            <div>Tenant Boundary: <span className="text-foreground">{session.tenant_id}</span></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border text-xs font-mono space-x-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 border-b-2 font-medium flex items-center space-x-2 transition ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-foreground font-sans">
              {session.description || 'No detailed evaluation scope provided.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-secondary border border-border space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Hardware Quota</span>
                </div>
                <div className="text-sm font-bold font-mono text-foreground">
                  {policy?.cpu_limit_cores ?? 2.0} vCPU / {policy?.memory_limit_mb ?? 2048} MB
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">cgroups v2 governor</div>
              </div>

              <div className="p-3.5 rounded-lg bg-secondary border border-border space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                  <Network className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">Network Egress</span>
                </div>
                <div className="text-sm font-bold font-mono text-destructive">
                  DEFAULT-DENY
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  Allowlist: [gateway.bayora.local]
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-secondary border border-border space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">Root Filesystem</span>
                </div>
                <div className="text-sm font-bold font-mono text-foreground">
                  READ-ONLY ROOT
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Isolated ephemeral tmpfs
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-secondary border border-border space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold">Seccomp Filter</span>
                </div>
                <div className="text-sm font-bold font-mono text-foreground">
                  STRICT-DEFAULT
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Syscall interceptor
                </div>
              </div>
            </div>

            {/* Blue-Team Guardrail Summary */}
            <div className="p-4 rounded-lg bg-secondary/60 border border-border space-y-2 text-xs">
              <div className="font-bold text-foreground flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Assigned Blue-Team Defensive Rules</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                {session.blue_team_guardrail_config.pre_inference_regex?.map((rule, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-card text-foreground border border-border"
                  >
                    Filter: "{rule}"
                  </span>
                )) || <span className="text-muted-foreground">No active regex rules</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Isolation Policy Deep Dive */}
        {activeTab === 'isolation' && (
          <div className="space-y-4 pt-2 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-secondary/50 border border-border">
              <div className="font-bold text-foreground text-sm mb-2">Configured Policy vs Host Enforcement</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Configured Specification:</span>
                  <div>CPU Limit: {policy?.cpu_limit_cores ?? 2.0} cores</div>
                  <div>Memory Ceiling: {policy?.memory_limit_mb ?? 2048} MB</div>
                  <div>Network Ingress: DENIED</div>
                  <div>Network Egress Whitelist: {JSON.stringify(policy?.network_egress_whitelist ?? ['gateway.bayora.local'])}</div>
                  <div>Filesystem Root: READ-ONLY</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Runtime Enforcement Status:</span>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold">• Process Timeout Watchdog: ACTIVE (300s)</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold">• Ephemeral tmpfs Sandbox: ISOLATED</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold">• Egress Destination Filter: ENFORCED</div>
                  <div className="text-cyan-600 dark:text-cyan-400 font-semibold">• Fail-Closed Container Enclave: READY</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Resource Usage */}
        {activeTab === 'resources' && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                <div className="text-xs font-bold text-foreground">CPU Core Allocation</div>
                <div className="text-2xl font-bold font-mono text-primary tabular-nums">
                  {policy?.cpu_limit_cores ?? 2.0} Cores
                </div>
                <p className="text-[11px] text-muted-foreground">Hard cap governed via cgroups v2 / process execution timeouts.</p>
              </div>

              <div className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                <div className="text-xs font-bold text-foreground">Memory Ceiling</div>
                <div className="text-2xl font-bold font-mono text-primary tabular-nums">
                  {policy?.memory_limit_mb ?? 2048} MB
                </div>
                <p className="text-[11px] text-muted-foreground">OOM killer terminates runaway processes exceeding quota.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <div className="space-y-3 pt-2">
            {isLoadingHistory ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-mono">
                Loading isolated memory store...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-mono">
                No inference interactions recorded in this session yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {history.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-xs font-mono ${
                      turn.role === 'user'
                        ? 'bg-secondary border border-border text-foreground'
                        : 'bg-primary/10 border border-primary/20 text-primary'
                    }`}
                  >
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center justify-between">
                      <span>{turn.role === 'user' ? 'Red-Team Input Payload' : 'Mediated Model Output'}</span>
                      <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{turn.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Audit Records */}
        {activeTab === 'audit' && (
          <div className="space-y-3 pt-2 text-xs">
            <div className="p-4 rounded-lg bg-secondary/60 border border-border flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground">Cryptographic Audit Chain Evidence</div>
                <div className="text-[11px] text-muted-foreground">All lifecycle changes and inference turns are hashed into the append-only ledger.</div>
              </div>
              <button
                onClick={onNavigateToAudit}
                className="px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs"
              >
                Open Audit Verifier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Termination Confirmation */}
      <ConfirmationDialog
        isOpen={showTerminateConfirm}
        title="Confirm Session Termination"
        message="Terminating this session will immediately stop all running workloads and revoke network access. This action cannot be undone."
        confirmLabel="Terminate Session"
        isDestructive={true}
        onConfirm={async () => {
          await onTerminateSession(session.id);
          setShowTerminateConfirm(false);
        }}
        onCancel={() => setShowTerminateConfirm(false)}
      />
    </div>
  );
};
