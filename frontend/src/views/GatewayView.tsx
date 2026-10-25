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
  Key
} from 'lucide-react';
import { ModelItem } from '../types';

interface GatewayViewProps {
  models: ModelItem[];
}

export const GatewayView: React.FC<GatewayViewProps> = ({ models }) => {
  const [testPrompt, setTestPrompt] = useState(
    'Evaluating LLM response with simulated API key sk-proj-9382103912093810293 and internal token bearer ghp_91203912093810293.'
  );
  const [redactedPreview, setRedactedPreview] = useState<string>('');

  const handleTestRedaction = () => {
    // Client-side simulation of Gateway Redaction Engine
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
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>Secure LLM Gateway & Model Registry</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Mediated inference control plane enforcing per-session token quotas, rate limits, PII/secret redaction, and strict conversation memory isolation.
        </p>
      </div>

      {/* Model Registry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-cyan-500/50 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 uppercase">
                {model.provider}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                ACTIVE
              </span>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition">
                {model.name}
              </h2>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{model.id}</div>
            </div>

            <p className="text-xs text-slate-400">{model.description}</p>

            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px]">RATE LIMIT</span>
                <div className="text-slate-200 font-bold">{model.token_rate_limit_rpm} req/min</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">CONTEXT</span>
                <div className="text-slate-200 font-bold">{model.context_window} tokens</div>
              </div>
            </div>

            <div className="pt-2 text-xs font-mono flex items-center justify-between text-slate-400">
              <span>Safety Baseline:</span>
              <span className="text-cyan-400 font-bold">{model.safety_baseline_score}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Gateway Security Controls & Redaction Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Gateway Security Controls & Guardrails</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Per-Session Memory Partitioning</div>
                <div className="text-slate-500 text-[11px]">Strict tenant/session context isolation; zero cross-session bleeding</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                ENFORCED
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Sliding Window Rate Limiter</div>
                <div className="text-slate-500 text-[11px]">Throttles excessive bursts to prevent side-channel inference probing</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                60 RPM / SESSION
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Maximum Input Token Ceiling</div>
                <div className="text-slate-500 text-[11px]">Rejects denial-of-service oversized prompt payloads</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[11px]">
                4,096 TOKENS
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Correlation Tracking & Audit Linking</div>
                <div className="text-slate-500 text-[11px]">Every inference request is stamped with non-forgeable correlation ID</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono text-[11px]">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Live Redaction Preview Tester */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Real-Time Secret & PII Redaction Inspector</span>
          </h2>
          <p className="text-xs text-slate-400">
            Prompts and responses are automatically sanitized before audit logging to prevent secret leakage.
          </p>

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1">
              Test Prompt with Credentials / Tokens:
            </label>
            <textarea
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <button
            onClick={handleTestRedaction}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Simulate Gateway Redaction</span>
          </button>

          {redactedPreview && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs text-emerald-400 font-mono font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sanitized Operational Log Payload:</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                {redactedPreview}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
