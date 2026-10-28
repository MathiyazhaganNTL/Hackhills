import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ViewType } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { SessionsView } from './views/SessionsView';
import { SessionDetailView } from './views/SessionDetailView';
import { RedTeamView } from './views/RedTeamView';
import { BlueTeamView } from './views/BlueTeamView';
import { GatewayView } from './views/GatewayView';
import { SecurityEventsView } from './views/SecurityEventsView';
import { AuditTrailView } from './views/AuditTrailView';
import { ReportsView } from './views/ReportsView';
import { AdminView } from './views/AdminView';
import { SystemHealthView } from './views/SystemHealthView';
import { LoginView } from './views/LoginView';
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
  SystemCapabilities
} from './types';
import { api } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(api.getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Core Data States
  const [sessions, setSessions] = useState<Session[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [policies, setPolicies] = useState<IsolationPolicy[]>([]);
  const [profiles, setProfiles] = useState<ExecutionProfile[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [auditReport, setAuditReport] = useState<AuditVerificationReport | null>(null);
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [findings, setFindings] = useState<EvaluationFinding[]>([]);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [vaultStatus, setVaultStatus] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Loading States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Initial load
  const loadPlatformData = async () => {
    if (!api.getToken()) return;
    setIsRefreshing(true);
    try {
      const [
        sess,
        mdls,
        pols,
        prfs,
        evts,
        audRecs,
        audRep,
        evRuns,
        evFinds,
        caps,
        vlt,
      ] = await Promise.all([
        api.getSessions().catch(() => []),
        api.getModels().catch(() => []),
        api.getPolicies().catch(() => []),
        api.getProfiles().catch(() => []),
        api.getSecurityEvents().catch(() => []),
        api.getAuditRecords().catch(() => []),
        api.verifyAuditChain().catch(() => null),
        api.getEvaluationRuns().catch(() => []),
        api.getFindings().catch(() => []),
        api.getCapabilities().catch(() => null),
        api.getVaultStatus().catch(() => null),
      ]);

      setSessions(sess);
      setModels(mdls);
      setPolicies(pols);
      setProfiles(prfs);
      setSecurityEvents(evts);
      setAuditRecords(audRecs);
      setAuditReport(audRep);
      setRuns(evRuns);
      setFindings(evFinds);
      setCapabilities(caps);
      setVaultStatus(vlt);

      // Admin only: load users
      if (api.getCurrentUser()?.role === 'security_admin') {
        api.getUsers().then(setUsers).catch(() => setUsers([]));
      }
    } catch (e) {
      console.error('Failed to load telemetry', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPlatformData();
    }
  }, [currentUser]);

  // Auth Handlers
  const handleLogin = async (u: string, p: string) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const user = await api.login(u, p);
      setCurrentUser(user);
      setCurrentView('dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
  };

  const handleQuickSwitchRole = async (username: string) => {
    try {
      const user = await api.login(username, 'BayoraPass123!@#');
      setCurrentUser(user);
      setSelectedSessionId(null);
      // If switching to tenant2, go to sessions to test cross-tenant denial
      if (username === 'tenant2_admin') {
        setCurrentView('sessions');
      }
    } catch (err: any) {
      alert(`Role switch failed: ${err.message}`);
    }
  };

  // Session Handlers
  const handleStartSession = async (id: string) => {
    try {
      await api.startSession(id);
      await loadPlatformData();
    } catch (e: any) {
      alert(`Start failed: ${e.message}`);
    }
  };

  const handleTerminateSession = async (id: string) => {
    try {
      await api.terminateSession(id, 'Operator termination');
      await loadPlatformData();
    } catch (e: any) {
      alert(`Termination failed: ${e.message}`);
    }
  };

  const handleCreateSession = async (payload: any) => {
    try {
      await api.createSession(payload);
      await loadPlatformData();
    } catch (e: any) {
      alert(`Creation failed: ${e.message}`);
    }
  };

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        isLoading={isLoginLoading}
        error={loginError}
      />
    );
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const selectedPolicy = policies.find((p) => p.id === selectedSession?.isolation_policy_id);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onQuickSwitchRole={handleQuickSwitchRole}
        onLogout={handleLogout}
        onRefreshData={loadPlatformData}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => {
            setCurrentView(v);
            setSelectedSessionId(null);
          }}
          userRole={currentUser.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto">
            {selectedSessionId && selectedSession ? (
              <SessionDetailView
                session={selectedSession}
                policy={selectedPolicy}
                onBack={() => setSelectedSessionId(null)}
                onStartSession={handleStartSession}
                onTerminateSession={handleTerminateSession}
                onNavigateToRedTeam={(sId) => {
                  setSelectedSessionId(null);
                  setCurrentView('red_team');
                }}
                onNavigateToAudit={() => {
                  setSelectedSessionId(null);
                  setCurrentView('audit');
                }}
                onExportEvidence={(sId, fmt) => api.exportEvidence(sId, fmt)}
              />
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView
                    sessions={sessions}
                    securityEvents={securityEvents}
                    auditReport={auditReport}
                    capabilities={capabilities}
                    onNavigate={setCurrentView}
                    onVerifyAudit={async () => {
                      const rep = await api.verifyAuditChain();
                      setAuditReport(rep);
                    }}
                    isVerifyingAudit={isRefreshing}
                  />
                )}

                {currentView === 'sessions' && (
                  <SessionsView
                    sessions={sessions}
                    models={models}
                    policies={policies}
                    profiles={profiles}
                    onSelectSession={(id) => setSelectedSessionId(id)}
                    onStartSession={handleStartSession}
                    onTerminateSession={handleTerminateSession}
                    onCreateSession={handleCreateSession}
                  />
                )}

                {currentView === 'red_team' && (
                  <RedTeamView
                    sessions={sessions}
                    models={models}
                    onRefreshData={loadPlatformData}
                  />
                )}

                {currentView === 'blue_team' && (
                  <BlueTeamView
                    sessions={sessions}
                    findings={findings}
                    onRefreshData={loadPlatformData}
                  />
                )}

                {currentView === 'gateway' && <GatewayView models={models} />}

                {currentView === 'security_events' && (
                  <SecurityEventsView
                    events={securityEvents}
                    onRefreshData={loadPlatformData}
                  />
                )}

                {currentView === 'audit' && (
                  <AuditTrailView
                    records={auditRecords}
                    report={auditReport}
                    onRefreshData={loadPlatformData}
                  />
                )}

                {currentView === 'reports' && (
                  <ReportsView
                    runs={runs}
                    findings={findings}
                    sessions={sessions}
                  />
                )}

                {currentView === 'admin' && (
                  <AdminView users={users} policies={policies} />
                )}

                {currentView === 'system' && (
                  <SystemHealthView
                    capabilities={capabilities}
                    vaultStatus={vaultStatus}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
