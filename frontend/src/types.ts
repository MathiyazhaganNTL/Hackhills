export type Role = 'security_admin' | 'red_team' | 'blue_team' | 'auditor';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  tenant_id: string;
  tenant_name?: string;
  role: Role;
  permissions: string[];
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_by_user_id: string;
  status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TERMINATED';
  target_model_id: string;
  execution_profile_id: string;
  isolation_policy_id: string;
  blue_team_guardrail_config: {
    pre_inference_regex?: string[];
    semantic_toxicity_threshold?: number;
    refusal_override_prevention?: boolean;
    pii_redaction_enabled?: boolean;
  };
  started_at?: string;
  completed_at?: string;
  termination_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelItem {
  id: string;
  name: string;
  provider: string;
  context_window: number;
  token_rate_limit_rpm: number;
  safety_baseline_score: number;
  description?: string;
}

export interface IsolationPolicy {
  id: string;
  name: string;
  cpu_limit_cores: number;
  memory_limit_mb: number;
  timeout_seconds: number;
  network_ingress_allowed: boolean;
  network_egress_whitelist: string[];
  allowed_model_endpoints: string[];
  secret_capabilities: string[];
  seccomp_profile_name: string;
  cgroups_version_enforced: string;
}

export interface ExecutionProfile {
  id: string;
  name: string;
  runner_type: string;
  container_image: string;
  default_command: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source: string;
  tenant_id?: string;
  session_id?: string;
  principal_id?: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AuditRecord {
  sequence_number: number;
  timestamp: string;
  event_type: string;
  principal_id: string;
  tenant_id?: string;
  session_id?: string;
  canonical_payload: string;
  previous_hash: string;
  record_hash: string;
}

export interface AuditVerificationReport {
  is_valid: boolean;
  records_checked: number;
  broken_at_sequence?: number;
  details: string;
  verification_time: string;
  head_hash?: string;
}

export interface EvaluationRun {
  id: string;
  session_id: string;
  benchmark_name: string;
  total_tests: number;
  passed_defenses: number;
  bypassed_defenses: number;
  bypass_rate_pct: number;
  status: string;
  created_at: string;
}

export interface EvaluationFinding {
  id: string;
  run_id: string;
  session_id: string;
  test_id: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  prompt_sample: string;
  response_sample: string;
  mitigation_status: 'UNRESOLVED' | 'MITIGATED' | 'UNDER_REVIEW';
  mitigation_notes?: string;
  created_at: string;
}

export interface InferenceResult {
  success: boolean;
  correlation_id: string;
  session_id: string;
  model_id: string;
  prompt_token_count: number;
  completion_token_count: number;
  latency_ms: number;
  response_text: string;
  refusal_triggered: boolean;
  jailbreak_detected: boolean;
  blocked_by_guardrail: boolean;
  guardrail_reason?: string;
  created_at: string;
}

export interface SystemCapabilities {
  host_os: string;
  is_linux: boolean;
  cgroups_v2_available: boolean;
  seccomp_available: boolean;
  docker_engine_available: boolean;
  docker_engine_status: string;
  process_isolation_supported: boolean;
  filesystem_sandbox_supported: boolean;
  fail_closed_mode_active: boolean;
}
