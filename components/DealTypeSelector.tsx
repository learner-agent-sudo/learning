'use client';

import { DealType } from '@/lib/workflow';

interface Props {
  dealType: DealType;
  onChange: (d: DealType) => void;
}

const OPTIONS: { value: DealType; label: string; disabled: boolean; tooltip: string }[] = [
  { value: 'apa', label: 'APA (Asset)', disabled: false, tooltip: 'Asset Purchase Agreement' },
  { value: 'spa', label: 'SPA (Stock)', disabled: true, tooltip: 'Stock Purchase Agreement — coming soon' },
  { value: 'merger', label: 'Merger', disabled: true, tooltip: 'Statutory merger — coming soon' },
];

export function DealTypeSelector({ dealType, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Deal type"
      className="inline-flex rounded-full border border-line bg-panel p-1 text-sm shadow-card"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === dealType;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-disabled={opt.disabled}
            disabled={opt.disabled}
            title={opt.tooltip}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={
              'min-h-9 rounded-full px-3.5 py-1.5 transition-colors focus-visible:outline-offset-[-2px] ' +
              (active
                ? 'bg-module font-medium text-onaccent'
                : opt.disabled
                ? 'cursor-not-allowed text-muted'
                : 'text-ink hover:bg-ink/5')
            }
          >
            {opt.label}
            {opt.disabled && <span className="ml-1 text-[10px] uppercase tracking-wide">soon</span>}
          </button>
        );
      })}
    </div>
  );
}
