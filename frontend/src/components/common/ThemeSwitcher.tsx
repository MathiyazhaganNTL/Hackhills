import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../services/theme';

export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-lg bg-secondary border border-border text-xs ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light theme"
        className={`p-1.5 rounded-md transition ${
          theme === 'light'
            ? 'bg-card text-foreground shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark theme"
        className={`p-1.5 rounded-md transition ${
          theme === 'dark'
            ? 'bg-card text-foreground shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        title="System theme"
        className={`p-1.5 rounded-md transition ${
          theme === 'system'
            ? 'bg-card text-foreground shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
