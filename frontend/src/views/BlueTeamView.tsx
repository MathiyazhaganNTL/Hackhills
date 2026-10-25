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
  FileEdit
} from 'lucide-react';
import { Session, EvaluationFinding } from '../types';
import { api } from '../services/api';

interface BlueTeamViewProps {
  sessions: Session[];
  findings: EvaluationFinding[];
  onRefreshData?: () => void;
}

export const BlueTeamView: React.FC<BlueTeamViewProps> = ({
  sessions,
  findings,
  onRefreshData
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Guardrail form state
  const [rules, setRules] = useState<string[]>(
    selectedSession?.blue_team_guardrail_config?.pre_inference_regex || [
      'ignore previous instructions',
      'sudo mode',
      'dan prompt',
      'system override'
    ]
  );
  const [newRule, setNewRule] = useState('');
  const [toxicityThreshold, setToxicityThreshold] = useState<number>(
    selectedSession?.blue_team_guardrail_config?.semantic_toxicity_threshold || 0.65
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Finding mitigation modal / state
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
        pii_redaction_enabled: true
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      alert('Failed to save defensive guardrails');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span>Blue-Team Defensive Guardrails & Mitigations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure pre-inference inspection rules, semantic filters, and record mitigation workflows for safety findings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-400" />
            Defensive Pipeline Active
          </span>
        </div>
      </div>

      {/* Target Session Selection */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 text-xs">
        <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="text-slate-400 font-medium">Configuring Defensive Guardrails for:</span>
        <select
          value={selectedSessionId}
          onChange={(e) => {
            setSelectedSessionId(e.target.value);
            const s = sessions.find((item) => item.id === e.target.value);
            if (s?.blue_team_guardrail_config?.pre_inference_regex) {
              setRules(s.blue_team_guardrail_config.pre_inference_regex);
            }
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.status})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guardrail Rules Configuration */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>Pre-Inference Regex & Keyword Filters</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">{rules.length} Active Rules</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="e.g. bypass safety, base64 payload, sudo mode..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={handleAddRule}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300"
              >
                <span>"{rule}"</span>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Sliders & Toggles */}
          <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="flex items-center">
                  <Sliders className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  Semantic Toxicity Rejection Threshold:
                </span>
                <span className="font-mono text-cyan-400 font-bold">{toxicityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={toxicityThreshold}
                onChange={(e) => setToxicityThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.1 (Strict)</span>
                <span>0.9 (Permissive)</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveGuardrails}
            disabled={isSaving}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Deploying Guardrails...' : 'Deploy Defensive Guardrails'}</span>
          </button>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-1.5 font-mono">
              <CheckCircle className="w-4 h-4" />
              <span>Guardrails saved & synced with LLM Gateway!</span>
            </div>
          )}
        </div>

        {/* Remediation Tracker */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Safety Findings & Remediation Tracker</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">{findings.length} Total</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
            {findings.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-mono">
                No safety vulnerabilities or findings recorded.
              </div>
            ) : (
              findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{finding.test_id}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        finding.mitigation_status === 'MITIGATED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : finding.mitigation_status === 'UNDER_REVIEW'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {finding.mitigation_status}
                    </span>
                  </div>

                  <div className="text-slate-300 font-medium">{finding.category}</div>
                  <div className="text-[11px] text-slate-400 font-mono line-clamp-2 bg-slate-900 p-2 rounded">
                    Payload: {finding.prompt_sample}
                  </div>

                  {finding.mitigation_notes && (
                    <div className="text-[11px] text-emerald-400 font-mono">
                      Remediation: {finding.mitigation_notes}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setMitigatingFindingId(finding.id);
                        setMitigationStatus(finding.mitigation_status);
                        setMitigationNotes(finding.mitigation_notes || '');
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Record Mitigation Status</span>
            </h3>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Status</label>
              <select
                value={mitigationStatus}
                onChange={(e) => setMitigationStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="MITIGATED">MITIGATED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="UNRESOLVED">UNRESOLVED</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Mitigation Details & Rule Link</label>
              <textarea
                rows={4}
                value={mitigationNotes}
                onChange={(e) => setMitigationNotes(e.target.value)}
                placeholder="Explain the mitigation rule or patch applied..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setMitigatingFindingId(null)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
