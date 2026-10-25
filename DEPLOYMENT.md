# Bayora — Production Deployment & Hardening Guide

## 1. Quickstart: Local Development Execution

### Prerequisites
- Python 3.11+ (Python 3.13 validated)
- Node.js v20+ & npm

### Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Launch FastAPI backend
export PYTHONPATH=backend # On Windows: $env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API runs at `http://127.0.0.1:8000`. OpenAPI Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the interactive cybersecurity console at `http://127.0.0.1:5173`.

---

## 2. Production Containerized Deployment (Docker Compose)

```bash
# Boot complete production stack (PostgreSQL, FastAPI Backend, Nginx Frontend, Prometheus)
docker-compose up -d --build
```
- Web Application: `http://localhost:3000`
- API Backend: `http://localhost:8000`
- Prometheus Metrics: `http://localhost:9090`

---

## 3. Host Hardening & Linux Isolation Architecture

For high-assurance deployments, configure the host kernel and container runtime with the following controls:

### A. Rootless Container Runtime
Execute workload containers under unprivileged user namespaces to prevent container breakout from yielding host root access:
```bash
# Enable rootless Docker/containerd
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock
```

### B. cgroups v2 Unified Hierarchy
Ensure cgroups v2 is enabled in your Linux boot parameters (`/etc/default/grub`):
```text
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1"
```
Verify cgroups controllers:
```bash
cat /sys/fs/cgroup/cgroup.controllers
# Output: cpuset cpu io memory pids
```

### C. Seccomp Profile Enforcement
Apply Bayora's strict syscall whitelist restricting untrusted code from making dangerous system calls (`clone3`, `ptrace`, `unshare`, `bpf`):
```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "openat", "close", "fstat", "mmap", "exit_group", "futex"],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

### D. Host Firewall Network Egress Default-Deny
Prevent adversarial evaluation workloads from making unauthorized external outbound network connections:
```bash
# Default deny outbound from evaluation bridge
sudo iptables -I DOCKER-USER -i bayora-eval-br -j DROP
# Allow only authorized inference gateway DNS and IP
sudo iptables -I DOCKER-USER -i bayora-eval-br -d 10.0.1.50 -p tcp --dport 8000 -j ACCEPT
```

---

## 4. HashiCorp Vault Secrets Integration

To enable short-lived credential leasing with Vault:
```bash
# Export Vault connection
export VAULT_ADDR="https://vault.internal.corp:8200"
export VAULT_TOKEN="s.YourAppRoleTokenHere"

# Enable AppRole authentication for Bayora workloads
vault auth enable approle
vault write auth/approle/role/bayora-eval \
    token_policies="bayora-eval-policy" \
    token_ttl=1h \
    token_max_ttl=4h
```
