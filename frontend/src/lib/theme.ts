export type Theme = 'dark' | 'light';

const KEY = 'vibe_theme';

export const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(KEY);
  return saved === 'light' || saved === 'dark' ? saved : null;
};

export const getTheme = (): Theme => {
  return getStoredTheme() ?? 'dark';
};

export const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEY, theme);
};

export const toggleTheme = (): Theme => {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};
