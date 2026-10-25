import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Index, BigInteger
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    max_concurrent_sessions = Column(Integer, default=5, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    sessions = relationship("EvaluationSession", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="auditor")  # security_admin, red_team, blue_team, auditor
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    tenant = relationship("Tenant", back_populates="users")

class IsolationPolicy(Base):
    __tablename__ = "isolation_policies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    cpu_limit_cores = Column(Float, default=1.0, nullable=False)
    memory_limit_mb = Column(Integer, default=1024, nullable=False)
    timeout_seconds = Column(Integer, default=300, nullable=False)
    network_ingress_allowed = Column(Boolean, default=False, nullable=False)
    network_egress_whitelist_json = Column(Text, default="[]", nullable=False)  # JSON list of allowed hosts
    filesystem_readonly_root = Column(Boolean, default=True, nullable=False)
    allowed_model_endpoints_json = Column(Text, default='["gpt-4o", "claude-3-5-sonnet", "llama-3-70b-instruct"]', nullable=False)
    secret_capabilities_json = Column(Text, default="[]", nullable=False)
    seccomp_profile_name = Column(String(50), default="bayora-strict-default", nullable=False)
    cgroups_version_enforced = Column(String(20), default="v2", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    sessions = relationship("EvaluationSession", back_populates="isolation_policy")

class ExecutionProfile(Base):
    __tablename__ = "execution_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    runner_type = Column(String(50), default="LOCAL_SANDBOX", nullable=False) # CONTAINER_ROOTLESS, LOCAL_SANDBOX, HARDENED_ENCLAVE
    container_image = Column(String(255), default="bayora-runner:latest", nullable=False)
    default_command = Column(String(255), default="python -m runner.eval", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    sessions = relationship("EvaluationSession", back_populates="execution_profile")

class EvaluationSession(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # State Machine: DRAFT, QUEUED, RUNNING, COMPLETED, FAILED, TERMINATED
    status = Column(String(30), default="DRAFT", nullable=False, index=True)
    
    execution_profile_id = Column(String(36), ForeignKey("execution_profiles.id"), nullable=False)
    isolation_policy_id = Column(String(36), ForeignKey("isolation_policies.id"), nullable=False)
    target_model_id = Column(String(100), default="llama-3-70b-instruct", nullable=False)
    
    # Defensive rules and red-team payloads
    blue_team_guardrail_config_json = Column(Text, default="{}", nullable=False)
    active_workload_pid = Column(Integer, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    termination_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    tenant = relationship("Tenant", back_populates="sessions")
    isolation_policy = relationship("IsolationPolicy", back_populates="sessions")
    execution_profile = relationship("ExecutionProfile", back_populates="sessions")
    inference_requests = relationship("InferenceRequest", back_populates="session", cascade="all, delete-orphan")
    evaluation_runs = relationship("EvaluationRun", back_populates="session", cascade="all, delete-orphan")

class SessionMembership(Base):
    __tablename__ = "session_memberships"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_role = Column(String(50), nullable=False)  # red_team, blue_team, auditor
    assigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class ModelRegistry(Base):
    __tablename__ = "model_registry"
    
    id = Column(String(100), primary_key=True)  # e.g., llama-3-70b-instruct
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False) # meta, anthropic, openai, local-vllm
    endpoint_url = Column(String(255), default="mock://gateway.bayora.local", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    token_rate_limit_rpm = Column(Integer, default=60, nullable=False)
    context_window = Column(Integer, default=8192, nullable=False)
    safety_baseline_score = Column(Float, default=94.5, nullable=False)
    description = Column(Text, nullable=True)

class InferenceRequest(Base):
    __tablename__ = "inference_requests"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    model_id = Column(String(100), ForeignKey("model_registry.id"), nullable=False)
    
    prompt_token_count = Column(Integer, default=0, nullable=False)
    completion_token_count = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    status_code = Column(Integer, default=200, nullable=False)
    
    redacted_prompt_preview = Column(Text, nullable=False)
    redacted_response_preview = Column(Text, nullable=False)
    refusal_triggered = Column(Boolean, default=False, nullable=False)
    jailbreak_detected = Column(Boolean, default=False, nullable=False)
    correlation_id = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    session = relationship("EvaluationSession", back_populates="inference_requests")

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    benchmark_name = Column(String(100), default="HarmBench-v2", nullable=False)
    total_tests = Column(Integer, default=0, nullable=False)
    passed_defenses = Column(Integer, default=0, nullable=False)
    bypassed_defenses = Column(Integer, default=0, nullable=False)
    bypass_rate_pct = Column(Float, default=0.0, nullable=False)
    status = Column(String(30), default="COMPLETED", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    session = relationship("EvaluationSession", back_populates="evaluation_runs")
    findings = relationship("EvaluationFinding", back_populates="evaluation_run", cascade="all, delete-orphan")

class EvaluationFinding(Base):
    __tablename__ = "evaluation_findings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    test_id = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)  # Jailbreak, Prompt Injection, Data Exfiltration, System Override
    severity = Column(String(20), default="HIGH", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    prompt_sample = Column(Text, nullable=False)
    response_sample = Column(Text, nullable=False)
    mitigation_status = Column(String(30), default="UNRESOLVED", nullable=False)  # UNRESOLVED, MITIGATED, UNDER_REVIEW
    mitigation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    evaluation_run = relationship("EvaluationRun", back_populates="findings")

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), nullable=False, index=True) # CROSS_TENANT_ACCESS_BLOCKED, EGRESS_DENIED, RATE_LIMIT_EXCEEDED, TAMPER_ATTEMPT_DETECTED, CGROUP_EXHAUSTION
    severity = Column(String(20), default="WARNING", nullable=False) # INFO, WARNING, CRITICAL
    source = Column(String(100), default="ISOLATION_ENGINE", nullable=False)
    tenant_id = Column(String(36), nullable=True, index=True)
    session_id = Column(String(36), nullable=True, index=True)
    principal_id = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

class AuditRecord(Base):
    __tablename__ = "audit_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    sequence_number = Column(Integer, unique=True, nullable=False, index=True)
    timestamp = Column(String(50), nullable=False)  # ISO UTC
    event_type = Column(String(100), nullable=False, index=True)
    principal_id = Column(String(50), nullable=False)
    tenant_id = Column(String(36), nullable=True, index=True)
    session_id = Column(String(36), nullable=True, index=True)
    canonical_payload = Column(Text, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    record_hash = Column(String(64), nullable=False, index=True)

class AuditAnchor(Base):
    __tablename__ = "audit_anchors"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    sequence_number = Column(Integer, nullable=False)
    checkpoint_hash = Column(String(64), nullable=False)
    signature_proof = Column(String(255), nullable=False)
    anchor_type = Column(String(50), default="LOCAL_WORM_PROOF", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class EvidenceExport(Base):
    __tablename__ = "evidence_exports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    exported_by = Column(String(50), nullable=False)
    file_format = Column(String(10), default="JSON", nullable=False) # JSON, CSV
    integrity_hash = Column(String(64), nullable=False)
    record_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
