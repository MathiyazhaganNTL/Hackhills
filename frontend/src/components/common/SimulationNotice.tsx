import React from 'react';
import { FlaskConical } from 'lucide-react';

interface SimulationNoticeProps {
  label?: string;
  className?: string;
}

export const SimulationNotice: React.FC<SimulationNoticeProps> = ({
  label = 'SIMULATION DEMO',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400 ${className}`}
      title="This is a controlled simulation demonstration in an isolated test fixture."
    >
      <FlaskConical className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      <span>{label}</span>
    </span>
  );
};
