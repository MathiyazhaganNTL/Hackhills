import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={`w-screen ${widthClass} pointer-events-auto bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200`}
        >
          {/* Header */}
          <div className="p-5 border-b border-border flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="text-base font-bold text-foreground flex items-center space-x-2">
                {title}
              </div>
              {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-4 border-t border-border bg-secondary/50 flex items-center justify-end space-x-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
