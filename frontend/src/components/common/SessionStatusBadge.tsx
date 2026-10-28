import React from 'react';
import { Play, CheckCircle2, Clock, Square, AlertCircle, RefreshCw } from 'lucide-react';
import { Session } from '../../types';

interface SessionStatusBadgeProps {
  status: Session['status'];
  className?: string;
}

export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'RUNNING':
      return (
        <span
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>RUNNING</span>
        </span>
      );
    case 'QUEUED':
      return (
        <span
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 ${className}`}
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>QUEUED</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>COMPLETED</span>
        </span>
      );
    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${className}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>DRAFT</span>
        </span>
      );
    case 'TERMINATED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 ${className}`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>TERMINATED</span>
        </span>
      );
    case 'FAILED':
    default:
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>FAILED</span>
        </span>
      );
  }
};
