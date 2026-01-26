'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Icons } from './icons';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg bg-bg-muted animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 rounded-lg bg-bg-muted hover:bg-bg-elevated flex items-center justify-center transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Icons.Sun className="h-5 w-5 text-text-primary" />
      ) : (
        <Icons.Moon className="h-5 w-5 text-text-primary" />
      )}
    </button>
  );
}
