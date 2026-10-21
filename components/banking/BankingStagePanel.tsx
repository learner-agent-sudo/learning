'use client';

import { useEffect, useState } from 'react';
import { BankingStage, CAP155_ANATOMY, PHASES } from '@/lib/banking';
import type { Depth } from '@/lib/workflow';
import { GlossaryTooltip } from '../GlossaryTooltip';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, SUMMARY, TITLE } from '../cardStyles';
import { ProvisionCard } from './ProvisionCard';

interface Props {
  stage: BankingStage;
  depth: Depth;
  prev?: BankingStage | null;
  next?: BankingStage | null;
  onNavigate?: (id: string) => void;
}

const H3 = 'text-sm font-semibold uppercase tracking-wide text-muted';

// Ticks are a per-browser convenience; the page works without storage.
function useChecklist(key: string, size: number) {
  const [done, setDone] = useState<boolean[]>(() => Array(size).fill(false));
  useEffect(() => {
    let saved: boolean[] | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      saved = null;
    }
    setDone(Array.from({ length: size }, (_, i) => !!saved?.[i]));
  }, [key, size]);
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable (private mode); keep in memory only
      }
      return next;
    });
  return [done, toggle] as const;
}

function Chip({ count, label }: { count: number; label: string }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
      <span className="font-semibold text-ink">{count}</span>
      {label}
    </span>
  );
}

function Callout({ title, items, className }: { title: string; items: string[]; className: string }) {
  if (items.length === 0) return null;
  return (
    <section className={`mt-6 rounded-md border px-4 py-3 ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
        {items.map((t) => (
          <li key={t}>
            <RichText text={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Cap155Anatomy() {
  if (!CAP155_ANATOMY) return null;
  return (
    <details className={`${CARD} mt-4`}>
      <summary className={SUMMARY}>
        <span className={CHEVRON}>▸</span>
        <span className={TITLE}>
          Anatomy of the Banking Ordinance
          <span className="ml-2 text-xs font-normal text-muted">
            {CAP155_ANATOMY.parts.length} Parts · {CAP155_ANATOMY.schedules.length} Schedules
          </span>
        </span>
      </summary>
      <div className={BODY}>
        <p className="text-xs text-muted">
          Generated from the official text (as at {CAP155_ANATOMY.versionDate}). Repealed Parts are omitted.
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <tbody>
            {CAP155_ANATOMY.parts.map((p) => (
              <tr key={p.num} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap py-1 pr-3 font-medium">{p.num}</td>
                <td className="py-1 pr-3">{p.heading}</td>
                <td className="whitespace-nowrap py-1 text-xs text-muted">{p.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Schedules</h4>
        <ul className="mt-1 space-y-0.5 text-sm">
          {CAP155_ANATOMY.schedules.map((s) => (
            <li key={s.num}>
              <span className="font-medium">{s.num}</span> — {s.heading}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export function BankingStagePanel({ stage, depth, prev, next, onNavigate }: Props) {
  const [done, toggle] = useChecklist(`hk-banking:checklist:${stage.id}`, stage.checklist.length);
  const text = depth === 'beginner' ? stage.overview : stage.deepDive;
  const doneCount = done.filter(Boolean).length;

  return (
    <aside className="rounded-lg border border-slate-200 bg-panel p-4 sm:p-6">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Stage {stage.index} · {PHASES[stage.phase].label}
            </div>
            <h2 className="mt-1 text-xl font-semibold">{stage.title}</h2>
            <p className="mt-1 text-sm text-muted">{stage.oneLiner}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip count={stage.provisions.length} label="provisions" />
              <Chip count={stage.checklist.length} label="checklist items" />
              <Chip count={stage.glossary.length} label="terms" />
            </div>
          </div>
          {onNavigate && (
            <nav className="flex shrink-0 gap-1" aria-label="Stage navigation">
              <button
                type="button"
                onClick={() => prev && onNavigate(prev.id)}
                disabled={!prev}
                title={prev ? `Previous: ${prev.title}` : 'No previous stage'}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={() => next && onNavigate(next.id)}
                disabled={!next}
                title={next ? `Next: ${next.title}` : 'No next stage'}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next ▶
              </button>
            </nav>
          )}
        </div>
      </header>

      {stage.review === 'draft' && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          <strong>Independent fact-check pending.</strong> Statute citations in this stage are matched against the
          official text and the stage has had an editorial review, but its HKMA guidance references, dates and
          figures have not yet been independently confirmed.
        </p>
      )}

      <section className="mt-4">
        <h3 className={H3}>{depth === 'beginner' ? 'The picture' : 'How it bites'}</h3>
        <div className="mt-2 space-y-3 text-sm leading-relaxed">
          {text.split(/\n\n+/).map((para) => (
            <p key={para.slice(0, 40)}>
              <RichText text={para} />
            </p>
          ))}
        </div>
        {stage.id === 'map' && <Cap155Anatomy />}
      </section>

      {stage.provisions.length > 0 && (
        <section className="mt-6">
          <h3 className={H3}>Key provisions</h3>
          <p className="mt-1 text-xs text-muted">
            Statute cards include the official text; HKMA guidance is summarised with a link to the source.
          </p>
          <div className="mt-2 grid gap-2.5">
            {stage.provisions.map((p) => (
              <ProvisionCard key={`${p.instrument}|${p.ref}`} provision={p} />
            ))}
          </div>
        </section>
      )}

      {stage.checklist.length > 0 && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={H3}>Counsel&apos;s checklist</h3>
            <span className="text-xs text-muted">
              {doneCount}/{stage.checklist.length} done
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {stage.checklist.map((item, i) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={done[i] ?? false}
                    onChange={() => toggle(i)}
                    className="mt-1 h-3.5 w-3.5 shrink-0 accent-accent"
                  />
                  <span className={done[i] ? 'text-muted line-through' : ''}>
                    <RichText text={item} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Callout title="The IT angle" items={stage.itAngle} className="border-sky-200 bg-sky-50/60 text-sky-800" />
      <Callout
        title="Digital bank specifics"
        items={stage.virtualBankNotes}
        className="border-violet-200 bg-violet-50/60 text-violet-800"
      />
      <Callout title="Common pitfalls" items={stage.pitfalls} className="border-rose-200 bg-rose-50/60 text-rose-800" />

      {stage.glossary.length > 0 && (
        <section className="mt-6">
          <h3 className={H3}>Glossary</h3>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {stage.glossary.map((g) => (
              <GlossaryTooltip key={g.term} term={g.term} />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
