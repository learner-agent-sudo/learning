'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Download, Info, RotateCcw, TriangleAlert } from 'lucide-react';
import { load, save } from '@/lib/useStudyState';
import { download } from '@/lib/vendorExport';
import { STRENGTH_LABEL } from '@/lib/banking';
import { swExtract, VERDICT, type Licence, type LicenceFamily, type LicenceKit } from '@/lib/softwareIp';
import { RichText } from '../RichText';
import { chipClass, PILL_BASE } from '../cardStyles';
import { SectionTitle } from '../ui/Bullets';
import { StatuteText } from '../ui/StatuteText';
import { SourceList, StrengthLegend } from '../banking/Sources';

const KEY = 'software-ip:finder:v1';

export const FINDER_SECTION = {
  pick: 'finder-pick',
  duties: 'finder-duties',
  combine: 'finder-combine',
  table: 'finder-table',
} as const;

interface Saved {
  licence: string;
  uses: string[];
  a: string;
  b: string;
}

/** The licence's text behind a duty, in its own words, one closed disclosure per section. */
function LicenceCites({ licence, cites }: { licence: Licence; cites?: { cap: string; section: string }[] }) {
  const found = (cites ?? []).flatMap((c) => {
    const extract = swExtract(c);
    return extract ? [{ key: `${c.cap}|${c.section}`, extract, cap: c.cap }] : [];
  });
  if (!found.length) return null;
  return (
    <div className="mt-1">
      {found.map(({ key, extract, cap }) => (
        <StatuteText key={key} extract={extract} open={`Read ${cap === licence.id ? licence.id : cap} ${extract.label.toLowerCase()}`} />
      ))}
    </div>
  );
}

function notes(kit: LicenceKit, l: Licence, uses: string[]): string {
  const useLabel = (id: string) => kit.uses.find((u) => u.id === id)?.label ?? id;
  const duties = uses.length ? l.duties.filter((d) => d.uses.some((u) => uses.includes(u))) : l.duties;
  const lines = [
    `# Licence notes: ${l.name} (${l.id})`,
    '',
    `Uses: ${uses.length ? uses.map(useLabel).join('; ') : 'all uses'}`,
    '',
    l.summary,
    '',
    `- Triggered by: ${l.trigger}`,
    `- Patents: ${l.patent}`,
    `- OSI approved: ${l.osi ? 'yes' : 'no'}`,
    '',
    '## What the bank must do',
    ...(duties.length ? duties.map((d) => `- ${d.text} (${d.uses.map(useLabel).join(', ')})`) : ['- Nothing for the uses chosen.']),
    '',
    '## Watch for',
    ...l.watch.map((w) => `- ${w}`),
    '',
    '## Sources',
    ...l.sources.map((s) => `- ${s.label} ${s.ref} (${STRENGTH_LABEL[s.strength]})${s.url ? ` <${s.url}>` : ''}`),
    '',
    `_${kit.caveat}_`,
    '',
  ];
  return lines.join('\n').replace(/\*\*/g, '');
}

export function LicenceFinder({ kit }: { kit: LicenceKit }) {
  const first = kit.licences[0]?.id ?? '';
  const [state, setState] = useState<Saved>({ licence: first, uses: [], a: first, b: 'GPL-3.0-only' });
  useEffect(() => {
    const s = load(KEY) as Partial<Saved> | null;
    if (s && typeof s === 'object') {
      setState((cur) => ({
        licence: kit.licences.some((l) => l.id === s.licence) ? (s.licence as string) : cur.licence,
        uses: Array.isArray(s.uses) ? s.uses.filter((u) => kit.uses.some((x) => x.id === u)) : [],
        a: kit.licences.some((l) => l.id === s.a) ? (s.a as string) : cur.a,
        b: kit.licences.some((l) => l.id === s.b) ? (s.b as string) : cur.b,
      }));
    }
  }, [kit]);
  const update = (patch: Partial<Saved>) =>
    setState((cur) => {
      const next = { ...cur, ...patch };
      save(KEY, next);
      return next;
    });

  const l = kit.licences.find((x) => x.id === state.licence) ?? kit.licences[0];
  const byFamily = useMemo(
    () =>
      kit.families
        .map((f) => ({ ...f, licences: kit.licences.filter((x) => x.family === f.id) }))
        .filter((f) => f.licences.length),
    [kit]
  );
  const familyLabel = (id: LicenceFamily) => kit.families.find((f) => f.id === id)?.label ?? id;
  const useLabel = (id: string) => kit.uses.find((u) => u.id === id)?.label ?? id;
  const duties = state.uses.length ? l.duties.filter((d) => d.uses.some((u) => state.uses.includes(u))) : l.duties;
  const row = kit.compat.find((c) => c.a === state.a && c.b === state.b);
  const nameOf = (id: string) => kit.licences.find((x) => x.id === id)?.name ?? id;
  const select = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="grid gap-1 text-sm">
      <span className="text-xs font-medium text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink"
      >
        {byFamily.map((f) => (
          <optgroup key={f.id} label={f.label}>
            {f.licences.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-10">
      <div className="space-y-2 text-[15px] leading-relaxed text-ink/85">
        {kit.intro.map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
      </div>

      <section id={FINDER_SECTION.pick} aria-labelledby="finder-pick-title">
        <SectionTitle>
          <span id="finder-pick-title">1. Pick the licence and how the bank uses the code</span>
        </SectionTitle>
        <div className="space-y-4">
          {byFamily.map((f) => (
            <div key={f.id}>
              <p className="kicker mb-1.5" title={f.blurb}>
                {f.label}
              </p>
              <p className="mb-2 text-[13px] text-muted">{f.blurb}</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={f.label}>
                {f.licences.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={state.licence === x.id}
                    onClick={() => update({ licence: x.id, a: x.id })}
                    className={chipClass(state.licence === x.id)}
                  >
                    {state.licence === x.id && <Check className="h-3.5 w-3.5" aria-hidden />}
                    {x.id}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <p className="kicker mb-1.5">How the bank uses it</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="How the bank uses the code">
            {kit.uses.map((u) => {
              const on = state.uses.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  aria-pressed={on}
                  title={u.hint}
                  onClick={() => update({ uses: on ? state.uses.filter((x) => x !== u.id) : [...state.uses, u.id] })}
                  className={chipClass(on)}
                >
                  {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                  {u.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[13px] text-muted" aria-live="polite">
            {state.uses.length
              ? `Showing what ${l.id} asks for when the bank does: ${state.uses.map(useLabel).join(', ').toLowerCase()}.`
              : 'No use chosen: every duty in the licence is shown, with the uses that set it off.'}
          </p>
        </div>
      </section>

      <section id={FINDER_SECTION.duties} aria-labelledby="finder-duties-title">
        <SectionTitle
          aside={
            <span className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => download(`licence-notes-${l.id.toLowerCase()}.md`, notes(kit, l, state.uses), 'text/markdown;charset=utf-8')}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs font-medium text-ink hover:border-ink/30"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> Notes (.md)
              </button>
              {state.uses.length > 0 && (
                <button
                  type="button"
                  onClick={() => update({ uses: [] })}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs font-medium text-muted hover:text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear uses
                </button>
              )}
            </span>
          }
        >
          <span id="finder-duties-title">2. What {l.id} asks of the bank</span>
        </SectionTitle>
        <div className="rounded-xl border border-line bg-panel p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-serif text-xl font-semibold leading-tight">{l.name}</h3>
            <span className={`${PILL_BASE} bg-ink/5 text-ink/70`}>{familyLabel(l.family)}</span>
            <span className={`${PILL_BASE} ${l.osi ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200'}`}>
              {l.osi ? 'OSI approved' : 'Not OSI approved'}
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/85">
            <RichText text={l.summary} />
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="kicker mb-0.5">Triggered by</dt>
              <dd className="leading-snug text-ink/85">
                <RichText text={l.trigger} />
              </dd>
            </div>
            <div>
              <dt className="kicker mb-0.5">Patents</dt>
              <dd className="leading-snug text-ink/85">
                <RichText text={l.patent} />
              </dd>
            </div>
          </dl>
          <h4 className="kicker mb-2 mt-5">What the bank must do</h4>
          {duties.length ? (
            <ol className="space-y-3">
              {duties.map((d, i) => (
                <li key={i} className="relative border-l-2 border-phase/40 pl-3.5">
                  <p className="text-[15px] leading-relaxed">
                    <RichText text={d.text} />
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {d.uses.map((u) => (
                      <span key={u} className={`${PILL_BASE} ${state.uses.includes(u) ? 'bg-ink text-paper' : 'bg-ink/5 text-ink/60'}`}>
                        {useLabel(u)}
                      </span>
                    ))}
                  </p>
                  <LicenceCites licence={l} cites={d.cites} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="flex gap-2 text-sm text-ink/80">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
              Nothing in {l.id} is set off by the uses chosen. Keep the licence and notices with the code anyway, in case its use
              changes.
            </p>
          )}
          {l.watch.length > 0 && (
            <>
              <h4 className="kicker mb-2 mt-5 flex items-center gap-1.5">
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Watch for
              </h4>
              <ul className="space-y-1.5 text-[14.5px] leading-relaxed text-ink/85">
                {l.watch.map((w, i) => (
                  <li key={i} className="relative pl-4">
                    <span className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rotate-45 bg-phase" aria-hidden />
                    <RichText text={w} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <h4 className="kicker mb-2 mt-5">Sources</h4>
          <StrengthLegend sources={l.sources} />
          <SourceList sources={l.sources} />
        </div>
      </section>

      <section id={FINDER_SECTION.combine} aria-labelledby="finder-combine-title">
        <SectionTitle>
          <span id="finder-combine-title">3. Can two licences go in one program?</span>
        </SectionTitle>
        <p className="mb-3 text-sm text-muted">
          Code under the first licence, combined into a program that is distributed under the second.
        </p>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          {select(state.a, (v) => update({ a: v }), 'Code under')}
          <ArrowRight className="mx-auto hidden h-4 w-4 text-muted sm:block" aria-hidden />
          {select(state.b, (v) => update({ b: v }), 'Into a program under')}
        </div>
        <div className="mt-4 rounded-xl border border-line bg-panel p-4" aria-live="polite">
          {state.a === state.b ? (
            <p className="text-sm text-ink/85">Same licence on both sides: combining is fine if you meet that licence's terms.</p>
          ) : row ? (
            <>
              <span className={`${PILL_BASE} ${VERDICT[row.verdict].tone}`}>{VERDICT[row.verdict].label}</span>
              <p className="mt-2 text-[15px] leading-relaxed">
                <RichText text={row.note} />
              </p>
            </>
          ) : (
            <p className="text-sm text-ink/80">
              This pair is not in the table. Read both licences, or ask the open source office: {nameOf(state.a)} into {nameOf(state.b)}.
            </p>
          )}
        </div>
      </section>

      <section id={FINDER_SECTION.table} aria-labelledby="finder-table-title">
        <SectionTitle>
          <span id="finder-table-title">The pairs in the table</span>
        </SectionTitle>
        <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
          {kit.compat.map((c) => (
            <li key={`${c.a}|${c.b}`}>
              <button
                type="button"
                onClick={() => update({ a: c.a, b: c.b })}
                className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 text-left text-sm hover:bg-ink/[0.025]"
              >
                <span className="font-mono text-[12.5px]">{c.a}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden />
                <span className="font-mono text-[12.5px]">{c.b}</span>
                <span className={`${PILL_BASE} ml-auto ${VERDICT[c.verdict].tone}`}>{VERDICT[c.verdict].label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-muted">{kit.caveat}</p>
    </div>
  );
}
