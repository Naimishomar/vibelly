import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme, getTheme, type Theme } from '../lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme());

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 hover:text-white hover:border-white/30 hover:bg-zinc-800 transition-all cursor-pointer"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
