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
  Lock,
  Download
} from 'lucide-react';
import { Session, IsolationPolicy } from '../types';
import { api } from '../services/api';

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
  onExportEvidence
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Sessions</span>
        </button>

        <div className="flex items-center space-x-2">
          {session.status === 'DRAFT' && (
            <button
              onClick={() => onStartSession(session.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center space-x-1 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Execution</span>
            </button>
          )}

          {session.status === 'RUNNING' && (
            <>
              <button
                onClick={() => onNavigateToRedTeam(session.id)}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs flex items-center space-x-1 shadow-sm"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Launch Red-Team Payload</span>
              </button>
              <button
                onClick={() => onTerminateSession(session.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs flex items-center space-x-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Terminate</span>
              </button>
            </>
          )}

          <button
            onClick={() => onExportEvidence(session.id, 'json')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Evidence</span>
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-slate-100">{session.name}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                {session.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">UUID: {session.id}</p>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Target Model: <span className="text-cyan-400 font-semibold">{session.target_model_id}</span></div>
            <div>Tenant: <span className="text-slate-300">{session.tenant_id}</span></div>
          </div>
        </div>

        {/* 4 Isolation Specs Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>cgroups v2 Quota</span>
            </div>
            <div className="text-sm font-bold text-slate-200 font-mono">
              {policy?.cpu_limit_cores ?? 2.0} vCPU / {policy?.memory_limit_mb ?? 2048} MB
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Enforced at runtime</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Network className="w-4 h-4 text-blue-400" />
              <span>Network Egress</span>
            </div>
            <div className="text-sm font-bold text-slate-200 font-mono">
              DEFAULT-DENY
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              Whitelist: [gateway.bayora.local]
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Filesystem Sandbox</span>
            </div>
            <div className="text-sm font-bold text-slate-200 font-mono">
              READ-ONLY ROOT
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Ephemeral isolated tmpfs
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Seccomp Sandbox</span>
            </div>
            <div className="text-sm font-bold text-slate-200 font-mono">
              STRICT-DEFAULT
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Host syscall interceptor
            </div>
          </div>
        </div>
      </div>

      {/* Defensive Guardrails Summary */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Assigned Blue-Team Defensive Rules</span>
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {session.blue_team_guardrail_config.pre_inference_regex?.map((rule, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono"
            >
              Filter: "{rule}"
            </span>
          )) || <span className="text-slate-500 font-mono">No active regex rules</span>}
        </div>
      </div>

      {/* Session Isolated Conversation History */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Isolated Session Conversation Log</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {history.length} turns recorded
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            Loading isolated memory store...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            No inference interactions recorded in this session yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {history.map((turn, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-xs font-mono ${
                  turn.role === 'user'
                    ? 'bg-slate-950 border border-slate-800 text-slate-200'
                    : 'bg-[#11192e] border border-blue-900/40 text-cyan-300'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center justify-between">
                  <span>{turn.role === 'user' ? 'Red-Team Operator Input' : 'Mediated Model Output'}</span>
                  <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="whitespace-pre-wrap">{turn.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
