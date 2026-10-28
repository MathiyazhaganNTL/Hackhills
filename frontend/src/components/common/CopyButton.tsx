import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy: ${text}`}
      className={`inline-flex items-center space-x-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition text-[11px] font-mono ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          {label && <span className="text-emerald-500">Copied</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
