import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const norm = severity.toUpperCase();

  if (norm === 'CRITICAL') {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 ${className}`}
      >
        <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        <span>CRITICAL</span>
      </span>
    );
  }

  if (norm === 'WARNING') {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 ${className}`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>WARNING</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 ${className}`}
    >
      <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
      <span>INFO</span>
    </span>
  );
};
