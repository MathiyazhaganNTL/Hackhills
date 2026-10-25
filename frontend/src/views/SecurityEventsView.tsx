import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Flame,
  CheckCircle,
  Eye,
  Shield,
  Zap
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { api } from '../services/api';

interface SecurityEventsViewProps {
  events: SecurityEvent[];
  onRefreshData?: () => void;
}

export const SecurityEventsView: React.FC<SecurityEventsViewProps> = ({
  events,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleSimulateEgress = async () => {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Security Incident & Event Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry capturing unauthorized cross-tenant requests, network egress violations, and policy enforcement blocks.
          </p>
        </div>

        <button
          onClick={handleSimulateEgress}
          disabled={isSimulating}
          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-sm flex items-center space-x-1.5"
          title="Triggers host firewall network egress filter to demonstrate real-time block"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Simulating...' : 'Simulate Blocked Egress'}</span>
        </button>
      </div>

      {simulationStatus && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 font-mono">
          <ShieldAlert className="w-4 h-4" />
          <span>{simulationStatus}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search events by type, source, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source Component</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No security incidents found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const isCrit = evt.severity === 'CRITICAL';
                  const isWarn = evt.severity === 'WARNING';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isCrit
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : isWarn
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {evt.event_type}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400">
                        {evt.source}
                      </td>
                      <td className="py-3 px-4 max-w-md truncate text-slate-300">
                        {evt.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 ml-auto border border-slate-700"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Drilldown</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Security Event Forensic Details</span>
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <span className="text-slate-500">EVENT ID:</span>
                <div className="text-slate-200">{selectedEvent.id}</div>
              </div>
              <div>
                <span className="text-slate-500">EVENT TYPE:</span>
                <div className="text-cyan-400 font-bold">{selectedEvent.event_type}</div>
              </div>
              <div>
                <span className="text-slate-500">DESCRIPTION:</span>
                <div className="text-slate-300 font-sans mt-0.5">{selectedEvent.description}</div>
              </div>
              <div>
                <span className="text-slate-500">METADATA PAYLOAD:</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto mt-1">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
