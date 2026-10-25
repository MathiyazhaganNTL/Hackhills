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
  Layers
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

  const chartData = runs.map((r) => ({
    name: r.benchmark_name.slice(0, 16),
    Passed: r.passed_defenses,
    Bypassed: r.bypassed_defenses,
  }));

  const handleDownload = async (format: 'json' | 'csv') => {
    if (!selectedSessionId) return;
    setIsExporting(true);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>AI Safety Evaluation Reports & Evidence Export</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated safety benchmark scorecards, vulnerability breakdown, and tamper-evident evidence packages.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleDownload('json')}
            disabled={isExporting || !selectedSessionId}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center space-x-1 shadow-sm"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => handleDownload('csv')}
            disabled={isExporting || !selectedSessionId}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {exportProof && (
        <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
          <FileCheck2 className="w-4 h-4 flex-shrink-0" />
          <div className="truncate">
            <span className="font-bold">Cryptographic Evidence SHA-256 Hash: </span>
            <span>{exportProof}</span>
          </div>
        </div>
      )}

      {/* Benchmark Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {runs.map((run) => (
          <div
            key={run.id}
            className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">{run.benchmark_name}</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono text-[10px]">
                {run.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">TESTS</div>
                <div className="text-slate-100 font-bold">{run.total_tests}</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-emerald-400 text-[10px]">DEFENDED</div>
                <div className="text-emerald-400 font-bold">{run.passed_defenses}</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-rose-400 text-[10px]">BYPASS</div>
                <div className="text-rose-400 font-bold">{run.bypassed_defenses}</div>
              </div>
            </div>

            <div className="text-xs font-mono flex items-center justify-between text-slate-400 pt-1">
              <span>Bypass Rate:</span>
              <span className="text-rose-400 font-bold">{run.bypass_rate_pct}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart: Benchmark Defenses Comparison */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-200">Defensive Efficacy Comparison Across Benchmarks</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="Passed" fill="#10b981" radius={[4, 4, 0, 0]} name="Defenses Held (Safe)" />
              <Bar dataKey="Bypassed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Bypassed (Vulnerable)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Findings Table */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-200">Catalogued Findings & Vulnerability Evidence</h2>
        <div className="divide-y divide-slate-800 text-xs">
          {findings.map((f) => (
            <div key={f.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-200">{f.test_id}</span>
                  <span className="text-slate-500 font-mono">[{f.category}]</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      f.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {f.severity}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    f.mitigation_status === 'MITIGATED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {f.mitigation_status}
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800">
                Prompt Sample: {f.prompt_sample}
              </div>
              {f.mitigation_notes && (
                <div className="text-emerald-400 font-mono text-[11px]">
                  Mitigation Note: {f.mitigation_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
