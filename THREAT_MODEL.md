# Bayora — Security Threat Model & Trust Boundaries

## 1. System Trust Boundaries

```
+------------------------------------------------------------------------------------------+
|  UNTRUSTED ZONE: Web Browser / Operators / Public Networks                                |
|  (Red Team, Blue Team, Administrators, Auditors)                                          |
+------------------------------------------------------------------------------------------+
                                         |  HTTPS (TLS 1.3) + Signed JWT Bearer
                                         v
+==========================================================================================+
|  PERIMETER TRUST BOUNDARY: Bayora FastAPI Gateway                                         |
|  - Deny-by-Default RBAC Authentication & Authorization Dependency Injection              |
|  - Multi-Tenant Isolation Filter (Every query verified against principal tenant ID)       |
|  - Rate Limiter & Token Quota Governor                                                   |
+==========================================================================================+
            |                                           |
            v                                           v
+-------------------------------+           +-------------------------------+
| EXECUTION ISOLATION PERIMETER |           | INFERENCE ISOLATION PERIMETER |
| - Linux Namespaces / cgroups  |           | - Dedicated Mediation Gateway |
| - Rootless Container Driver   |           | - Per-Session Memory Stores   |
| - Read-Only Filesystem Sandbox|           | - Prompt Redaction Engine     |
| - Default-Deny Network Egress |           | - Zero Cross-Session Bleeding |
+-------------------------------+           +-------------------------------+
            |                                           |
            +-------------------+-----------------------+
                                |
                                v
+==========================================================================================+
|  HIGH-ASSURANCE AUDIT & PERSISTENCE ZONE                                                  |
|  - Append-Only PostgreSQL / SQLite Storage Engine                                        |
|  - Monotonic SHA-256 Recursive Cryptographic Hash Chain                                  |
|  - Independent Mathematical Integrity Verification Engine                               |
+==========================================================================================+
```

---

## 2. STRIDE Threat Analysis

| Threat Category | Specific Attack Vector | Mitigating Bayora Control | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker crafts forgery JWT or impersonates another tenant's user | HS256/RS256 cryptographically signed tokens with strict expiration (`exp`) and tenant identity embedding | `test_jwt_token_generation_and_decoding`, `test_tenant_isolation_boundary` |
| **Tampering** | Rogue DBA or attacker modifies historical audit records or evaluation results | Monotonic integer sequence counter + SHA-256 recursive hash chaining `SHA256(seq || timestamp || event || payload || prev_hash)`. Tampering breaks all subsequent hashes. | `test_audit_hash_chain_tamper_detection`, `POST /api/v1/audit/verify` |
| **Repudiation** | Operator denies launching adversarial attack or modifying defensive rule | Non-repudiable audit logging for all mutations (`SESSION_CREATED`, `MODEL_INFERENCE_REQUEST`, `BLUE_TEAM_GUARDRAILS_UPDATED`) | Automated verification engine and append-only database schema |
| **Information Disclosure** | Cross-tenant database queries or cross-session prompt bleeding | All backend queries enforce `WHERE tenant_id == current_user.tenant_id`. Conversation memory is strictly partitioned by `(tenant_id, session_id)`. Real-time secrets/PII redaction engine. | `test_tenant_isolation_boundary`, `test_session_memory_isolation`, `test_secrets_redaction` |
| **Denial of Service** | Red-team flood attacks or runaway container processes | Sliding-window request rate limiter (60 RPM/session), max input token ceiling (4,096 tokens), cgroups v2 CPU/memory limits, process timeout watchdog | `test_rate_limiter_enforcement`, `WorkloadSandboxRunner.execute_task` timeout |
| **Elevation of Privilege** | Auditor or Red Team operator attempts to update blue-team guardrails or modify system policies | Deny-by-default RBAC enforced via FastAPI dependency injection (`require_permission(...)`). Client UI role restrictions backed by backend 403 Forbidden. | `test_rbac_deny_by_default_and_role_separation` |

---

## 3. Residual Risk Register & Disclosures

1. **Hardware & Speculative Execution Side Channels**:
   - *Risk*: cgroups v2 and Linux namespaces restrict CPU cores and memory quotas, but do not physically eliminate microarchitectural cache-timing side-channels (e.g. Spectre/Meltdown variants) on shared multi-tenant physical hardware.
   - *Mitigation / Deployment Rule*: High-assurance environments must run tenant workloads on dedicated bare-metal nodes or isolated VM hypervisors (e.g. AWS Firecracker / Kata Containers).

2. **Proprietary External LLM KV-Cache Boundaries**:
   - *Risk*: When evaluating proprietary commercial models (e.g. OpenAI / Anthropic), prompt-level session IDs guarantee isolation at the Bayora application tier, but the underlying provider's multi-tenant GPU KV-cache allocation is outside Bayora's physical control.
   - *Mitigation / Disclosure*: Documented explicitly in Bayora. Deploy local safety-evaluated models (vLLM / TensorRT-LLM) with dedicated GPU device passthrough for provable GPU cache isolation.

3. **Cryptographic Chain Rewrite Privilege**:
   - *Risk*: A superuser with direct root access to the physical database could theoretically rewrite the entire chain from scratch.
   - *Mitigation*: Bayora supports periodic anchoring (`audit_anchors`) to external WORM (Write Once, Read Many) immutable storage and remote append-only log collectors.
