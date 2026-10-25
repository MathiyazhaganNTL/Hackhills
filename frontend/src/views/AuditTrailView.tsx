import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  Database,
  Hash,
  Wrench
} from 'lucide-react';
import { AuditRecord, AuditVerificationReport } from '../types';
import { api } from '../services/api';

interface AuditTrailViewProps {
  records: AuditRecord[];
  report: AuditVerificationReport | null;
  onRefreshData?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  records,
  report: initialReport,
  onRefreshData
}) => {
  const [report, setReport] = useState<AuditVerificationReport | null>(initialReport);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperingSeq, setTamperingSeq] = useState<number | null>(null);
  const [tamperFeedback, setTamperFeedback] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setReport(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async (seq: number) => {
    try {
      await api.simulateTamper(seq);
      setTamperingSeq(seq);
      setTamperFeedback(`Tampered with record seq #${seq} in database! Click 'Verify Audit Chain' to observe cryptographic detection.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Tamper simulation failed');
    }
  };

  const handleRepairTamper = async (seq: number) => {
    try {
      await api.repairTamper(seq);
      setTamperingSeq(null);
      setTamperFeedback(`Restored valid hash for record seq #${seq}! Re-verify chain.`);
      const res = await api.verifyAuditChain();
      setReport(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Repair failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Verification Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span>Cryptographic Audit Trail & Hash-Chain Verifier</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Strict append-only ledger with canonical JSON serialization, recursive SHA-256 hash chaining, and independent integrity verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Audit Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {report && (
        <div
          className={`p-5 rounded-xl border ${
            report.is_valid
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {report.is_valid ? (
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-bold tracking-wide">
                  {report.is_valid
                    ? 'CRYPTOGRAPHIC CHAIN VERIFIED — ALL RECORDS AUTHENTIC'
                    : `INTEGRITY VIOLATION DETECTED AT SEQUENCE #${report.broken_at_sequence}`}
                </div>
                <p className="text-xs mt-1 text-slate-300 font-sans">{report.details}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
                  <span>Records Audited: {report.records_checked}</span>
                  {report.head_hash && (
                    <span className="truncate max-w-sm">Head Hash: {report.head_hash.slice(0, 24)}...</span>
                  )}
                  <span>Timestamp: {new Date(report.verification_time).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {!report.is_valid && report.broken_at_sequence !== undefined && (
              <button
                onClick={() => handleRepairTamper(report.broken_at_sequence!)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 flex-shrink-0"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Repair Tampered Record</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tamper Simulation Demonstration Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Interactive Evaluator Demo: Test Cryptographic Tamper Detection</span>
          </div>
          {tamperingSeq !== null && (
            <button
              onClick={() => handleRepairTamper(tamperingSeq)}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              Reset / Restore
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Click below to corrupt an audit record in the database without updating the SHA-256 hash. Then verify the chain to prove mathematical tamper detection.
        </p>

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => handleSimulateTamper(1)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-medium flex items-center space-x-1"
          >
            <span>Simulate Tampering with Record #1</span>
          </button>
          {tamperFeedback && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800">
              {tamperFeedback}
            </span>
          )}
        </div>
      </div>

      {/* Audit Chain Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Principal ID</th>
                <th className="py-3 px-4">Previous Hash</th>
                <th className="py-3 px-4">Record SHA-256</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {records.map((rec) => {
                const isGenesis = rec.sequence_number === 0;

                return (
                  <tr key={rec.sequence_number} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      #{rec.sequence_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
                        {rec.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{rec.principal_id}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {isGenesis ? '0000000000000000...' : `${rec.previous_hash.slice(0, 14)}...`}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 text-[11px]">
                      {rec.record_hash.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans border border-slate-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payload Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span>Audit Block #{selectedRecord.sequence_number} Forensic Inspection</span>
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-500 hover:text-slate-300 font-sans"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500">EVENT TYPE:</span>
                <div className="text-cyan-400 font-bold">{selectedRecord.event_type}</div>
              </div>
              <div>
                <span className="text-slate-500">PREVIOUS SHA-256 HASH:</span>
                <div className="text-slate-400 break-all">{selectedRecord.previous_hash}</div>
              </div>
              <div>
                <span className="text-slate-500">RECORD SHA-256 HASH:</span>
                <div className="text-emerald-400 break-all">{selectedRecord.record_hash}</div>
              </div>
              <div>
                <span className="text-slate-500">DETERMINISTIC CANONICAL PAYLOAD:</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 overflow-x-auto mt-1 whitespace-pre-wrap">
                  {selectedRecord.canonical_payload}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-sans"
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
