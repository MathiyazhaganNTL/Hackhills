import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileCheck2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Layers,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  Hash
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { EvaluationRun, EvaluationFinding, Session } from '../types';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { CopyButton } from '../components/common/CopyButton';
import { MetricCard } from '../components/common/MetricCard';

interface ReportsViewProps {
  runs: EvaluationRun[];
  findings: EvaluationFinding[];
  sessions: Session[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  runs,
  findings,
  sessions
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProof, setExportProof] = useState<string | null>(null);
  const [lastExportFormat, setLastExportFormat] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const chartData = runs.map((r) => ({
    name: r.benchmark_name.length > 18 ? r.benchmark_name.slice(0, 16) + '…' : r.benchmark_name,
    fullName: r.benchmark_name,
    Passed: r.passed_defenses,
    Bypassed: r.bypassed_defenses,
    rate: r.bypass_rate_pct,
  }));

  const totalTests = runs.reduce((acc, r) => acc + (r.total_tests || 0), 0);
  const totalPassed = runs.reduce((acc, r) => acc + (r.passed_defenses || 0), 0);
  const totalBypassed = runs.reduce((acc, r) => acc + (r.bypassed_defenses || 0), 0);
  const overallBypassRate = totalTests > 0 ? ((totalBypassed / totalTests) * 100).toFixed(1) : '0.0';

  const categories = ['ALL', ...Array.from(new Set(findings.map((f) => f.category)))];

  const filteredFindings = findings.filter((f) => {
    const matchesCat = selectedCategory === 'ALL' || f.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      f.test_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.prompt_sample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.mitigation_notes && f.mitigation_notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleDownload = async (format: 'json' | 'csv') => {
    if (!selectedSessionId) return;
    setIsExporting(true);
    setLastExportFormat(format.toUpperCase());
    try {
      const data = await api.exportEvidence(selectedSessionId, format);
      if (format === 'json') {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bayora_evidence_${selectedSessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (data.cryptographic_evidence_hash) {
          setExportProof(data.cryptographic_evidence_hash);
        }
      } else {
        const blob = new Blob([data as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bayora_evidence_${selectedSessionId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Evaluation Reports & Evidence Export
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparative benchmark scorecards, vulnerability classification, and SHA-256 verifiable evidence packages.
              </p>
            </div>
          </div>
        </div>

        {/* Export controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Session:</span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none font-mono cursor-pointer"
            >
              {sessions.length === 0 ? (
                <option value="">No Active Sessions</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                    {s.name} ({s.id.slice(0, 8)}…)
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => handleDownload('json')}
            disabled={isExporting || !selectedSessionId}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
            title="Download full JSON evidence package with cryptographic manifest"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>{isExporting && lastExportFormat === 'JSON' ? 'Exporting…' : 'Export JSON'}</span>
          </button>

          <button
            onClick={() => handleDownload('csv')}
            disabled={isExporting || !selectedSessionId}
            className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Download tabulated CSV findings report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isExporting && lastExportFormat === 'CSV' ? 'Exporting…' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Export verification banner */}
      {exportProof && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
              <FileCheck2 className="w-4 h-4 flex-shrink-0" />
            </div>
            <div className="truncate">
              <span className="font-bold uppercase tracking-wider text-[10px] block text-emerald-300">
                Authoritative Audit Digest (SHA-256):
              </span>
              <span className="font-mono text-xs">{exportProof}</span>
            </div>
          </div>
          <CopyButton text={exportProof} label="Copy Hash" />
        </div>
      )}

      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Aggregated Test Scenarios"
          value={totalTests}
          subtext="Across active benchmarks"
          icon={Layers}
          iconColor="text-cyan-500"
        />
        <MetricCard
          title="Defenses Held (Passed)"
          value={totalPassed}
          subtext="Guardrails blocked attack"
          icon={ShieldCheck}
          iconColor="text-emerald-500"
        />
        <MetricCard
          title="Bypasses Detected"
          value={totalBypassed}
          subtext="Vulnerabilities catalogued"
          icon={ShieldAlert}
          iconColor="text-rose-500"
        />
        <MetricCard
          title="Mean Bypass Rate"
          value={`${overallBypassRate}%`}
          subtext="Vulnerability exposure ratio"
          icon={AlertTriangle}
          iconColor={Number(overallBypassRate) > 30 ? 'text-rose-500' : 'text-amber-500'}
        />
      </div>

      {/* Benchmark Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {runs.map((run) => (
          <div
            key={run.id}
            className="p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold font-mono tracking-tight text-foreground block">
                  {run.benchmark_name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">ID: {run.id.slice(0, 8)}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono text-[10px] font-semibold uppercase">
                {run.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-2 rounded-lg bg-background border border-border">
                <div className="text-muted-foreground text-[10px] uppercase font-semibold">Total</div>
                <div className="text-foreground font-bold tabular-nums text-sm mt-0.5">{run.total_tests}</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-500 text-[10px] uppercase font-semibold">Safe</div>
                <div className="text-emerald-500 font-bold tabular-nums text-sm mt-0.5">{run.passed_defenses}</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-rose-400 text-[10px] uppercase font-semibold">Bypass</div>
                <div className="text-rose-400 font-bold tabular-nums text-sm mt-0.5">{run.bypassed_defenses}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground text-[11px]">Bypass Rate:</span>
              <span className={`font-bold tabular-nums ${run.bypass_rate_pct > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {run.bypass_rate_pct}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart: Benchmark Defenses Comparison */}
      <div className="p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Defensive Efficacy Comparison Across Benchmarks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified guardrail containment vs. adversarial bypass per evaluation suite
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-50" />
              <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={11} />
              <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  color: 'var(--card-foreground)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Passed" fill="#10b981" radius={[4, 4, 0, 0]} name="Defenses Held (Safe)" />
              <Bar dataKey="Bypassed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Bypassed (Vulnerable)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Catalogued Findings Section with Search and Filters */}
      <div className="p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <span>Catalogued Findings & Vulnerability Evidence</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono">
                {filteredFindings.length} Records
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individual safety test findings with redacted prompt context and remediation records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search findings…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-1 bg-background border border-border rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-popover text-popover-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="divide-y divide-border text-xs">
          {filteredFindings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No evaluation findings matched the current criteria.
            </div>
          ) : (
            filteredFindings.map((f) => (
              <div key={f.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-foreground">{f.test_id}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">[{f.category}]</span>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
                        f.mitigation_status === 'MITIGATED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-secondary text-secondary-foreground border-border'
                      }`}
                    >
                      {f.mitigation_status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {f.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="text-foreground font-mono text-[11px] bg-background p-3 rounded-lg border border-border">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Prompt Sample:</div>
                  <div className="text-muted-foreground select-all">{f.prompt_sample}</div>
                </div>

                {f.mitigation_notes && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] flex items-start space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span><strong>Mitigation Note:</strong> {f.mitigation_notes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
