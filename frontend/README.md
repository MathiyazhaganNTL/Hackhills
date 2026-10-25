# Bayora — Frontend Cybersecurity Console

The **Bayora Frontend** is a high-assurance cybersecurity console built with React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts.

For full platform architecture, threat modeling, and backend documentation, refer to the [Root README](../README.md).

---

## Features & Implemented Views

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

## Development & Build Commands

```bash
# Install dependencies
npm install

# Run Vite development server (proxies /api to http://127.0.0.1:8000)
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## Quick-Fill Evaluator Test Accounts
Password for all accounts: `BayoraPass123!@#`

- 🛡️ Security Administrator: `admin`
- 🔴 Red Team Operator: `red_operator`
- 🔵 Blue Team Defender: `blue_defender`
- 📋 Compliance Auditor: `auditor_sec`
- ⚠️ External Contractor Tenant: `tenant2_admin` (tests cross-tenant `403 Forbidden` rejection)
