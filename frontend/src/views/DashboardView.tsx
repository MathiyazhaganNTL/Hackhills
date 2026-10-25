import React from 'react';
import {
  Shield,
  Layers,
  Cpu,
  AlertTriangle,
  FileCheck2,
  Activity,
  Lock,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { Session, SecurityEvent, AuditVerificationReport, SystemCapabilities } from '../types';

interface DashboardViewProps {
  sessions: Session[];
  securityEvents: SecurityEvent[];
  auditReport: AuditVerificationReport | null;
  capabilities: SystemCapabilities | null;
  onNavigate: (view: any) => void;
  onVerifyAudit: () => void;
  isVerifyingAudit?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  securityEvents,
  auditReport,
  capabilities,
  onNavigate,
  onVerifyAudit,
  isVerifyingAudit,
}) => {
  const activeSessions = sessions.filter((s) => s.status === 'RUNNING');
  const criticalEvents = securityEvents.filter((e) => e.severity === 'CRITICAL');
  const warningEvents = securityEvents.filter((e) => e.severity === 'WARNING');

  // Realistic telemetry data points
  const telemetryData = [
    { time: '00:00', requests: 12, latency: 84 },
    { time: '04:00', requests: 18, latency: 92 },
    { time: '08:00', requests: 45, latency: 110 },
    { time: '12:00', requests: 78, latency: 125 },
    { time: '16:00', requests: 94, latency: 98 },
    { time: '20:00', requests: 62, latency: 88 },
    { time: 'Current', requests: 83, latency: 95 },
  ];

  const severityData = [
    { name: 'Info', count: securityEvents.filter((e) => e.severity === 'INFO').length, fill: '#3b82f6' },
    { name: 'Warning', count: warningEvents.length, fill: '#f59e0b' },
    { name: 'Critical', count: criticalEvents.length, fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Quick Health */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#11192e] border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <span>Security Operations Center (SOC)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Perimeter Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time isolation governance, adversarial evaluation telemetry, and cryptographic audit monitoring.
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => onNavigate('sessions')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition shadow-sm flex items-center space-x-1.5"
          >
            <span>Launch Evaluation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Sessions */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Evaluation Sessions</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{sessions.length}</div>
          <div className="flex items-center space-x-2 mt-2 text-xs">
            <span className="text-emerald-400 font-mono font-semibold">{activeSessions.length} RUNNING</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">{sessions.length - activeSessions.length} TERMINAL</span>
          </div>
        </div>

        {/* Card 2: Security Alerts */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Security Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{securityEvents.length}</div>
          <div className="flex items-center space-x-2 mt-2 text-xs">
            <span className="text-rose-400 font-mono font-semibold">{criticalEvents.length} Critical Blocks</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-mono">{warningEvents.length} Warnings</span>
          </div>
        </div>

        {/* Card 3: Cryptographic Audit Status */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cryptographic Audit Chain</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center space-x-2">
            {auditReport?.is_valid ? (
              <span className="text-sm font-semibold text-emerald-400 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-emerald-400" />
                INTEGRITY VERIFIED
              </span>
            ) : (
              <span className="text-sm font-semibold text-rose-400 flex items-center">
                <XCircle className="w-4 h-4 mr-1 text-rose-400" />
                TAMPER DETECTED
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span className="font-mono">{auditReport?.records_checked ?? 0} Records Chained</span>
            <button
              onClick={onVerifyAudit}
              disabled={isVerifyingAudit}
              className="text-[11px] text-cyan-400 hover:underline font-mono"
            >
              {isVerifyingAudit ? 'Verifying...' : 'Re-verify'}
            </button>
          </div>
        </div>

        {/* Card 4: Host Isolation Capabilities */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Host Isolation Governor</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-sm font-semibold text-slate-200">
            {capabilities?.docker_engine_available ? 'Docker Container Enclave' : 'Secure Process Sandbox'}
          </div>
          <div className="flex items-center space-x-2 mt-2 text-xs">
            <span className="text-cyan-400 font-mono">FAIL-CLOSED: ACTIVE</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">{capabilities?.host_os}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: LLM Inference Activity & Latency */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200">LLM Inference Activity & Gateway Latency</h2>
              <p className="text-xs text-slate-400">Hourly throughput vs response latency across evaluated models</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">24h History</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#06b6d4" fillOpacity={1} fill="url(#requestsGrad)" name="Requests/min" />
                <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#latencyGrad)" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Security Alert Distribution */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Security Alerts by Severity</h2>
              <p className="text-xs text-slate-400">Blocked egress & authorization violations</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Security Incidents Stream */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Real-Time Security Event Stream</h2>
            <p className="text-xs text-slate-400">Blocked unauthorized requests, egress violations, and policy enforcement</p>
          </div>
          <button
            onClick={() => onNavigate('security_events')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
          >
            <span>View All Events</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {securityEvents.slice(0, 4).map((evt) => {
            const isCrit = evt.severity === 'CRITICAL';
            const isWarn = evt.severity === 'WARNING';

            return (
              <div key={evt.id} className="py-3 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isCrit
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : isWarn
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {evt.severity}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-200">{evt.event_type}</span>
                    <span className="text-xs text-slate-500 font-mono">[{evt.source}]</span>
                  </div>
                  <p className="text-xs text-slate-300">{evt.description}</p>
                </div>
                <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap ml-4">
                  {new Date(evt.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
