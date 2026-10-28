import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: React.ReactNode;
  icon: LucideIcon;
  iconColor?: string;
  badge?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-cyan-500',
  badge,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-xl bg-card border border-border shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between text-muted-foreground mb-2">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg bg-secondary ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {subtext && <div className="mt-2 text-xs text-muted-foreground">{subtext}</div>}
    </div>
  );
};
