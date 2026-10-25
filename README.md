# Bayora — Secure AI Red-Teaming & Safety Evaluation Infrastructure

[![Security Status](https://img.shields.io/badge/Security-Production--Hardened-cyan.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](#)
[![React](https://img.shields.io/badge/React-19.3-61dafb.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](#)
[![Audit](https://img.shields.io/badge/Audit%20Chain-SHA--256%20Recursive-emerald.svg)](#)
[![Tests](https://img.shields.io/badge/Pytest-12%2F12%20Passing-brightgreen.svg)](#)

> **Bayora** is an enterprise-grade infrastructure platform engineered for hosting concurrent, isolated AI red-team adversarial probes and blue-team defensive safety evaluations against Large Language Models (LLMs). It guarantees mathematical tamper detection, strict tenant containment, session memory isolation, and fail-closed resource governance.

---

## Table of Contents

1. [Problem Statement & Objectives](#1-problem-statement--objectives)
2. [Architectural Overview](#2-architectural-overview)
3. [Core Security Pillars](#3-core-security-pillars)
4. [Technology Stack](#4-technology-stack)
5. [The 12 Application Modules](#5-the-12-application-modules)
6. [Role-Based Access Control (RBAC) Matrix](#6-role-based-access-control-rbac-matrix)
7. [Cryptographic Audit Hash Chain](#7-cryptographic-audit-hash-chain)
8. [Automated Test Suite (12/12 Passing)](#8-automated-test-suite-1212-passing)
9. [Quickstart & Local Installation](#9-quickstart--local-installation)
10. [Docker Compose Multi-Container Deployment](#10-docker-compose-multi-container-deployment)
11. [REST API Documentation](#11-rest-api-documentation)
12. [STRIDE Threat Model & Residual Risks](#12-stride-threat-model--residual-risks)
13. [Project Directory Layout](#13-project-directory-layout)

---

## 1. Problem Statement & Objectives

AI safety testing platforms frequently execute adversarial red-team payloads, defensive inspection logic, and target LLM inference within shared infrastructure. Without strict isolation boundaries, platforms are vulnerable to:
- **Prompt & Payload Leakage**: Red-team adversarial jailbreak prompts exposed to unauthorized tenants.
- **Defensive Rule Compromise**: Blue-team inspection logic, regexes, and classifiers read or manipulated by red-team operators.
- **Cross-Session Memory Bleeding**: Model conversation context leaking across sessions through shared inference state or KV caches.
- **Workload Side Channels & Contention**: Timing and memory side channels invalidating safety evaluation benchmarks.
- **Audit Record Tampering**: Post-hoc manipulation of safety scores or vulnerability findings.

**Bayora solves this** by enforcing physical and logical isolation boundaries, deny-by-default authorization, rate-limited mediation gateways, and an append-only SHA-256 recursive cryptographic audit chain with independent mathematical verification.

---

## 2. Architectural Overview

```
+-----------------------------------------------------------------------------------------+
|                                    BAYORA FRONTEND                                      |
|            (React 19 + TypeScript + Vite + Tailwind CSS + Lucide + Recharts)            |
|  - Security Admin SOC Dashboard       - Red-Team Attack Lab                             |
|  - Evaluation Session Manager         - Blue-Team Mitigation Workspace                  |
|  - Isolation Policy Inspector         - LLM Gateway & Registry                          |
|  - Cryptographic Audit Trail Viewer   - Evidence & Evaluation Reports                   |
+-----------------------------------------------------------------------------------------+
                                           |  HTTPS (TLS 1.3) + Signed Bearer JWT
                                           v
+=========================================================================================+
|                                    BAYORA FASTAPI API                                   |
|  - Deny-by-Default RBAC Engine (Admin, Red Team, Blue Team, Auditor)                    |
|  - Multi-Tenant Boundary Enforcement (Every query scoped to caller tenant ID)           |
|  - Session State Machine (DRAFT -> QUEUED -> RUNNING -> COMPLETED/FAILED/TERMINATED)     |
|  - Prometheus Metrics (/metrics) & Structured Security Event Ingestion                  |
+=========================================================================================+
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
+=========================================================================================+
|                          PERSISTENCE & SECURITY EVENT LOGGING                           |
|       - PostgreSQL / SQLite with strict Foreign Keys, Indexes, Canonical Hashes         |
|       - Append-Only Audit Store with External Anchoring Checkpoints                     |
+=========================================================================================+
```

---

## 3. Core Security Pillars

### A. Deny-by-Default Multi-Tenancy
- Every resource (Session, Finding, Policy, Event) is tied to a `tenant_id`.
- Enforced at the API route layer via dependency injection. Foreign tenant access attempts are blocked with `403 Forbidden` and trigger an automated `UNAUTHORIZED_CROSS_TENANT_ATTEMPT` security alert.

### B. Fail-Closed Isolation Policy Engine
- Inspects host capabilities (cgroups v2, seccomp, Docker socket).
- If rootless container execution is requested and the container runtime is unavailable, **the system fails closed**, halting execution rather than falling back to unconfined host processes.

### C. Secure LLM Inference Gateway
- **Session-Partitioned Memory**: All conversation turns are keyed strictly by `(tenant_id, session_id)`. Zero cross-session bleeding.
- **Sliding-Window Rate Limiting**: 60 requests/minute per session threshold preventing inference flooding.
- **Input Token Ceiling**: Maximum 4,096 tokens per request.
- **Automated Redaction Engine**: Scans prompts and responses for secrets (`sk-xxx`, `ghp_xxx`), passwords, and bearer tokens before audit logging.

### D. Cryptographic Append-Only Audit Chain
- Deterministic canonical JSON serialization (`json.dumps(obj, sort_keys=True, separators=(',', ':'))`).
- Monotonic sequence numbering ($0, 1, 2, \dots$).
- Recursive SHA-256 hash chaining:
  $$\text{Hash}_n = \text{SHA256}(\text{Seq} \parallel \text{Timestamp} \parallel \text{Event} \parallel \text{Principal} \parallel \text{Tenant} \parallel \text{Payload} \parallel \text{Hash}_{n-1})$$
- Independent mathematical verification endpoint (`POST /api/v1/audit/verify`) detects any payload mutation, deletion, or record reordering.

---

## 4. Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Enterprise cybersecurity UI (Dark navy/obsidian theme) |
| **Data Viz** | Recharts, Lucide React | Telemetry curves, latency charts, severity bars |
| **Backend API** | Python 3.13, FastAPI, Uvicorn | Asynchronous REST service with security middleware |
| **Data & ORM** | SQLAlchemy 2.0 (async), Pydantic v2 | Strict schema validation, SQLite / PostgreSQL support |
| **Cryptography** | bcrypt, Python hashlib (SHA-256), python-jose | Password hashing, JWT tokens, recursive hash chains |
| **Observability** | Prometheus client, OpenTelemetry hooks | Real-time metrics at `/metrics` and security events |
| **Testing** | Pytest, pytest-asyncio, HTTPX | 12 automated security and isolation test suites |
| **Deployment** | Docker, Docker Compose, Nginx | Multi-container production deployment stack |

---

## 5. The 12 Application Modules

1. **Security Operations Center (SOC) Overview**: Real-time KPI metrics, active session counts, blocked incidents, hourly inference volume & latency charts, and live security event stream.
2. **Evaluation Sessions Manager**: Full session lifecycle management (`DRAFT`, `QUEUED`, `RUNNING`, `COMPLETED`, `TERMINATED`, `FAILED`) with isolation policy creation wizard.
3. **Session Details & Isolation Policy Inspector**: Deep inspection of hardware cgroups CPU & Memory quotas, read-only rootfs status, network egress rules, and session-isolated conversation history.
4. **Red-Team Adversarial Workspace**: Adversarial attack playground with AdvBench and HarmBench benchmark presets (Persona Inversion, Base64 Obfuscation, Prompt Injection). Displays live latency, token usage, correlation IDs, and detection badges.
5. **Blue-Team Defensive Guardrails**: Pre-inference regex and keyword rule manager, semantic toxicity threshold slider (0.1–0.9), and findings remediation tracker.
6. **Secure LLM Gateway & Registry**: Registered model endpoints (LLaMA 3 70B, GPT-4o Enterprise, Claude 3.5 Sonnet) with rate limit controls and real-time credential redaction tester.
7. **Security Incident & Event Monitor**: Filterable security log with severity badges (`CRITICAL`, `WARNING`, `INFO`). Includes interactive **"Simulate Blocked Egress"** trigger.
8. **Cryptographic Audit Trail & Hash-Chain Verifier**: Block-by-block hash explorer with one-click **"Verify Audit Chain"** button and interactive **"Simulate Tamper Attack"** demonstration.
9. **Evaluation Reports & Evidence Export**: Comparative defense charts and downloadable evidence packages (JSON / CSV) stamped with cryptographic SHA-256 integrity proofs.
10. **Administration & RBAC Matrix**: User directory and comprehensive deny-by-default permission matrix across all 4 roles.
11. **Host Infrastructure & Isolation Health**: Live status of host container runtime, cgroups v2 resource governor, seccomp filters, and Vault scoped adapter.
12. **Authentication & Test Role Switcher**: Secure login screen with instant one-click evaluator profile switching across all roles + Tenant 2 contractor.

---

## 6. Role-Based Access Control (RBAC) Matrix

Bayora enforces **deny-by-default** authorization. Every protected endpoint verifies permissions via FastAPI dependency injection:

| Permission Scope | Security Admin | Red Team | Blue Team | Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Users & Roles** | ✅ | ❌ | ❌ | ❌ |
| **Configure Isolation Policies** | ✅ | ❌ | ❌ | ❌ |
| **Create / Terminate Sessions** | ✅ | ❌ | ❌ | ❌ |
| **View Sessions (Tenant-Scoped)** | ✅ | ✅ | ✅ | ✅ |
| **Execute Red-Team Probes** | ✅ | ✅ | ❌ | ❌ |
| **Configure Blue-Team Guardrails** | ✅ | ❌ | ✅ | ❌ |
| **Record Mitigation Workflows** | ✅ | ❌ | ✅ | ❌ |
| **Invoke Model Gateway** | ✅ | ✅ | ✅ | ❌ |
| **View Security Events** | ✅ | ❌ | ❌ | ✅ |
| **Inspect Audit Hash-Chain** | ✅ | ❌ | ❌ | ✅ |
| **Verify Audit Integrity** | ✅ | ❌ | ❌ | ✅ |
| **Export Evidence Packages** | ✅ | ❌ | ✅ | ✅ |

---

## 7. Cryptographic Audit Hash Chain

Every state change, authentication event, inference request, and guardrail update generates an append-only audit record.

```text
[Block #0: GENESIS]
  Sequence: 0
  Previous Hash: 0000000000000000000000000000000000000000000000000000000000000000
  Record Hash:   SHA256(0 || timestamp || GENESIS || payload || 0000...)
        |
        v
[Block #1: SESSION_CREATED]
  Sequence: 1
  Previous Hash: Record_Hash(#0)
  Record Hash:   SHA256(1 || timestamp || SESSION_CREATED || payload || Record_Hash(#0))
        |
        v
[Block #2: MODEL_INFERENCE_REQUEST]
  Sequence: 2
  Previous Hash: Record_Hash(#1)
  Record Hash:   SHA256(2 || timestamp || MODEL_INFERENCE_REQUEST || payload || Record_Hash(#1))
```

### Tamper Detection Proof
If an adversary or rogue administrator modifies the payload in Block #1 directly in the database:
1. Recomputed $\text{SHA256}(\text{Block \#1})$ no longer matches $\text{Record Hash}(\text{Block \#1})$.
2. Even if Block #1's hash is recomputed, $\text{Previous Hash}(\text{Block \#2})$ will not match.
3. `/api/v1/audit/verify` flags the exact sequence number:
   `INTEGRITY VIOLATION DETECTED AT SEQUENCE #1: Cryptographic integrity violation at sequence 1.`

---

## 8. Automated Test Suite (12/12 Passing)

Execute the full suite of automated Pytest tests:

```powershell
$env:PYTHONPATH="backend"; .\venv\Scripts\pytest backend\tests -v
```

### Test Results Breakdown:
- `test_audit_hash_chain.py`:
  - `test_audit_hash_chain_append_and_verify`: Validates monotonic sequence generation and SHA-256 recursive linkage.
  - `test_audit_hash_chain_tamper_detection`: Modifies an audit record in memory and mathematically confirms `broken_at_sequence` detection.
- `test_auth_rbac.py`:
  - `test_password_hashing`: Verifies bcrypt password salts and hashes.
  - `test_jwt_token_generation_and_decoding`: Verifies token signing and claim extraction.
  - `test_rbac_deny_by_default_and_role_separation`: Proves that Auditors cannot modify sessions, Red Team cannot alter blue-team defenses, and Blue Team cannot run red probes.
- `test_llm_gateway.py`:
  - `test_secrets_redaction`: Verifies redaction of API keys (`sk-xxx`), GitHub tokens (`ghp_xxx`), and passwords.
  - `test_session_memory_isolation`: Confirms that conversation turns in Session 1 do NOT leak into Session 2.
  - `test_rate_limiter_enforcement`: Tests sliding-window throttling when exceeding 60 RPM.
  - `test_llm_gateway_guardrail_interception`: Validates blue-team defensive regex intercepting prompts.
- `test_session_lifecycle.py`:
  - `test_session_state_machine_validations`: Validates valid transitions and rejects invalid ones (e.g. `COMPLETED` $\to$ `RUNNING`).
  - `test_isolation_policy_fail_closed_guarantee`: Proves the system fails closed when container isolation requirements cannot be fulfilled.
- `test_tenant_isolation.py`:
  - `test_tenant_isolation_boundary`: Tests that Tenant 2 users attempting to read Tenant 1 sessions receive `403 Forbidden` and trigger an automated security alert.

---

## 9. Quickstart & Local Installation

### Prerequisites
- **Python 3.11+** (Python 3.13 validated)
- **Node.js v20+** & **npm**

### Step 1: Clone and Set Up Backend
```bash
# 1. Create Python virtual environment
python -m venv venv

# Activate venv
# On Windows PowerShell:
.\venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Start FastAPI server
# On Windows PowerShell:
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# On Linux / macOS:
export PYTHONPATH=backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API runs at `http://127.0.0.1:8000`. Interactive Swagger docs available at `http://127.0.0.1:8000/docs`.

### Step 2: Set Up and Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://127.0.0.1:5173`.

### Pre-Configured Evaluator Test Accounts
Password for all test accounts: `BayoraPass123!@#`

| Role | Username | Tenant Affiliation | Scope of Privileges |
| :--- | :--- | :--- | :--- |
| **Security Administrator** | `admin` | `cyber-defense-hq` | Full access: policies, sessions, audit, users |
| **Red Team Operator** | `red_operator` | `cyber-defense-hq` | Adversarial probe execution, target models |
| **Blue Team Defender** | `blue_defender` | `cyber-defense-hq` | Defensive guardrails, regex rules, mitigations |
| **Compliance Auditor** | `auditor_sec` | `cyber-defense-hq` | Read-only evidence, audit chain verification |
| **Contractor Admin (Tenant 2)** | `tenant2_admin` | `external-contractor-tenant` | Isolated tenant: cannot access Tenant 1 data |

---

## 10. Docker Compose Multi-Container Deployment

To deploy the full production stack with PostgreSQL, FastAPI, Nginx, and Prometheus:

```bash
docker-compose up -d --build
```

### Running Services:
- **Web Application**: `http://localhost:3000`
- **FastAPI Backend API**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432` (`bayora_db`)
- **Prometheus Scraper**: `http://localhost:9090`

---

## 11. REST API Documentation

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Authenticate with username and password. Returns JWT bearer token.
- `GET /api/v1/auth/me`: Retrieve authenticated principal profile and permissions.

### Evaluation Sessions (`/api/v1/sessions`)
- `GET /api/v1/sessions`: List sessions scoped to current tenant.
- `POST /api/v1/sessions`: Create new evaluation session with isolation policy.
- `GET /api/v1/sessions/{id}`: Inspect session details. Rejects cross-tenant queries with `403`.
- `POST /api/v1/sessions/{id}/start`: Start execution. Fails closed if isolation feasibility fails.
- `POST /api/v1/sessions/{id}/terminate`: Terminate session execution and clean up sandbox.
- `PUT /api/v1/sessions/{id}/guardrails`: Update defensive regex and toxicity rules.

### Secure Inference Gateway (`/api/v1/inference`)
- `POST /api/v1/inference`: Broker inference request. Enforces rate limits, redaction, and guardrails.
- `GET /api/v1/inference/models`: List approved model registry items.
- `GET /api/v1/inference/history/{session_id}`: Retrieve session-isolated conversation log.

### Cryptographic Audit Trail (`/api/v1/audit`)
- `GET /api/v1/audit/records`: List append-only audit records.
- `POST /api/v1/audit/verify`: Verify recursive SHA-256 hash chain integrity.
- `POST /api/v1/audit/tamper-simulate?sequence_number={seq}`: Simulate database tampering for testing.
- `POST /api/v1/audit/tamper-repair?sequence_number={seq}`: Restore valid cryptographic hash.

### Observability & Security Monitoring (`/api/v1/security`)
- `GET /api/v1/security/events`: List structured security alerts.
- `POST /api/v1/security/simulate-egress-blocked`: Simulate host firewall dropping unauthorized egress.
- `GET /api/v1/capabilities`: Inspect host Docker socket, cgroups v2, and seccomp capabilities.
- `GET /metrics`: Prometheus formatted telemetry metrics.

---

## 12. STRIDE Threat Model & Residual Risks

### STRIDE Assessment Summary

| Threat Category | Mitigating Control in Bayora | Verification Proof |
| :--- | :--- | :--- |
| **Spoofing** | Cryptographically signed HS256 JWT tokens with user ID, role, and tenant embedding | `test_jwt_token_generation_and_decoding` |
| **Tampering** | Monotonic SHA-256 recursive hash chain. Any database mutation invalidates downstream hashes | `test_audit_hash_chain_tamper_detection` |
| **Repudiation** | Non-repudiable audit events for all session mutations, inferences, and mitigations | Append-only database records |
| **Information Disclosure** | Multi-tenant boundary checks on every query; prompt redaction filter | `test_tenant_isolation_boundary`, `test_secrets_redaction` |
| **Denial of Service** | Sliding-window 60 RPM rate limiter, 4,096 token ceiling, process timeout watchdogs | `test_rate_limiter_enforcement` |
| **Elevation of Privilege** | Deny-by-default RBAC enforced via dependency injection | `test_rbac_deny_by_default_and_role_separation` |

### Disclosed Residual Risks
1. **Hardware & Microarchitectural Side Channels**: cgroups v2 and Linux namespaces restrict CPU/memory allocations, but cannot eliminate microarchitectural cache-timing side-channels (e.g. Spectre variants) on shared multi-tenant physical silicon. Dedicated bare-metal nodes or isolated VM hypervisors (AWS Firecracker / Kata) are recommended for untrusted adversarial code.
2. **Proprietary Commercial LLM KV-Caches**: When mediating requests to proprietary external APIs (OpenAI / Anthropic), prompt-level session isolation is guaranteed at the Bayora gateway tier, but internal GPU KV-cache allocation is managed by the vendor. Dedicated local inference instances (vLLM) should be used for provable GPU cache isolation.

---

## 13. Project Directory Layout

```text
14.Hackhills/
├── ARCHITECTURE.md                  # Detailed architectural specifications
├── THREAT_MODEL.md                  # STRIDE threat model & trust boundaries
├── DEPLOYMENT.md                    # Production deployment & Linux hardening guide
├── API_DOCS.md                      # Complete REST API documentation
├── REPORT.md                        # Master implementation & test report
├── README.md                        # Project documentation (this file)
├── docker-compose.yml               # Multi-container production stack
├── Dockerfile.backend               # Non-root backend Dockerfile
├── prometheus.yml                   # Prometheus scraper config
├── .env.example                     # Environment template without real secrets
├── backend/
│   ├── requirements.txt             # Python dependencies
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point
│   │   ├── database.py              # Async database engine & seed initializers
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic v2 Settings
│   │   │   ├── security.py          # bcrypt hashing & JWT utilities
│   │   │   └── rbac.py              # Deny-by-default RBAC dependency checkers
│   │   ├── models/
│   │   │   └── entities.py          # SQLAlchemy 2.0 relational models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── audit_service.py     # SHA-256 recursive audit chain & verifier
│   │   │   ├── isolation_engine.py  # Fail-closed isolation driver & sandbox
│   │   │   ├── llm_gateway.py       # Session memory manager & redaction filter
│   │   │   ├── secrets_manager.py   # Scoped credential leasing provider
│   │   │   └── security_service.py  # Structured event logging & Prometheus metrics
│   │   └── api/v1/
│   │       ├── auth.py              # Login & authentication routes
│   │       ├── sessions.py          # Session lifecycle & state machine routes
│   │       ├── inference.py         # Secure LLM Gateway inference endpoint
│   │       ├── audit.py             # Audit ledger & verification endpoints
│   │       ├── evaluations.py       # Benchmark findings & evidence export
│   │       ├── security.py          # Security incident explorer
│   │       ├── admin.py             # Tenant & RBAC policy admin
│   │       └── system.py            # Health, readiness, capabilities & metrics
│   └── tests/
│       ├── test_audit_hash_chain.py # Hash-chain integrity & tamper detection tests
│       ├── test_auth_rbac.py        # RBAC permissions & JWT tests
│       ├── test_llm_gateway.py      # Rate limiting, memory isolation, redaction tests
│       ├── test_session_lifecycle.py# State machine & fail-closed isolation tests
│       └── test_tenant_isolation.py # Cross-tenant denial tests (403 Forbidden)
└── frontend/
    ├── package.json                 # Node.js dependencies
    ├── vite.config.ts               # Vite configuration with Tailwind CSS & API proxy
    ├── tsconfig.app.json            # TypeScript compiler configuration
    ├── Dockerfile.frontend          # Nginx frontend container
    ├── nginx.conf                   # Nginx reverse proxy configuration
    ├── index.html                   # HTML entry point with cybersecurity typography
    └── src/
        ├── main.tsx                 # React DOM mount point
        ├── App.tsx                  # Master application orchestrator
        ├── types.ts                 # TypeScript type interfaces
        ├── index.css                # Tailwind CSS & cybersecurity theme
        ├── services/
        │   └── api.ts               # Complete typed backend API client
        ├── components/
        │   ├── Navbar.tsx           # Navigation bar with role test switcher
        │   └── Sidebar.tsx          # Navigation sidebar with permission badges
        └── views/
            ├── DashboardView.tsx     # Security Operations Center (SOC) dashboard
            ├── SessionsView.tsx      # Evaluation Sessions manager
            ├── SessionDetailView.tsx # Isolation policy inspector
            ├── RedTeamView.tsx       # Red-team adversarial attack lab
            ├── BlueTeamView.tsx      # Blue-team defensive guardrails workspace
            ├── GatewayView.tsx       # Secure LLM Gateway & model registry
            ├── SecurityEventsView.tsx# Security incidents & egress violation monitor
            ├── AuditTrailView.tsx    # Cryptographic audit hash-chain verifier
            ├── ReportsView.tsx       # Evaluation reports & evidence export
            ├── AdminView.tsx         # User & RBAC administration
            ├── SystemHealthView.tsx  # Host capabilities & isolation health
            └── LoginView.tsx         # Authenticated login screen
```

---

## 14. License & Compliance Notice

Bayora is built for defensive AI safety research and governed red-teaming. Adversarial evaluations must only be executed against explicitly authorized model endpoints and environments in compliance with organizational policies and applicable safety regulations.
