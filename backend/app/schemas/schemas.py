from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Auth & User
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str
    tenant_id: str
    tenant_name: str
    role: str
    permissions: List[str]

class UserProfileResponse(BaseModel):
    id: str
    username: str
    full_name: str
    tenant_id: str
    role: str
    is_active: bool

# Sessions & Isolation Policies
class IsolationPolicyCreate(BaseModel):
    name: str
    cpu_limit_cores: float = 1.0
    memory_limit_mb: int = 1024
    timeout_seconds: int = 300
    network_ingress_allowed: bool = False
    network_egress_whitelist: List[str] = Field(default_factory=list)
    allowed_model_endpoints: List[str] = Field(default_factory=lambda: ["llama-3-70b-instruct"])
    secret_capabilities: List[str] = Field(default_factory=list)
    seccomp_profile_name: str = "bayora-strict-default"

class IsolationPolicyResponse(BaseModel):
    id: str
    name: str
    cpu_limit_cores: float
    memory_limit_mb: int
    timeout_seconds: int
    network_ingress_allowed: bool
    network_egress_whitelist: List[str]
    allowed_model_endpoints: List[str]
    secret_capabilities: List[str]
    seccomp_profile_name: str
    cgroups_version_enforced: str

class ExecutionProfileResponse(BaseModel):
    id: str
    name: str
    runner_type: str
    container_image: str
    default_command: str

class SessionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_model_id: str
    execution_profile_id: str
    isolation_policy_id: str
    blue_team_guardrail_config: Optional[Dict[str, Any]] = None

class SessionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    tenant_id: str
    created_by_user_id: str
    status: str
    target_model_id: str
    execution_profile_id: str
    isolation_policy_id: str
    blue_team_guardrail_config: Dict[str, Any]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    termination_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

# Inference Gateway
class InferenceInput(BaseModel):
    session_id: str
    model_id: str
    prompt: str

class InferenceResultResponse(BaseModel):
    success: bool
    correlation_id: str
    session_id: str
    model_id: str
    prompt_token_count: int
    completion_token_count: int
    latency_ms: int
    response_text: str
    refusal_triggered: bool
    jailbreak_detected: bool
    blocked_by_guardrail: bool
    guardrail_reason: Optional[str]
    created_at: datetime

# Audit & Evidence
class AuditRecordItem(BaseModel):
    sequence_number: int
    timestamp: str
    event_type: str
    principal_id: str
    tenant_id: Optional[str]
    session_id: Optional[str]
    canonical_payload: str
    previous_hash: str
    record_hash: str

class AuditVerifyReport(BaseModel):
    is_valid: bool
    records_checked: int
    broken_at_sequence: Optional[int]
    details: str
    verification_time: str
    head_hash: Optional[str] = None

# Security Events
class SecurityEventItem(BaseModel):
    id: str
    event_type: str
    severity: str
    source: str
    tenant_id: Optional[str]
    session_id: Optional[str]
    principal_id: Optional[str]
    description: str
    metadata: Dict[str, Any]
    created_at: datetime

# Findings & Evaluation
class FindingResponse(BaseModel):
    id: str
    run_id: str
    session_id: str
    test_id: str
    category: str
    severity: str
    prompt_sample: str
    response_sample: str
    mitigation_status: str
    mitigation_notes: Optional[str]
    created_at: datetime

class FindingMitigateInput(BaseModel):
    mitigation_status: str
    mitigation_notes: str
