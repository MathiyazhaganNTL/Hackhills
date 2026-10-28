import React, { useState } from 'react';
import {
  Cpu,
  Shield,
  Zap,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Send,
  Eye,
  Key,
  Info
} from 'lucide-react';
import { ModelItem } from '../types';
import { SimulationNotice } from '../components/common/SimulationNotice';
import { SideDrawer } from '../components/common/SideDrawer';

interface GatewayViewProps {
  models: ModelItem[];
}

export const GatewayView: React.FC<GatewayViewProps> = ({ models }) => {
  const [testPrompt, setTestPrompt] = useState(
    'Evaluating LLM response with synthetic API key sk-proj-9382103912093810293 and internal token bearer ghp_91203912093810293 and password=TestPass99.'
  );
  const [redactedPreview, setRedactedPreview] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);

  const handleTestRedaction = () => {
    let text = testPrompt;
    text = text.replace(/sk-[a-zA-Z0-9_-]{10,}/gi, '[REDACTED_API_KEY]');
    text = text.replace(/ghp_[a-zA-Z0-9_-]{10,}/gi, '[REDACTED_GITHUB_TOKEN]');
    text = text.replace(/bearer\s+[^\s]+/gi, 'Bearer [REDACTED_TOKEN]');
    text = text.replace(/password\s*[:=]\s*[^\s]+/gi, 'password=[REDACTED]');
    setRedactedPreview(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-primary" />
            <span>Secure LLM Gateway & Model Registry</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Mediated inference control plane enforcing per-session token quotas, rate limits, PII/secret redaction, and strict conversation memory isolation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-secondary text-primary border border-border flex items-center">
            <Lock className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>Gateway Mediated</span>
          </span>
        </div>
      </div>

      {/* Model Registry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-3 hover:border-primary/50 transition cursor-pointer flex flex-col justify-between"
            onClick={() => setSelectedModel(model)}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-primary border border-border uppercase font-bold">
                  {model.provider}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>ACTIVE</span>
                </span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-foreground">
                  {model.name}
                </h2>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{model.id}</div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">{model.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px]">RATE LIMIT</span>
                  <div className="text-foreground font-bold">{model.token_rate_limit_rpm} req/min</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">CONTEXT</span>
                  <div className="text-foreground font-bold">{model.context_window} tokens</div>
                </div>
              </div>

              <div className="text-xs font-mono flex items-center justify-between text-muted-foreground pt-1">
                <span>Safety Baseline:</span>
                <span className="text-primary font-bold">{model.safety_baseline_score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Controls & Redaction Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gateway Security Controls */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Gateway Security Controls & Guardrails</span>
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Per-Session Memory Partitioning</div>
                <div className="text-muted-foreground text-[11px]">Strict tenant/session context isolation; zero cross-session bleeding</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                ENFORCED
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Sliding Window Rate Limiter</div>
                <div className="text-muted-foreground text-[11px]">Throttles excessive bursts to prevent side-channel inference probing</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                60 RPM / SESSION
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Maximum Input Token Ceiling</div>
                <div className="text-muted-foreground text-[11px]">Rejects denial-of-service oversized prompt payloads</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-mono text-[11px]">
                4,096 TOKENS
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Correlation Tracking & Audit Linking</div>
                <div className="text-muted-foreground text-[11px]">Every inference request is stamped with non-forgeable correlation ID</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-mono text-[11px]">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Credential Redaction Tester with Synthetic Inputs */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Key className="w-4 h-4 text-primary" />
              <span>Real-Time Secret & PII Redaction Tester</span>
            </h2>
            <SimulationNotice label="SYNTHETIC INPUT TEST" />
          </div>

          <p className="text-xs text-muted-foreground">
            Prompts and responses are automatically sanitized before audit logging. Test patterns using synthetic strings below.
          </p>

          <div>
            <label className="block text-muted-foreground text-xs font-medium mb-1">
              Synthetic Test Prompt (API Keys / Bearer Tokens / Passwords):
            </label>
            <textarea
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <button
            onClick={handleTestRedaction}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs transition flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Simulate Gateway Redaction</span>
          </button>

          {redactedPreview && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sanitized Operational Log Payload:</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary border border-border text-xs font-mono text-foreground whitespace-pre-wrap">
                {redactedPreview}
              </div>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Never enter real credentials or production secrets into testing interfaces.</span>
          </div>
        </div>
      </div>

      {/* Model Details Drawer */}
      <SideDrawer
        isOpen={Boolean(selectedModel)}
        onClose={() => setSelectedModel(null)}
        title={
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Model Endpoint Specification</span>
          </div>
        }
        subtitle={selectedModel?.id}
        footer={
          <button
            onClick={() => setSelectedModel(null)}
            className="px-3.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted"
          >
            Close
          </button>
        }
      >
        {selectedModel && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">MODEL DISPLAY NAME:</span>
              <div className="text-foreground font-sans font-bold text-sm mt-0.5">{selectedModel.name}</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">PROVIDER:</span>
              <div className="text-primary font-bold uppercase mt-0.5">{selectedModel.provider}</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">SLIDING WINDOW RATE LIMIT:</span>
              <div className="text-foreground mt-0.5">{selectedModel.token_rate_limit_rpm} requests / minute</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">CONTEXT WINDOW:</span>
              <div className="text-foreground mt-0.5">{selectedModel.context_window} tokens</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">SAFETY BASELINE:</span>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{selectedModel.safety_baseline_score}% safe refusal baseline</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">DESCRIPTION:</span>
              <div className="text-foreground font-sans mt-0.5 bg-secondary/50 p-2.5 rounded-lg border border-border">
                {selectedModel.description}
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};
