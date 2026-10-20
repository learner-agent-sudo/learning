'use client';

import { Depth } from '@/lib/workflow';

interface Props {
  depth: Depth;
  onChange: (d: Depth) => void;
  labels?: Record<Depth, string>;
}

const DEFAULT_LABELS: Record<Depth, string> = {
  beginner: 'Beginner',
  practitioner: 'Practitioner',
};

export function DepthToggle({ depth, onChange, labels = DEFAULT_LABELS }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Content depth"
      className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-sm shadow-sm"
    >
      {(['beginner', 'practitioner'] as const).map((d) => {
        const active = d === depth;
        return (
          <button
            key={d}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d)}
            className={
              'px-3 py-1 rounded ' +
              (active
                ? 'bg-accent text-white'
                : 'text-muted hover:text-ink hover:bg-slate-50')
            }
          >
            {labels[d]}
          </button>
        );
      })}
    </div>
  );
}
