'use client';

import { useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, Info } from 'lucide-react';
import type { Provision, ProvisionKind, StatuteExtract } from '@/lib/statute';
import { KIND, ProvisionCard } from './ProvisionCard';

export const CHIP =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors focus-visible:outline-offset-1';

interface Props {
  provisions: Provision[];
  // Official text for a provision's cited section, if any.
  lookup: (p: Provision) => StatuteExtract | undefined;
  // What the list holds, shown above it.
  note: string;
}

/** A stage's sources as cards, filterable by kind, with open/close all. */
export function ProvisionList({ provisions, lookup, note }: Props) {
  const [filter, setFilter] = useState<ProvisionKind | 'all'>('all');
  // Bumping the version remounts the cards with every card open or closed.
  const [expand, setExpand] = useState({ open: false, version: 0 });
  const kinds = Array.from(new Set(provisions.map((p) => p.kind)));
  const shown = filter === 'all' ? provisions : provisions.filter((p) => p.kind === filter);
  const chip = (id: ProvisionKind | 'all', label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={
        CHIP + ' ' + (filter === id ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-muted hover:text-ink')
      }
    >
      {label} <span className="font-mono tabular-nums">{count}</span>
    </button>
  );
  return (
    <>
      <p className="mb-4 flex gap-2 text-sm text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {note}
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {kinds.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by source type">
            {chip('all', 'All', provisions.length)}
            {kinds.map((k) => chip(k, KIND[k].label, provisions.filter((p) => p.kind === k).length))}
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setExpand((e) => ({ open: !e.open, version: e.version + 1 }))}
          className={`${CHIP} border-line bg-panel text-ink hover:border-ink/30`}
        >
          {expand.open ? <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />}
          {expand.open ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <div className="grid gap-3">
        {shown.map((p) => (
          <ProvisionCard
            key={`${p.instrument}|${p.ref}|${expand.version}`}
            provision={p}
            extract={lookup(p)}
            defaultOpen={expand.open}
          />
        ))}
      </div>
    </>
  );
}
