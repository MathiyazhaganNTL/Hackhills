import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Filter,
  Layers,
  FileEdit,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Session, EvaluationFinding } from '../types';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';

interface BlueTeamViewProps {
  sessions: Session[];
  findings: EvaluationFinding[];
  onRefreshData?: () => void;
}

export const BlueTeamView: React.FC<BlueTeamViewProps> = ({
  sessions,
  findings,
  onRefreshData,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Guardrail state
  const [rules, setRules] = useState<string[]>(
    selectedSession?.blue_team_guardrail_config?.pre_inference_regex || [
      'ignore previous instructions',
      'sudo mode',
      'dan prompt',
      'system override',
    ]
  );
  const [newRule, setNewRule] = useState('');
  const [toxicityThreshold, setToxicityThreshold] = useState<number>(
    selectedSession?.blue_team_guardrail_config?.semantic_toxicity_threshold || 0.65
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Finding mitigation modal
  const [mitigatingFindingId, setMitigatingFindingId] = useState<string | null>(null);
  const [mitigationStatus, setMitigationStatus] = useState<string>('MITIGATED');
  const [mitigationNotes, setMitigationNotes] = useState<string>('');

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    if (!rules.includes(newRule.trim())) {
      setRules([...rules, newRule.trim()]);
    }
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSaveGuardrails = async () => {
    if (!selectedSessionId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateGuardrails(selectedSessionId, {
        pre_inference_regex: rules,
        semantic_toxicity_threshold: toxicityThreshold,
        refusal_override_prevention: true,
        pii_redaction_enabled: true,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      alert('Failed to deploy defensive guardrails');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMitigateFinding = async (findingId: string) => {
    try {
      await api.updateFindingMitigation(findingId, mitigationStatus, mitigationNotes);
      setMitigatingFindingId(null);
      setMitigationNotes('');
      if (onRefreshData) onRefreshData();
    } catch (e) {
      alert('Failed to record mitigation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span>Blue-Team Defensive Guardrails & Mitigations</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure pre-inference inspection rules, semantic thresholds, and manage safety remediation workflows.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Defensive Pipeline Active</span>
          </span>
        </div>
      </div>

      {/* Target Session Selection Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-muted-foreground font-medium">Session Guardrail Target:</span>
          <select
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(e.target.value);
              const s = sessions.find((item) => item.id === e.target.value);
              if (s?.blue_team_guardrail_config?.pre_inference_regex) {
                setRules(s.blue_team_guardrail_config.pre_inference_regex);
              }
            }}
            className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-muted-foreground">
          <span>Active Rules: {rules.length}</span>
        </div>
      </div>

      {/* Grid: Rules Manager vs Remediation Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guardrail Rules Configuration */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Filter className="w-4 h-4 text-primary" />
              <span>Pre-Inference Regex & Keyword Filters</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">{rules.length} Active Rules</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="e.g. bypass safety, base64 payload, sudo mode..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              onClick={handleAddRule}
              className="px-3.5 py-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary border border-border text-xs font-mono text-foreground"
              >
                <span>"{rule}"</span>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="text-muted-foreground hover:text-destructive transition p-1"
                  aria-label="Remove rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Toxicity Slider (Range: 0.1 - 0.9) */}
          <div className="pt-3 border-t border-border space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between text-foreground mb-1">
                <span className="flex items-center font-medium">
                  <Sliders className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  Semantic Toxicity Threshold (0.1 - 0.9):
                </span>
                <span className="font-mono text-primary font-bold">{toxicityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={toxicityThreshold}
                onChange={(e) => setToxicityThreshold(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-0.5">
                <span>0.1 (Strict Blocking)</span>
                <span>0.9 (Permissive Pass)</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                * Note: Score evaluation requires active model scoring integration.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveGuardrails}
            disabled={isSaving}
            className="w-full py-2.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Deploying to Gateway...' : 'Deploy Defensive Guardrails'}</span>
          </button>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-1.5 font-mono">
              <CheckCircle className="w-4 h-4" />
              <span>Guardrails deployed and synchronized with LLM Gateway!</span>
            </div>
          )}
        </div>

        {/* Findings Remediation Tracker */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Safety Findings & Remediation Tracker</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">{findings.length} Catalogued</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
            {findings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-mono">
                No safety vulnerabilities or findings recorded.
              </div>
            ) : (
              findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-3.5 rounded-lg bg-secondary border border-border space-y-2 hover:border-slate-400 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">{finding.test_id}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        finding.mitigation_status === 'MITIGATED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : finding.mitigation_status === 'UNDER_REVIEW'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {finding.mitigation_status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={finding.severity} />
                    <span className="text-foreground font-medium">{finding.category}</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono line-clamp-2 bg-card p-2 rounded border border-border">
                    Prompt Sample: {finding.prompt_sample}
                  </div>

                  {finding.mitigation_notes && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Remediation Note: {finding.mitigation_notes}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setMitigatingFindingId(finding.id);
                        setMitigationStatus(finding.mitigation_status);
                        setMitigationNotes(finding.mitigation_notes || '');
                      }}
                      className="text-xs text-primary hover:underline flex items-center space-x-1 font-medium"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Update Mitigation</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mitigation Action Modal */}
      {mitigatingFindingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Record Mitigation Status</span>
            </h3>

            <div>
              <label className="block text-muted-foreground font-medium mb-1">Workflow Status</label>
              <select
                value={mitigationStatus}
                onChange={(e) => setMitigationStatus(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="MITIGATED">MITIGATED (Patch or Rule Applied)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
                <option value="UNRESOLVED">UNRESOLVED (Action Required)</option>
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground font-medium mb-1">Mitigation Details & Notes</label>
              <textarea
                rows={4}
                value={mitigationNotes}
                onChange={(e) => setMitigationNotes(e.target.value)}
                placeholder="Explain the mitigation rule or filter configuration applied to contain this vulnerability..."
                className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
              <button
                onClick={() => setMitigatingFindingId(null)}
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMitigateFinding(mitigatingFindingId)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Save Mitigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
