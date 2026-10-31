'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { IncidentKit, IncidentMark, IncidentTrack } from '@/lib/banking';
import { load, save } from '@/lib/useStudyState';
import { download, plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { CARD, chipClass } from '../cardStyles';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { STRENGTH, SourceList, StrengthPill } from './Sources';

type Answers = Record<string, boolean>;

const KEY = 'hk-banking:incident-scenario';
// A critical SaaS vendor is down and customers notice: the usual starting point.
const DEFAULTS: Answers = { significant: true, customers: true };

const today = () => new Date().toISOString().slice(0, 10);

function parse(v: unknown): Answers {
  if (!v || typeof v !== 'object') return DEFAULTS;
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, b]) => typeof b === 'boolean')) as Answers;
}

const isOn = (t: IncidentTrack, a: Answers) => t.applies === 'always' || !!a[t.applies];
const marksOf = (t: IncidentTrack, a: Answers): IncidentMark[] =>
  t.marks.filter((m) => (!m.if || a[m.if]) && (!m.unless || !a[m.unless]));

function callSheet(kit: IncidentKit, a: Answers, order: (t: IncidentTrack) => number): string {
  const on = kit.tracks.filter((t) => isOn(t, a)).sort((x, y) => order(x) - order(y));
  const asked = kit.questions.filter((q) => !q.dependsOn || a[q.dependsOn]);
  const lines = [
    '# Incident call sheet: critical vendor incident',
    '',
    `Prepared ${today()}. Clocks run from when the bank becomes aware unless stated.`,
    '',
    '## Scenario',
    '',
    ...asked.map((q) => `- ${q.ask} **${a[q.id] ? 'Yes' : 'No'}**`),
    '',
    '## Who gets called, in order',
    '',
  ];
  on.forEach((t, i) => {
    lines.push(`### ${i + 1}. ${t.who}: ${t.when}`, '', plain(t.what), '', `*Basis:* ${plain(t.basis)}`);
    lines.push(`*Sources:* ${t.sources.map((s) => `${s.label} ${s.ref}`).join('; ')}`, '');
  });
  lines.push('---', '', plain(kit.caveat), '', 'Study material, not legal advice.', '');
  return lines.join('\n');
}

/**
 * The notification clocks that start when a critical vendor has an incident:
 * a scenario (the decision points), a chart of who is owed notice by when,
 * and the call sheet in the order the calls are due.
 */
export function IncidentClocks({ kit }: { kit: IncidentKit }) {
  const [answers, setAnswers] = useState<Answers>(DEFAULTS);
  useEffect(() => {
    const v = load(KEY);
    if (v) setAnswers(parse(v));
  }, []);
  const set = (id: string, on: boolean) => {
    const next = { ...answers, [id]: on };
    // A dependent question only counts while its parent is yes.
    for (const q of kit.questions) if (q.dependsOn === id && !on) next[q.id] = false;
    setAnswers(next);
    save(KEY, next);
  };

  const colIndex = Object.fromEntries(kit.columns.map((c, i) => [c.id, i]));
  const order = (t: IncidentTrack) => Math.min(...marksOf(t, answers).map((m) => colIndex[m.col] ?? 99));
  const on = kit.tracks.filter((t) => isOn(t, answers)).sort((x, y) => order(x) - order(y));
  const off = kit.tracks.filter((t) => !isOn(t, answers));
  const asked = kit.questions.filter((q) => !q.dependsOn || answers[q.dependsOn]);
  const cols = kit.columns.length;

  return (
    <div className="space-y-10">
      <section>
        <BulletList items={kit.intro} />
      </section>

      <section aria-labelledby="incident-scenario">
        <SectionTitle>
          <span id="incident-scenario">The scenario: a critical vendor incident</span>
        </SectionTitle>
        <ol className="space-y-2.5">
          {asked.map((q, i) => (
            <li key={q.id} className={'rounded-xl border border-line bg-panel px-4 py-3 shadow-card ' + (q.dependsOn ? 'ml-4 sm:ml-6' : '')}>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 basis-60 font-medium leading-snug">
                  <span className="mr-1.5 font-mono text-xs text-muted">{q.dependsOn ? '↳' : `${i + 1}.`}</span>
                  {q.ask}
                </p>
                <div className="flex shrink-0 gap-1.5" role="group" aria-label={q.ask}>
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" aria-pressed={!!answers[q.id] === v} onClick={() => set(q.id, v)} className={chipClass(!!answers[q.id] === v)}>
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-ink/70">
                <RichText text={q.help} />
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="incident-clocks">
        <SectionTitle>
          <span id="incident-clocks">The clocks</span>
        </SectionTitle>
        <p className="sr-only">The call sheet below lists the same deadlines in order.</p>
        <div aria-hidden className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
          <div className="grid border-b border-line bg-paper/60" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {kit.columns.map((c, i) => (
              <div
                key={c.id}
                className={'px-1 py-2 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.06em] text-muted sm:text-[11px] ' + (i === 0 ? 'text-phase' : '')}
              >
                {c.label}
              </div>
            ))}
          </div>
          {on.map((t) => {
            const marks = marksOf(t, answers);
            return (
              <div key={t.id} className="border-b border-line/70 last:border-b-0">
                <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                  <span className="text-[13px] font-semibold leading-snug">{t.who}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STRENGTH[t.strength].bar}`} title={STRENGTH[t.strength].label} />
                </div>
                <div className="relative grid pb-3 pt-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  <span className="pointer-events-none absolute inset-x-[8%] top-[17px] h-px bg-line" />
                  {kit.columns.map((c) => {
                    const here = marks.filter((m) => m.col === c.id);
                    return (
                      <div key={c.id} className="relative flex flex-col items-center px-0.5 text-center">
                        {here.length > 0 ? (
                          <>
                            <span className={`relative mt-[5px] h-3 w-3 rounded-full ring-2 ring-panel ${STRENGTH[t.strength].bar}`} />
                            {here.map((m) => (
                              <span key={m.label} className="mt-1 text-[10px] leading-tight text-ink/80 sm:text-[11px]">
                                {m.label}
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="mt-[9px] h-1 w-1 rounded-full bg-line" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          Columns are deadlines, not a time scale. Dot colour shows the legal force of the main source.
        </p>
        {off.length > 0 && (
          <p className="mt-3 text-sm text-ink/75">
            <span className="font-semibold">Not triggered in this scenario: </span>
            {off.map((t) => t.who).join('; ')}.
          </p>
        )}
      </section>

      <section aria-labelledby="incident-calls">
        <SectionTitle
          aside={
            <button
              type="button"
              onClick={() => download(`incident-call-sheet-${today()}.md`, callSheet(kit, answers, order), 'text/markdown;charset=utf-8')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-xs font-medium text-ink hover:border-ink/30"
            >
              <Download className="h-3.5 w-3.5" aria-hidden /> Call sheet (.md)
            </button>
          }
        >
          <span id="incident-calls">Who gets called, in order</span>
        </SectionTitle>
        <ol className="space-y-3">
          {on.map((t, i) => (
            <li key={t.id} className={`${CARD} px-4 py-3.5`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold leading-snug">
                  <span className="mr-1.5 font-mono text-xs text-muted">{i + 1}.</span>
                  {t.who}
                </h4>
                <span className="flex gap-1.5">
                  {t.verify && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
                      verify
                    </span>
                  )}
                  <StrengthPill strength={t.strength} />
                </span>
              </div>
              <p className="mt-1 font-serif text-[17px] font-semibold leading-snug text-phase">{t.when}</p>
              <p className="mt-2 leading-relaxed">
                <RichText text={t.what} />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                <span className="font-semibold text-ink">Basis: </span>
                <RichText text={t.basis} />
              </p>
              <details className="group/src mt-2">
                <summary className="inline-flex min-h-8 cursor-pointer list-none items-center text-xs font-medium text-ink/75 underline decoration-ink/30 underline-offset-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                  <span className="group-open/src:hidden">Sources</span>
                  <span className="hidden group-open/src:inline">Hide sources</span>
                </summary>
                <div className="mt-2">
                  <SourceList sources={t.sources} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionTitle>Points to settle in the incident plan</SectionTitle>
        <BulletList items={kit.notes} />
      </section>

      <p className="rounded-lg border border-line px-4 py-3 text-xs leading-relaxed text-muted">
        <RichText text={kit.caveat} />
      </p>
    </div>
  );
}
