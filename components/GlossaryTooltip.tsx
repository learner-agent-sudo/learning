'use client';

import { useState, useId } from 'react';
import { useDefine } from './GlossaryContext';

interface Props {
  term: string;
  children?: React.ReactNode;
}

export function GlossaryTooltip({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const definition = useDefine()(term);
  if (!definition) return <>{children ?? term}</>;
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="underline decoration-dotted underline-offset-2 text-accent"
      >
        {children ?? term}
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-0 top-full z-10 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded border border-slate-200 bg-white p-2 text-xs text-ink shadow-md"
        >
          <strong className="block">{term}</strong>
          <span className="block text-muted">{definition}</span>
        </span>
      )}
    </span>
  );
}
