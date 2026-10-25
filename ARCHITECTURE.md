# Bayora — Secure AI Red-Teaming & Safety Evaluation Infrastructure
## Implementation Architecture & Master Execution Plan

### 1. Architectural Overview

Bayora is an enterprise-grade infrastructure platform engineered for isolated, verifiable, and governed AI safety evaluations. It hosts concurrent red-team adversarial evaluation workloads, blue-team defensive inspection pipelines, and mediated LLM inference within strict security perimeters.

```
+-----------------------------------------------------------------------------------------+
|                                    BAYORA FRONTEND                                      |
|            (React 19 + TypeScript + Vite + Tailwind CSS + Lucide + Recharts)            |
|  - Security Admin Dashboard           - Red-Team Attack Playground                      |
|  - Evaluation Session Manager         - Blue-Team Mitigation Workspace                  |
|  - Isolation Policy Inspector         - LLM Gateway & Registry                          |
|  - Cryptographic Audit Trail Viewer   - Evidence & Evaluation Reports                   |
+-----------------------------------------------------------------------------------------+
                                           |  HTTPS / WSS / REST
                                           v
+-----------------------------------------------------------------------------------------+
|                                    BAYORA FASTAPI API                                   |
|  - Deny-by-Default RBAC Engine (Admin, Red Team, Blue Team, Auditor)                    |
|  - Tenant Boundary & Resource-Level Authorization                                       |
|  - Session State Machine (DRAFT -> QUEUED -> RUNNING -> COMPLETED/FAILED/TERMINATED)     |
|  - Prometheus Metrics (/metrics) & Security Event Ingestion                             |
+-----------------------------------------------------------------------------------------+
       |                           |                          |                     |
       v                           v                          v                     v
+---------------+          +---------------+          +---------------+     +---------------+
|   ISOLATION   |          |  SECURE LLM   |          | CRYPTOGRAPHIC |     |    SECRETS    |
| POLICY ENGINE |          |    GATEWAY    |          |  AUDIT CHAIN  |     |   MANAGEMENT  |
+---------------+          +---------------+          +---------------+     +---------------+
| - CPU/Mem Cgroups        | - Session Context        | - Monotonic   |     | - Vault       |
| - Seccomp Sandbox        | - Rate Limiter           |   Sequencing  |       Interface     |
| - Net Egress Policy      | - Redaction Engine       | - SHA-256     |     | - Scoped      |
| - Rootless Driver        | - Model Adapters         |   Hash Chain  |       Leases        |
| - Fail-Closed Check      |   (Mock/Bench/Ext)       | - Verification|     | - Redaction   |
+---------------+          +---------------+          +---------------+     +---------------+
       |                           |                          |                     |
       +---------------------------+--------------------------+---------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|                          PERSISTENCE & SECURITY EVENT LOGGING                           |
|       - PostgreSQL / SQLite with strict Foreign Keys, Indexes, Canonical Hashes         |
|       - Append-Only Audit Store with External Anchoring Checkpoints                     |
+-----------------------------------------------------------------------------------------+
```

### 2. Implementation Modules Breakdown

1. **Backend Core & Database (`backend/`)**:
   - `core/config.py`: Environment configuration, security parameters, capability detection.
   - `core/security.py`: JWT token generation, password hashing (bcrypt), token validation.
   - `core/rbac.py`: Permission enum, role matrix, route dependency checkers enforcing tenant and role boundaries.
   - `models/`: SQLAlchemy 2.0 models for Users, Tenants, Roles, Sessions, Isolation Policies, Workload Profiles, Inference Requests, Findings, Security Events, Audit Records, Audit Anchors.
   - `database.py`: Async/Sync session factory with connection pooling and sqlite foreign key enforcement.

2. **Isolation Engine & Workload Execution (`backend/services/isolation.py`)**:
   - Explicit capability detection (Docker engine availability, Linux cgroups v2, seccomp).
   - `ContainerIsolationDriver` with fail-closed behavior: refuses execution if requested isolation mode cannot be verified.
   - `ProcessIsolationSandbox`: Restricted environment runner with isolated temp directories, stripped environment variables, CPU timeout governance, memory threshold watchdogs, and synthetic attack benchmarking.

3. **Secure LLM Gateway (`backend/services/llm_gateway.py`)**:
   - Token budgeting and per-session request rate limiting.
   - Absolute session memory isolation: conversations partitioned strictly by `session_id` and `tenant_id`.
   - Real-time prompt/response redaction filter (scans for API keys, bearer tokens, credentials, sensitive data before audit logging).
   - Built-in Safety Benchmark Inference Simulator: Models standard adversarial datasets (AdvBench, HarmBench, JailbreakBench, ToxiGen) with realistic refusal classifiers, jailbreak vectors, and blue-team mitigation scoring.
   - Live external provider adapters (OpenAI/Anthropic compatible) with secure credential leasing.

4. **Tamper-Evident Audit System (`backend/services/audit.py`)**:
   - Strict append-only write mechanism.
   - Monotonic integer sequence counter.
   - Canonical JSON serialization (sorted keys, compact whitespace) for deterministic hashing.
   - SHA-256 recursive hash chain: `hash_n = SHA256(seq || timestamp || event_type || tenant_id || session_id || canonical_payload || hash_{n-1})`.
   - Independent verification engine: scans entire chain, returns detailed diagnostic report indicating any altered, deleted, or reordered records.
   - Tamper simulation capability for test demonstration and verification.

5. **Security Events & Metrics (`backend/services/security_events.py`)**:
   - Structured security alert collection (unauthorized cross-tenant attempt, blocked egress, rate limit breach, policy violation, audit anomaly).
   - Prometheus metrics export (`/metrics`).

6. **Full-Featured Frontend Dashboard (`frontend/`)**:
   - Built with React 19, TypeScript, Tailwind CSS, Lucide icons, Recharts.
   - Dark cybersecurity aesthetic (`#0b0f19` charcoal/navy, cyan `#06b6d4`, cobalt `#3b82f6`, emerald `#10b981`, amber `#f59e0b`, rose `#f43f5e`).
   - 12 comprehensive screens covering all requirements:
     1. Login & Role Switcher
     2. Security Operations Center (SOC) Overview
     3. Evaluation Sessions Management
     4. Session Details & Isolation Policy Inspector
     5. Red-Team Adversarial Workspace
     6. Blue-Team Defensive Guardrails Workspace
     7. Secure LLM Gateway & Registry
     8. Security Event Explorer & Threat Monitor
     9. Audit Trail & Hash-Chain Verifier (with Live Tamper Test)
     10. Evaluation Reports & Verified Evidence Export
     11. Tenant & RBAC Administration
     12. Infrastructure Health & Isolation Capabilities
