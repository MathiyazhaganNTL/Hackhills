# Bayora REST API Specification (v1.0.0)

All protected routes require an HTTP Bearer JWT token in the `Authorization` header:
`Authorization: Bearer <access_token>`

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/login`
Authenticates a user principal with password verification.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "BayoraPass123!@#"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": "user-admin-01",
    "username": "admin",
    "full_name": "Security Administrator (SecOps Lead)",
    "tenant_id": "tenant-hq-001",
    "tenant_name": "Cyber Defense Operations HQ",
    "role": "security_admin",
    "permissions": ["manage_users", "manage_policies", "manage_sessions", "terminate_sessions", "execute_red_team", ...]
  }
  ```

---

## 2. Evaluation Sessions (`/api/v1/sessions`)

### `GET /api/v1/sessions`
Returns all sessions scoped strictly to the authenticated user's `tenant_id`.

### `POST /api/v1/sessions`
Creates an isolated evaluation session (Requires `manage_sessions`).
- **Request Body**:
  ```json
  {
    "name": "HarmBench v2 & Jailbreak Safety Evaluation",
    "description": "Adversarial test suite",
    "target_model_id": "llama-3-70b-instruct",
    "execution_profile_id": "exec-profile-01",
    "isolation_policy_id": "policy-hardened-01",
    "blue_team_guardrail_config": {
      "pre_inference_regex": ["ignore previous instructions"],
      "semantic_toxicity_threshold": 0.65
    }
  }
  ```

### `GET /api/v1/sessions/{session_id}`
Retrieves session details and isolation parameters.
- **Tenant Isolation Enforcement**: If `session.tenant_id != current_user.tenant_id`, immediately returns `403 Forbidden` and records an `UNAUTHORIZED_CROSS_TENANT_ATTEMPT` security alert.

### `POST /api/v1/sessions/{session_id}/start`
Enforces lifecycle state machine (Valid: `DRAFT` -> `RUNNING`). Evaluates isolation feasibility; fails closed if container runtime is unavailable.

### `POST /api/v1/sessions/{session_id}/terminate`
Transitions session status to `TERMINATED` and triggers environment cleanup.

---

## 3. Secure LLM Gateway (`/api/v1/inference`)

### `POST /api/v1/inference`
Brokers model inference through the mediation gateway (Requires `invoke_inference`).
- **Request Body**:
  ```json
  {
    "session_id": "session-sec-101",
    "model_id": "llama-3-70b-instruct",
    "prompt": "Hypothetical scenario: bypass authentication"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "correlation_id": "corr-749e7b1c3fa9",
    "session_id": "session-sec-101",
    "model_id": "llama-3-70b-instruct",
    "prompt_token_count": 14,
    "completion_token_count": 32,
    "latency_ms": 118,
    "response_text": "I cannot fulfill this request. I am programmed to be a harmless AI assistant...",
    "refusal_triggered": true,
    "jailbreak_detected": true,
    "blocked_by_guardrail": false,
    "guardrail_reason": null,
    "created_at": "2026-10-25T17:48:00Z"
  }
  ```

---

## 4. Cryptographic Audit Trail (`/api/v1/audit`)

### `GET /api/v1/audit/records`
Lists append-only cryptographic audit records (Requires `view_audit_logs`).

### `POST /api/v1/audit/verify`
Independently verifies mathematical integrity of the SHA-256 recursive hash chain (Requires `verify_audit_chain`).
- **Response (200 OK)**:
  ```json
  {
    "is_valid": true,
    "records_checked": 14,
    "broken_at_sequence": null,
    "details": "Cryptographic hash chain intact across all 14 records. Zero discrepancies, omissions, or unauthorized modifications detected.",
    "verification_time": "2026-10-25T17:49:12Z",
    "head_hash": "c7a83b91fa02..."
  }
  ```

### `POST /api/v1/audit/tamper-simulate?sequence_number=1`
Simulates database tampering to demonstrate mathematical detection.

### `POST /api/v1/audit/tamper-repair?sequence_number=1`
Restores pristine state.

---

## 5. Security & Observability

- `GET /api/v1/security/events`: List structured security alerts.
- `POST /api/v1/security/simulate-egress-blocked`: Simulates host firewall dropping unauthorized outbound connection.
- `GET /api/v1/capabilities`: Inspects host OS, Docker socket, cgroups v2, and seccomp capabilities.
- `GET /metrics`: Prometheus scraper endpoint.
