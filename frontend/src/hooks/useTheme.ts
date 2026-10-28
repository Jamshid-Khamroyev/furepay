import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_COLORS: Record<Theme, string> = { light: '#F5F2EB', dark: '#100F0D' };

const readTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  // Follow the OS setting until the user picks a theme explicitly
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme')) return;
      const next = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  }, []);

  return { theme, toggle };
}
