import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
  ShieldAlert,
  Hash,
  Wrench,
  Clock,
  Layers,
  Copy
} from 'lucide-react';
import { AuditRecord, AuditVerificationReport } from '../types';
import { api } from '../services/api';
import { CopyButton } from '../components/common/CopyButton';
import { SimulationNotice } from '../components/common/SimulationNotice';
import { SideDrawer } from '../components/common/SideDrawer';

interface AuditTrailViewProps {
  records: AuditRecord[];
  report: AuditVerificationReport | null;
  onRefreshData?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  records,
  report: initialReport,
  onRefreshData,
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
      setTamperFeedback(
        `Tampered with record #${seq} in database fixture! Run 'Verify Audit Chain' to observe mathematical detection.`
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Tamper simulation failed');
    }
  };

  const handleRepairTamper = async (seq: number) => {
    try {
      await api.repairTamper(seq);
      setTamperingSeq(null);
      setTamperFeedback(`Restored valid hash for record #${seq}! Re-verifying chain...`);
      const res = await api.verifyAuditChain();
      setReport(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Repair failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-emerald-500" />
            <span>Cryptographic Audit Trail & Hash-Chain Verifier</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monotonic append-only ledger with canonical JSON serialization, recursive SHA-256 hash chaining, and mathematical integrity verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Audit Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {report && (
        <div
          className={`p-5 rounded-xl border ${
            report.is_valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              {report.is_valid ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="text-sm font-bold tracking-wide">
                  {report.is_valid
                    ? 'CRYPTOGRAPHIC CHAIN VERIFIED — ALL RECORDS AUTHENTIC'
                    : `INTEGRITY VIOLATION DETECTED AT SEQUENCE #${report.broken_at_sequence}`}
                </div>
                <p className="text-xs font-sans opacity-90">{report.details}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono opacity-80 pt-1">
                  <span>Records Audited: {report.records_checked}</span>
                  {report.head_hash && (
                    <span className="truncate max-w-sm">Head Hash: {report.head_hash.slice(0, 24)}...</span>
                  )}
                  <span>Verified at: {new Date(report.verification_time).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {!report.is_valid && report.broken_at_sequence !== undefined && (
              <button
                onClick={() => handleRepairTamper(report.broken_at_sequence!)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 flex-shrink-0 shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Repair Tampered Record</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tamper Simulation Demonstration Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Interactive Demonstration: Cryptographic Tamper Detection</span>
          </div>
          <SimulationNotice label="CONTROLLED TEST FIXTURE" />
        </div>
        <p className="text-xs text-muted-foreground">
          Click below to corrupt an audit record in the database fixture without recomputing the SHA-256 hash. Then verify the chain to witness independent mathematical detection.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => handleSimulateTamper(1)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-mono font-medium flex items-center space-x-1"
          >
            <span>Simulate Tamper on Block #1</span>
          </button>
          {tamperFeedback && (
            <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
              {tamperFeedback}
            </span>
          )}
        </div>
      </div>

      {/* Audit Chain Ledger Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] border-b border-border tracking-wider">
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
            <tbody className="divide-y divide-border text-foreground">
              {records.map((rec) => {
                const isGenesis = rec.sequence_number === 0;

                return (
                  <tr
                    key={rec.sequence_number}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-secondary/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-primary">
                      #{rec.sequence_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-secondary text-foreground border border-border text-[11px]">
                        {rec.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{rec.principal_id}</td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {isGenesis ? '0000000000000000...' : `${rec.previous_hash.slice(0, 14)}...`}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <div className="flex items-center space-x-1">
                        <span>{rec.record_hash.slice(0, 16)}...</span>
                        <CopyButton text={rec.record_hash} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(rec);
                        }}
                        className="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground text-xs font-sans border border-border"
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

      {/* Forensic Block Drawer */}
      <SideDrawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-emerald-500" />
            <span>Audit Block #{selectedRecord?.sequence_number} Forensics</span>
          </div>
        }
        subtitle={selectedRecord && `Timestamp: ${selectedRecord.timestamp}`}
        footer={
          <button
            onClick={() => setSelectedRecord(null)}
            className="px-3.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted"
          >
            Close
          </button>
        }
      >
        {selectedRecord && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">EVENT TYPE:</span>
              <div className="text-primary font-bold text-sm mt-0.5">{selectedRecord.event_type}</div>
            </div>

            <div>
              <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold">
                <span>PREVIOUS SHA-256 HASH:</span>
                <CopyButton text={selectedRecord.previous_hash} />
              </div>
              <div className="text-muted-foreground break-all mt-0.5 p-2 rounded bg-secondary border border-border">
                {selectedRecord.previous_hash}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold">
                <span>RECORD SHA-256 HASH:</span>
                <CopyButton text={selectedRecord.record_hash} />
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 break-all mt-0.5 p-2 rounded bg-secondary border border-border">
                {selectedRecord.record_hash}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold">
                <span>CANONICAL PAYLOAD:</span>
                <CopyButton text={selectedRecord.canonical_payload} />
              </div>
              <pre className="p-3 rounded-lg bg-secondary border border-border text-[11px] text-foreground overflow-x-auto mt-0.5 whitespace-pre-wrap">
                {selectedRecord.canonical_payload}
              </pre>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};
