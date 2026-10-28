import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Zap,
  Clock,
  Layers,
  Copy
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { SimulationNotice } from '../components/common/SimulationNotice';
import { SideDrawer } from '../components/common/SideDrawer';
import { CopyButton } from '../components/common/CopyButton';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

interface SecurityEventsViewProps {
  events: SecurityEvent[];
  onRefreshData?: () => void;
}

export const SecurityEventsView: React.FC<SecurityEventsViewProps> = ({
  events,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimulateConfirm, setShowSimulateConfirm] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleExecuteEgressSimulation = async () => {
    setShowSimulateConfirm(false);
    setIsSimulating(true);
    setSimulationStatus(null);
    try {
      await api.simulateEgressViolation('session-sec-101', 'malicious-c2.external-domain.net');
      setSimulationStatus('Egress violation simulated: dropped by host network filter & logged!');
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSimulationStatus(null), 4000);
    } catch (err) {
      setSimulationStatus('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Security Incident & Event Monitor</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time security telemetry capturing unauthorized cross-tenant requests, network egress violations, and policy enforcement blocks.
          </p>
        </div>

        <button
          onClick={() => setShowSimulateConfirm(true)}
          disabled={isSimulating}
          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-xs flex items-center space-x-1.5"
          title="Triggers host firewall network egress filter to demonstrate real-time block"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Simulating...' : 'Simulate Blocked Egress'}</span>
        </button>
      </div>

      {simulationStatus && (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{simulationStatus}</span>
          </div>
          <SimulationNotice label="DEMONSTRATION ONLY" />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search events by type, source, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px] border-b border-border tracking-wider">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source Component</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-mono">
                    No security incidents found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-secondary/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <SeverityBadge severity={evt.severity} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      {evt.event_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary font-medium">
                      {evt.source}
                    </td>
                    <td className="py-3 px-4 max-w-md truncate text-muted-foreground font-sans">
                      {evt.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        className="px-2 py-1 rounded bg-secondary hover:bg-muted text-foreground text-xs font-medium flex items-center space-x-1 ml-auto border border-border"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Drawer */}
      <SideDrawer
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Security Incident Forensic Details</span>
          </div>
        }
        subtitle={
          selectedEvent && (
            <div className="flex items-center space-x-1 font-mono text-[10px] text-muted-foreground">
              <span>{selectedEvent.id}</span>
              <CopyButton text={selectedEvent.id} />
            </div>
          )
        }
        footer={
          <button
            onClick={() => setSelectedEvent(null)}
            className="px-3.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted"
          >
            Close Panel
          </button>
        }
      >
        {selectedEvent && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Severity:</span>
              <div className="mt-1">
                <SeverityBadge severity={selectedEvent.severity} />
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Event Type:</span>
              <div className="text-primary font-bold text-sm mt-0.5">{selectedEvent.event_type}</div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Source Component:</span>
              <div className="text-foreground mt-0.5">{selectedEvent.source}</div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Description:</span>
              <div className="text-foreground font-sans mt-0.5 bg-secondary/50 p-3 rounded-lg border border-border">
                {selectedEvent.description}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Metadata Payload:</span>
              <pre className="p-3 rounded-lg bg-secondary border border-border text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto mt-1">
                {JSON.stringify(selectedEvent.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SideDrawer>

      {/* Confirmation Dialog for Egress Simulation */}
      <ConfirmationDialog
        isOpen={showSimulateConfirm}
        title="Simulate Container Egress Violation"
        message="This action simulates an adversarial workload attempting an unauthorized outbound network connection to 'malicious-c2.external-domain.net:443'. The default-deny firewall will drop the connection and generate a critical security alert."
        confirmLabel="Simulate Egress Drop"
        isDestructive={false}
        onConfirm={handleExecuteEgressSimulation}
        onCancel={() => setShowSimulateConfirm(false)}
      />
    </div>
  );
};
