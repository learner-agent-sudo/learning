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
    <span className="relative inline">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-left font-medium text-ink underline decoration-module/50 decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-module"
      >
        {children ?? term}
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-0 top-full z-30 mt-1.5 block w-72 max-w-[calc(100vw-2rem)] animate-fade rounded-lg border border-line bg-panel p-3 text-[13px] font-normal leading-snug text-ink shadow-lift"
        >
          <span className="block font-serif text-base font-semibold leading-tight">{term}</span>
          <span className="mt-1 block text-muted">{definition}</span>
        </span>
      )}
    </span>
  );
}
