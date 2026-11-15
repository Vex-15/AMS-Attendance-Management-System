'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'mitaoe_theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

interface ThemeToggleProps {
  className?: string;
  /** Icon-only by default; `withLabel` shows the current mode beside it. */
  withLabel?: boolean;
}

export default function ThemeToggle({ className = '', withLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }

    // First visit follows the operating system; after that the choice sticks.
    const prefersLight =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial: Theme = stored === 'light' || (!stored && prefersLight) ? 'light' : 'dark';
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  const nextLabel = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel} mode`}
      aria-pressed={theme === 'light'}
      title={`Switch to ${nextLabel} mode`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white ${
        withLabel ? 'h-9 px-3' : 'h-9 w-9'
      } ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {withLabel && <span className="text-[11px] font-semibold">{ready ? (theme === 'dark' ? 'Light' : 'Dark') : 'Theme'}</span>}
    </button>
  );
}
