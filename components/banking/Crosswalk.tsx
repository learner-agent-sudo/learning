'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Crosswalk as Data, CrosswalkChange } from '@/lib/banking';
import { RichText } from '../RichText';
import { chipClass } from '../cardStyles';
import { BulletList } from '../ui/Bullets';
import { openClause } from './Wording';

export const CHANGE: Record<CrosswalkChange, { label: string; title: string; chip: string; dot: string }> = {
  stronger: {
    label: 'Stronger',
    title: 'Backed by statute or a firmer expectation than in Hong Kong',
    chip: 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-400/15 dark:text-indigo-200 dark:ring-indigo-300/25',
    dot: 'bg-indigo-500',
  },
  same: {
    label: 'Same need',
    title: 'The contract needs the same thing, on a different source',
    chip: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-200 dark:ring-slate-300/20',
    dot: 'bg-slate-500',
  },
  changed: {
    label: 'Changed',
    title: 'Still needed, but the rule or the drafting differs',
    chip: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-300/25',
    dot: 'bg-sky-500',
  },
  softer: {
    label: 'Softer',
    title: 'Expected in Hong Kong, but only good practice or a lighter expectation in Canada',
    chip: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-300/25',
    dot: 'bg-amber-500',
  },
  dropped: {
    label: 'Not carried over',
    title: 'Driven by a Hong Kong rule with no Canadian counterpart',
    chip: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-300/25',
    dot: 'bg-rose-500',
  },
  new: {
    label: 'New in Canada',
    title: 'A Canadian rule with no clause in the Hong Kong kit',
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/25',
    dot: 'bg-emerald-500',
  },
};

const ORDER: CrosswalkChange[] = ['stronger', 'same', 'changed', 'softer', 'dropped', 'new'];

/** How each clause of the Hong Kong kit carries over, and what this jurisdiction adds. */
export function Crosswalk({ data, titles }: { data: Data; titles: Record<string, string> }) {
  const [only, setOnly] = useState<CrosswalkChange | 'any'>('any');
  const shown = data.rows.filter((r) => only === 'any' || r.change === only);
  const count = (c: CrosswalkChange) => data.rows.filter((r) => r.change === c).length;
  return (
    <div>
      <BulletList items={data.intro} className="mb-4" />
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Show clauses whose treatment is">
        <button type="button" onClick={() => setOnly('any')} aria-pressed={only === 'any'} className={chipClass(only === 'any')}>
          All <span className="font-mono tabular-nums">{data.rows.length}</span>
        </button>
        {ORDER.map((c) =>
          count(c) === 0 ? null : (
            <button
              key={c}
              type="button"
              onClick={() => setOnly(only === c ? 'any' : c)}
              aria-pressed={only === c}
              title={CHANGE[c].title}
              className={chipClass(only === c)}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${CHANGE[c].dot}`} />
              {CHANGE[c].label}
              <span className="font-mono tabular-nums">{count(c)}</span>
            </button>
          )
        )}
      </div>
      <ul className="divide-y divide-line/80 overflow-hidden rounded-xl border border-line bg-panel shadow-card">
        {shown.map((r, i) => (
          <li key={`${r.hk ?? ''}-${r.term ?? ''}-${i}`} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-px text-[10.5px] font-medium ring-1 ${CHANGE[r.change].chip}`} title={CHANGE[r.change].title}>
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${CHANGE[r.change].dot}`} />
                {CHANGE[r.change].label}
              </span>
              <span className="text-sm">
                {r.hk ? (
                  <span className="text-ink/80">
                    <span className="sr-only">Hong Kong clause: </span>
                    {r.hk}
                  </span>
                ) : (
                  <span className="text-muted">No Hong Kong clause</span>
                )}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="becomes" />
              {r.term && titles[r.term] ? (
                <button
                  type="button"
                  onClick={() => openClause(r.term!)}
                  className="text-left text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                >
                  {titles[r.term]}
                </button>
              ) : (
                <span className="text-sm text-muted">No clause in this kit</span>
              )}
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/80">
              <RichText text={r.note} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
