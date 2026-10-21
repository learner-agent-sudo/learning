'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { THEME_KEY } from '@/lib/themeScript';

type Choice = 'system' | 'light' | 'dark';

function apply(choice: Choice) {
  const dark =
    choice === 'dark' || (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

const OPTIONS: { value: Choice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'Match system', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** Light / system / dark switch; the choice is kept in this browser. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [choice, setChoice] = useState<Choice>('system');

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      saved = null;
    }
    setChoice(saved === 'light' || saved === 'dark' ? saved : 'system');
  }, []);

  // Follow the system setting while "system" is chosen.
  useEffect(() => {
    if (choice !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [choice]);

  const pick = (c: Choice) => {
    setChoice(c);
    apply(c);
    try {
      if (c === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, c);
    } catch {
      // storage unavailable: the choice lasts for this page only
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={`inline-flex items-center rounded-full border border-line bg-panel p-0.5 shadow-card ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const on = value === choice;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => pick(value)}
            className={
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-offset-[-2px] ' +
              (on ? 'bg-ink text-paper' : 'text-muted hover:text-ink')
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
