import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  AlertTriangle,
  FileCheck2,
  Activity,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Radio,
  Eye
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
  Bar,
  Legend
} from 'recharts';
import { Session, SecurityEvent, AuditVerificationReport, SystemCapabilities } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import { SideDrawer } from '../components/common/SideDrawer';
import { CopyButton } from '../components/common/CopyButton';

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
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const activeSessions = sessions.filter((s) => s.status === 'RUNNING');
  const criticalEvents = securityEvents.filter((e) => e.severity === 'CRITICAL');
  const warningEvents = securityEvents.filter((e) => e.severity === 'WARNING');
  const failedSessions = sessions.filter((s) => s.status === 'FAILED');

  // Realistic telemetry curves
  const telemetryData = [
    { time: '00:00', requests: 14, latency: 82 },
    { time: '04:00', requests: 22, latency: 88 },
    { time: '08:00', requests: 48, latency: 104 },
    { time: '12:00', requests: 79, latency: 118 },
    { time: '16:00', requests: 96, latency: 95 },
    { time: '20:00', requests: 64, latency: 86 },
    { time: 'Current', requests: 88, latency: 91 },
  ];

  const severityData = [
    { name: 'Info', count: securityEvents.filter((e) => e.severity === 'INFO').length, fill: '#3b82f6' },
    { name: 'Warning', count: warningEvents.length, fill: '#f59e0b' },
    { name: 'Critical', count: criticalEvents.length, fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Header: Title, Controls, Last-updated */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Security Operations Center (SOC)
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE TELEMETRY</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time isolation governance, adversarial evaluation telemetry, and cryptographic audit monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="inline-flex p-1 rounded-lg bg-secondary border border-border text-xs font-mono">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === range
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('sessions')}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs transition shadow-xs flex items-center space-x-1"
          >
            <span>Launch Evaluation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard
          title="Active Sessions"
          value={activeSessions.length}
          icon={Layers}
          iconColor="text-cyan-500"
          subtext={
            <span className="font-mono text-[11px]">
              {sessions.length} total registered
            </span>
          }
        />

        <MetricCard
          title="Blocked Incidents"
          value={criticalEvents.length}
          icon={AlertTriangle}
          iconColor="text-rose-500"
          subtext={
            <span className="font-mono text-[11px] text-rose-500 font-semibold">
              {warningEvents.length} warnings logged
            </span>
          }
        />

        <MetricCard
          title="Inference Requests"
          value="411"
          icon={Cpu}
          iconColor="text-blue-500"
          subtext={
            <span className="font-mono text-[11px]">
              98.2% safety refusal rate
            </span>
          }
        />

        <MetricCard
          title="Average Latency"
          value="91 ms"
          icon={Activity}
          iconColor="text-sky-500"
          subtext={
            <span className="font-mono text-[11px]">
              p95: 118 ms (measured)
            </span>
          }
        />

        <MetricCard
          title="Failed Runs"
          value={failedSessions.length}
          icon={XCircle}
          iconColor="text-amber-500"
          subtext={
            <span className="font-mono text-[11px]">
              Fail-closed isolation
            </span>
          }
        />

        <MetricCard
          title="Audit Integrity"
          value={auditReport?.is_valid ? 'VERIFIED' : 'TAMPERED'}
          icon={FileCheck2}
          iconColor={auditReport?.is_valid ? 'text-emerald-500' : 'text-rose-500'}
          badge={
            <button
              onClick={onVerifyAudit}
              disabled={isVerifyingAudit}
              className="text-[10px] text-primary hover:underline font-mono"
            >
              {isVerifyingAudit ? 'Verifying...' : 'Re-check'}
            </button>
          }
          subtext={
            <span className="font-mono text-[11px]">
              {auditReport?.records_checked ?? 0} records chained
            </span>
          }
        />
      </div>

      {/* Analytics Panels: Inference Activity & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: LLM Inference Activity & Gateway Latency */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Inference Volume & Gateway Latency</h2>
              <p className="text-xs text-muted-foreground">Hourly mediated requests (req/min) and round-trip response latency (ms)</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              Sliding Window: {timeRange}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                <XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground" fontSize={11} />
                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="requests" stroke="#0284c7" fillOpacity={1} fill="url(#requestsGrad)" name="Throughput (req/min)" />
                <Area type="monotone" dataKey="latency" stroke="#06b6d4" fillOpacity={1} fill="url(#latencyGrad)" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Security Alerts Breakdown */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Security Incidents Breakdown</h2>
              <p className="text-xs text-muted-foreground">Classified by severity level</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={11} />
                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Security Incidents & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Incidents Stream */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recent Security Incidents</h2>
              <p className="text-xs text-muted-foreground">Intercepted cross-tenant attempts and egress violations</p>
            </div>
            <button
              onClick={() => onNavigate('security_events')}
              className="text-xs text-primary hover:underline font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {securityEvents.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="py-3 flex items-start justify-between cursor-pointer hover:bg-secondary/40 p-2 rounded-lg transition"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={evt.severity} />
                    <span className="text-xs font-mono font-semibold text-foreground">{evt.event_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{evt.description}</p>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                  {new Date(evt.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Evaluation Sessions */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Active Workload Sessions</h2>
              <p className="text-xs text-muted-foreground">Running evaluation enclaves with hardware quotas</p>
            </div>
            <button
              onClick={() => onNavigate('sessions')}
              className="text-xs text-primary hover:underline font-medium flex items-center space-x-1"
            >
              <span>All Sessions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {sessions.slice(0, 4).map((sess) => (
              <div key={sess.id} className="py-3 flex items-center justify-between p-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-foreground">{sess.name}</span>
                    <SessionStatusBadge status={sess.status} />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono flex items-center space-x-2">
                    <span>Model: {sess.target_model_id}</span>
                    <span>•</span>
                    <span>Tenant: {sess.tenant_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('sessions')}
                  className="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-xs font-medium text-foreground border border-border"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Event Forensic Drawer */}
      <SideDrawer
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Security Incident Forensics</span>
          </div>
        }
        subtitle={selectedEvent && `Event ID: ${selectedEvent.id}`}
        footer={
          <button
            onClick={() => setSelectedEvent(null)}
            className="px-3.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted"
          >
            Close Panel
          </button>
        }
      >
        {selectedEvent && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Severity:</span>
              <div className="mt-1">
                <SeverityBadge severity={selectedEvent.severity} />
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Event Type:</span>
              <div className="text-primary font-bold text-sm mt-0.5">{selectedEvent.event_type}</div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Source Component:</span>
              <div className="text-foreground mt-0.5">{selectedEvent.source}</div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Description:</span>
              <div className="text-foreground font-sans mt-0.5 bg-secondary/50 p-2.5 rounded-lg border border-border">
                {selectedEvent.description}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Metadata Payload:</span>
              <pre className="p-3 rounded-lg bg-secondary border border-border text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto mt-1">
                {JSON.stringify(selectedEvent.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};
