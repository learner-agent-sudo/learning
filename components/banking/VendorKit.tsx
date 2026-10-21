'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronRight, Cloud, ExternalLink, PenLine, RotateCcw } from 'lucide-react';
import type { ContractTerm, Strength, VendorKit as Kit } from '@/lib/banking';
import { loadTicks } from '@/lib/useStudyState';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, EDGE, PILL_BASE, SUMMARY, TITLE } from '../cardStyles';
import { BulletList, SectionedPoints, SectionTitle } from '../ui/Bullets';
import { SectionVisual } from '../ui/SectionVisual';

// Legal force of a source, strongest first.
export const STRENGTH: Record<Strength, { label: string; pill: string; bar: string; title: string }> = {
  statute: {
    label: 'Statute',
    pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200',
    bar: 'bg-indigo-500',
    title: 'Legislation: binding, with legal consequences for breach',
  },
  'statutory-guideline': {
    label: 'Statutory guideline',
    pill: 'bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200',
    bar: 'bg-violet-500',
    title: 'HKMA guideline issued under s.7(3) of the Banking Ordinance',
  },
  'hkma-guidance': {
    label: 'HKMA guidance',
    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
    bar: 'bg-sky-500',
    title: 'Non-statutory HKMA expectation, assessed against the Seventh Schedule criteria',
  },
  'industry-code': {
    label: 'Industry code',
    pill: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    bar: 'bg-amber-500',
    title: 'Code of Banking Practice: non-statutory, but the HKMA monitors compliance',
  },
  'good-practice': {
    label: 'Good practice',
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-200',
    bar: 'bg-slate-400',
    title: 'Not required by a source; what experienced counsel would add',
  },
};

const ORDER: Strength[] = ['statute', 'statutory-guideline', 'hkma-guidance', 'industry-code', 'good-practice'];

export const APPLIES: Record<string, string> = {
  all: 'Every outsourcing',
  material: 'Material outsourcing',
  'personal-data': 'Personal data',
  offshore: 'Offshore or cloud',
  critical: 'Critical operations',
  intragroup: 'Intragroup',
  agents: 'Agents & collectors',
};

const STORE = 'hk-banking:vendor-review';

function strongest(t: ContractTerm): Strength {
  return ORDER.find((s) => t.sources.some((src) => src.strength === s)) ?? 'good-practice';
}

function TermCard({ term, ticked, onTick }: { term: ContractTerm; ticked: boolean; onTick: () => void }) {
  const top = STRENGTH[strongest(term)];
  return (
    <div className="flex items-start gap-3">
      <label className="mt-3.5 flex shrink-0 cursor-pointer items-center" title="Found in the contract under review">
        <input type="checkbox" checked={ticked} onChange={onTick} className="peer sr-only" />
        <span
          aria-hidden
          className={
            'flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-phase ' +
            (ticked ? 'border-phase bg-phase text-onaccent' : 'border-ink/60 bg-panel')
          }
        >
          {ticked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
        <span className="sr-only">Covered: {term.title}</span>
      </label>
      <details id={`term-${term.id}`} className={`${CARD} min-w-0 flex-1`}>
        <summary className={SUMMARY}>
          <span aria-hidden className={`${EDGE} ${top.bar}`} />
          <ChevronRight className={CHEVRON} aria-hidden />
          <span className={`${TITLE} min-w-0`}>
            {term.title}
            <span className="mt-1 line-clamp-2 text-[13px] font-normal leading-snug text-ink/65 group-open:hidden">
              {term.summary}
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1">
              {term.appliesTo.map((a) => (
                <span key={a} className="rounded-full bg-ink/[0.06] px-2 py-px text-[10.5px] font-normal text-muted">
                  {APPLIES[a] ?? a}
                </span>
              ))}
            </span>
          </span>
          <span className={`${PILL_BASE} ${top.pill}`} title={top.title}>
            {top.label}
          </span>
        </summary>
        <div className={`${BODY} space-y-4 break-words`}>
          <p className="leading-relaxed">
            <RichText text={term.summary} />
          </p>
          <div>
            <h4 className="kicker mb-2">The contract should</h4>
            <BulletList items={term.require} />
          </div>
          <div>
            <h4 className="kicker mb-2">Sources</h4>
            <ul className="space-y-1.5">
              {term.sources.map((s) => {
                const st = STRENGTH[s.strength];
                return (
                  <li key={`${s.label}-${s.ref}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                    <span className={`${PILL_BASE} ${st.pill}`} title={st.title}>
                      {st.label}
                    </span>
                    <span className="font-medium">{s.label}</span>
                    <span className="font-mono text-[12px] text-muted">{s.ref}</span>
                    {s.note && <span className="w-full text-[13px] text-ink/70 sm:w-auto">{s.note}</span>}
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-2"
                      >
                        Source <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {term.drafting && term.drafting.length > 0 && (
            <div className="rounded-lg bg-phase/[0.06] px-3.5 py-3 ring-1 ring-phase/15">
              <h4 className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-phase">
                <PenLine className="h-3.5 w-3.5" aria-hidden /> Drafting and negotiation
              </h4>
              <BulletList items={term.drafting} />
            </div>
          )}
          {term.cloud && (
            <p className="flex gap-2.5 rounded-lg bg-sky-50/70 px-3.5 py-2.5 text-sm leading-relaxed ring-1 ring-sky-200/60 dark:bg-sky-400/10 dark:ring-sky-300/20">
              <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
              <span>
                <span className="font-semibold">Cloud and SaaS: </span>
                <RichText text={term.cloud} />
              </span>
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

/** Vendor-contract toolkit: lifecycle, required clauses with sources, review ticks. */
export function VendorKit({ kit }: { kit: Kit }) {
  const [filter, setFilter] = useState('all-terms');
  const [ticks, setTicks] = useState<boolean[]>(() => kit.terms.map(() => false));

  useEffect(() => {
    setTicks(loadTicks(STORE, kit.terms.length));
  }, [kit.terms.length]);

  const save = (next: boolean[]) => {
    setTicks(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      // storage unavailable: ticks last for this page only
    }
  };

  const tags = Array.from(new Set(kit.terms.flatMap((t) => t.appliesTo)));
  const shown = kit.terms
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => filter === 'all-terms' || t.appliesTo.includes(filter));
  const done = ticks.filter(Boolean).length;

  const chip = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={
        'inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs transition-colors focus-visible:outline-offset-1 ' +
        (filter === id ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-muted hover:text-ink')
      }
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-10">
      <section>
        <BulletList items={kit.intro} />
        <SectionVisual visual={kit.lifecycle} />
      </section>

      <section>
        <SectionTitle
          aside={
            <span className="font-mono text-xs text-muted">
              {done}/{kit.terms.length} found
            </span>
          }
        >
          Clauses the contract needs
        </SectionTitle>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Reviewing a contract? Tick each clause as you find it; ticks stay in this browser. The pill shows the strongest
          source behind the clause.
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Show clauses that apply to">
          {chip('all-terms', `All ${kit.terms.length}`)}
          {tags.map((t) => chip(t, APPLIES[t] ?? t))}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted" aria-label="Source strength">
            {ORDER.map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5" title={STRENGTH[s].title}>
                <span className={`h-2 w-2 rounded-full ${STRENGTH[s].bar}`} aria-hidden />
                {STRENGTH[s].label}
              </li>
            ))}
          </ul>
          {done > 0 && (
            <button
              type="button"
              onClick={() => save(kit.terms.map(() => false))}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs text-ink hover:border-ink/30"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear ticks
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {shown.map(({ t, i }) => (
            <TermCard key={t.id} term={t} ticked={ticks[i] ?? false} onTick={() => save(ticks.map((v, j) => (j === i ? !v : v)))} />
          ))}
        </div>
      </section>

      {kit.process.length > 0 && (
        <section>
          <SectionTitle>Around the contract</SectionTitle>
          <SectionedPoints sections={kit.process} />
        </section>
      )}

      {kit.caveat && (
        <p className="rounded-lg border border-line px-4 py-3 text-xs leading-relaxed text-muted">
          <RichText text={kit.caveat} />
        </p>
      )}
    </div>
  );
}
