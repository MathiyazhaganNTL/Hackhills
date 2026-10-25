import {
  UserProfile,
  Session,
  ModelItem,
  IsolationPolicy,
  ExecutionProfile,
  SecurityEvent,
  AuditRecord,
  AuditVerificationReport,
  EvaluationRun,
  EvaluationFinding,
  InferenceResult,
  SystemCapabilities,
  Role
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;
  private currentUser: UserProfile | null = null;

  constructor() {
    this.token = localStorage.getItem('bayora_token');
    const storedUser = localStorage.getItem('bayora_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  setAuth(token: string, user: UserProfile) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('bayora_token', token);
    localStorage.setItem('bayora_user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('bayora_token');
    localStorage.removeItem('bayora_user');
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorDetail = 'API request failed';
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      }
      throw new Error(errorDetail);
    }

    // Handle CSV or text responses
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return (await res.text()) as unknown as T;
    }

    return await res.json();
  }

  // Authentication
  async login(username: string, password: string): Promise<UserProfile> {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const user: UserProfile = {
      id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      tenant_id: data.tenant_id,
      tenant_name: data.tenant_name,
      role: data.role as Role,
      permissions: data.permissions,
    };

    this.setAuth(data.access_token, user);
    return user;
  }

  // Sessions
  async getSessions(): Promise<Session[]> {
    return this.request<Session[]>('/sessions');
  }

  async getSession(id: string): Promise<Session> {
    return this.request<Session>(`/sessions/${id}`);
  }

  async createSession(payload: {
    name: string;
    description?: string;
    target_model_id: string;
    execution_profile_id: string;
    isolation_policy_id: string;
    blue_team_guardrail_config?: any;
  }): Promise<Session> {
    return this.request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async startSession(id: string): Promise<any> {
    return this.request<any>(`/sessions/${id}/start`, { method: 'POST' });
  }

  async terminateSession(id: string, reason?: string): Promise<any> {
    return this.request<any>(`/sessions/${id}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateGuardrails(sessionId: string, config: any): Promise<any> {
    return this.request<any>(`/sessions/${sessionId}/guardrails`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Inference Gateway
  async getModels(): Promise<ModelItem[]> {
    return this.request<ModelItem[]>('/inference/models');
  }

  async runInference(payload: {
    session_id: string;
    model_id: string;
    prompt: string;
  }): Promise<InferenceResult> {
    return this.request<InferenceResult>('/inference', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSessionHistory(sessionId: string): Promise<{ session_id: string; turns: any[] }> {
    return this.request<{ session_id: string; turns: any[] }>(`/inference/history/${sessionId}`);
  }

  // Security Events & Observability
  async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    return this.request<SecurityEvent[]>(`/security/events?limit=${limit}`);
  }

  async simulateEgressViolation(sessionId: string, targetHost?: string): Promise<any> {
    return this.request<any>('/security/simulate-egress-blocked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, target_host: targetHost }),
    });
  }

  // Cryptographic Audit Trail
  async getAuditRecords(limit: number = 50): Promise<AuditRecord[]> {
    return this.request<AuditRecord[]>(`/audit/records?limit=${limit}`);
  }

  async verifyAuditChain(): Promise<AuditVerificationReport> {
    return this.request<AuditVerificationReport>('/audit/verify', { method: 'POST' });
  }

  async simulateTamper(sequenceNumber: number): Promise<any> {
    return this.request<any>(`/audit/tamper-simulate?sequence_number=${sequenceNumber}`, {
      method: 'POST',
    });
  }

  async repairTamper(sequenceNumber: number): Promise<any> {
    return this.request<any>(`/audit/tamper-repair?sequence_number=${sequenceNumber}`, {
      method: 'POST',
    });
  }

  // Evaluations & Findings
  async getEvaluationRuns(): Promise<EvaluationRun[]> {
    return this.request<EvaluationRun[]>('/evaluations/runs');
  }

  async getFindings(sessionId?: string): Promise<EvaluationFinding[]> {
    const query = sessionId ? `?session_id=${sessionId}` : '';
    return this.request<EvaluationFinding[]>(`/evaluations/findings${query}`);
  }

  async updateFindingMitigation(
    findingId: string,
    mitigation_status: string,
    mitigation_notes: string
  ): Promise<any> {
    return this.request<any>(`/evaluations/findings/${findingId}/mitigate`, {
      method: 'PUT',
      body: JSON.stringify({ mitigation_status, mitigation_notes }),
    });
  }

  async exportEvidence(sessionId: string, format: 'json' | 'csv'): Promise<any> {
    return this.request<any>(`/evaluations/${sessionId}/export?format=${format}`);
  }

  // Admin & Policies
  async getPolicies(): Promise<IsolationPolicy[]> {
    return this.request<IsolationPolicy[]>('/admin/policies');
  }

  async getProfiles(): Promise<ExecutionProfile[]> {
    return this.request<ExecutionProfile[]>('/admin/profiles');
  }

  async getUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/admin/users');
  }

  // System Health
  async getCapabilities(): Promise<SystemCapabilities> {
    return this.request<SystemCapabilities>('/capabilities');
  }

  async getVaultStatus(): Promise<any> {
    return this.request<any>('/vault-status');
  }
}

export const api = new ApiClient();
