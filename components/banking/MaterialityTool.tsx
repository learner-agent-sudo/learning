'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronRight, Download, RotateCcw } from 'lucide-react';
import type { DueDiligence, MaterialityKit, MaterialityOutcomeId, MaterialityQuestion } from '@/lib/banking';
import { load, save } from '@/lib/useStudyState';
import { download, plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, SUMMARY, TITLE, chipClass } from '../cardStyles';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { SectionVisual } from '../ui/SectionVisual';
import { SourceList } from './Sources';
import { Bracketed, CopyButton } from './Wording';

type Answer = 'yes' | 'no' | 'unsure';
interface Saved {
  name: string;
  answers: Record<string, Answer>;
  // Due-diligence ticks, per area.
  dd: Record<string, boolean[]>;
}

const KEY = 'hk-banking:materiality';
const EMPTY: Saved = { name: '', answers: {}, dd: {} };
const LABEL: Record<Answer, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' };

const today = () => new Date().toISOString().slice(0, 10);

function parse(v: unknown): Saved {
  if (!v || typeof v !== 'object') return EMPTY;
  const o = v as { name?: unknown; answers?: unknown; dd?: unknown };
  const answers: Record<string, Answer> = {};
  if (o.answers && typeof o.answers === 'object') {
    for (const [k, a] of Object.entries(o.answers as Record<string, unknown>)) {
      if (a === 'yes' || a === 'no' || a === 'unsure') answers[k] = a;
    }
  }
  const dd: Record<string, boolean[]> = {};
  if (o.dd && typeof o.dd === 'object') {
    for (const [k, row] of Object.entries(o.dd as Record<string, unknown>)) {
      if (Array.isArray(row)) dd[k] = row.map((x) => x === true);
    }
  }
  return { name: typeof o.name === 'string' ? o.name : '', answers, dd };
}

/** Which track the answers lead to, or null while a deciding answer is missing. */
function outcomeOf(kit: MaterialityKit, a: Record<string, Answer>): { id: MaterialityOutcomeId; complete: boolean } | null {
  const [service, banking] = kit.gates;
  if (!a[service.id]) return null;
  if (a[service.id] === 'no') return { id: 'procurement', complete: true };
  if (!a[banking.id]) return null;
  if (a[banking.id] === 'no') return { id: 'non-banking', complete: true };
  if (kit.factors.some((f) => a[f.id] === 'yes')) return { id: 'material', complete: true };
  return { id: 'banking', complete: kit.factors.every((f) => a[f.id]) };
}

function noteMarkdown(kit: MaterialityKit, saved: Saved, id: MaterialityOutcomeId, date: string): string {
  const o = kit.outcomes[id];
  const asked = [...kit.gates, ...(id === 'procurement' || id === 'non-banking' ? [] : kit.factors)];
  const lines = [
    `# Materiality assessment: ${saved.name.trim() || 'unnamed arrangement'}`,
    '',
    `Date: ${date}`,
    `Result: **${o.label}**`,
    '',
    plain(o.verdict),
    '',
    '## Answers',
    '',
    ...asked.map((q) => `- ${q.ask} **${saved.answers[q.id] ? LABEL[saved.answers[q.id]] : 'Not answered'}** (${q.ref})`),
    '',
    '## What to do',
    '',
    ...o.steps.map((s) => `- ${plain(s)}`),
  ];
  if (kit.dueDiligence && id !== 'procurement') {
    lines.push('', '## Due diligence', '');
    for (const area of kit.dueDiligence.areas) {
      const ticks = saved.dd[area.id] ?? [];
      const tier = area.tier === 'material' ? ' (material arrangements)' : '';
      lines.push(`### ${area.title}${tier}: ${ticks.filter(Boolean).length} of ${area.checks.length} done`, '');
      area.checks.forEach((c, i) => lines.push(`- [${ticks[i] ? 'x' : ' '}] ${plain(c)}`));
      lines.push('');
    }
  }
  if (id === 'banking' || id === 'material') {
    lines.push('', '## Signing before the HKMA discussion ends (model wording)', '', ...kit.condition.map((c) => `${plain(c)}\n`));
  }
  lines.push('', '---', '', plain(kit.caveat), '', 'Study material, not legal advice.', '');
  return lines.join('\n');
}

function QuestionRow({
  q,
  value,
  options,
  onAnswer,
  step,
}: {
  q: MaterialityQuestion;
  value?: Answer;
  options: Answer[];
  onAnswer: (a: Answer | undefined) => void;
  step?: string;
}) {
  return (
    <fieldset className="rounded-xl border border-line bg-panel px-4 py-3.5 shadow-card">
      <legend className="sr-only">{q.ask}</legend>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          {step && <p className="kicker mb-1 text-phase">{step}</p>}
          <p className="font-medium leading-snug" aria-hidden>
            {q.ask}
          </p>
          <span className="mt-1 inline-block font-mono text-[11.5px] text-muted">{q.ref}</span>
        </div>
        <div className="flex shrink-0 gap-1.5" role="group" aria-label={q.ask}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={value === o}
              onClick={() => onAnswer(value === o ? undefined : o)}
              className={chipClass(value === o)}
            >
              {LABEL[o]}
            </button>
          ))}
        </div>
      </div>
      <details className="group/h mt-2">
        <summary className="inline-flex min-h-8 cursor-pointer list-none items-center text-xs font-medium text-ink/75 underline decoration-ink/30 underline-offset-2 hover:text-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open/h:hidden">What counts</span>
          <span className="hidden group-open/h:inline">Hide</span>
        </summary>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/80">
          <RichText text={q.help} />
        </p>
      </details>
    </fieldset>
  );
}

const TONE: Record<MaterialityOutcomeId, string> = {
  procurement: 'border-slate-300 bg-slate-50 dark:border-slate-400/30 dark:bg-slate-400/10',
  'non-banking': 'border-sky-300 bg-sky-50 dark:border-sky-300/30 dark:bg-sky-400/10',
  banking: 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-400/10',
  material: 'border-rose-300 bg-rose-50 dark:border-rose-300/30 dark:bg-rose-400/10',
};

/** Pre-signing due diligence by area, with ticks kept alongside the assessment. */
function DueDiligenceList({
  dd,
  ticks,
  material,
  onToggle,
}: {
  dd: DueDiligence;
  ticks: Record<string, boolean[]>;
  material: boolean;
  onToggle: (area: string, i: number) => void;
}) {
  return (
    <div className="grid gap-3">
      {dd.areas.map((area) => {
        const row = ticks[area.id] ?? [];
        const done = area.checks.filter((_, i) => row[i]).length;
        const optional = area.tier === 'material' && !material;
        return (
          <details key={area.id} className={`${CARD} min-w-0`}>
            <summary className={SUMMARY}>
              <ChevronRight className={CHEVRON} aria-hidden />
              <span className={`${TITLE} min-w-0`}>
                {area.title}
                <span className="mt-1 block font-mono text-[11.5px] font-normal text-muted">{area.ref}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                {area.tier === 'material' && (
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[10.5px] font-medium ' +
                      (optional ? 'bg-ink/[0.06] text-muted' : 'bg-rose-50 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200')
                    }
                  >
                    Material
                  </span>
                )}
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {done}/{area.checks.length}
                </span>
              </span>
            </summary>
            <div className={`${BODY} space-y-4`}>
              {optional && (
                <p className="text-[13px] text-ink/70">
                  For material arrangements and critical services; on the answers above it is optional.
                </p>
              )}
              <ul className="space-y-1.5">
                {area.checks.map((c, i) => {
                  const on = row[i] ?? false;
                  return (
                    <li key={c.slice(0, 24)}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1 leading-snug has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-phase">
                        <input type="checkbox" checked={on} onChange={() => onToggle(area.id, i)} className="peer sr-only" />
                        <span
                          aria-hidden
                          className={
                            'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ' +
                            (on ? 'border-phase bg-phase text-onaccent' : 'border-ink/60 bg-panel')
                          }
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className={on ? 'text-ink/65' : ''}>
                          <RichText text={c} />
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div>
                <h5 className="kicker mb-1.5">Evidence to collect</h5>
                <p className="text-sm leading-relaxed text-ink/80">{area.evidence.join(' · ')}</p>
              </div>
              <div>
                <h5 className="kicker mb-1.5 text-rose-700 dark:text-rose-300">Red flags</h5>
                <BulletList items={area.redFlags} />
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** Step-by-step check of whether a SaaS or cloud deployment is (material) outsourcing, and what follows. */
export function MaterialityTool({ kit }: { kit: MaterialityKit }) {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  useEffect(() => setSaved(parse(load(KEY))), []);

  const update = (next: Saved) => {
    setSaved(next);
    save(KEY, next);
  };
  const toggleDd = (area: string, i: number) => {
    const size = kit.dueDiligence?.areas.find((x) => x.id === area)?.checks.length ?? 0;
    const row = Array.from({ length: size }, (_, j) => saved.dd[area]?.[j] ?? false);
    row[i] = !row[i];
    update({ ...saved, dd: { ...saved.dd, [area]: row } });
  };
  const answer = (id: string, a: Answer | undefined) => {
    const answers = { ...saved.answers };
    if (a) answers[id] = a;
    else delete answers[id];
    update({ ...saved, answers });
  };

  const [service, banking] = kit.gates;
  const a = saved.answers;
  const result = outcomeOf(kit, a);
  const showBanking = a[service.id] === 'yes';
  const showFactors = showBanking && (a[banking.id] === 'yes' || a[banking.id] === 'unsure');
  const marked = kit.factors.filter((f) => a[f.id] === 'yes');
  const started = saved.name !== '' || Object.keys(a).length > 0 || Object.values(saved.dd).some((r) => r.some(Boolean));
  const outcome = result ? kit.outcomes[result.id] : null;
  const showCondition = result && (result.id === 'banking' || result.id === 'material');

  return (
    <div className="space-y-10">
      <section>
        <BulletList items={kit.intro} />
      </section>

      <section aria-labelledby="materiality-questions">
        <SectionTitle>
          <span id="materiality-questions">Assess one deployment</span>
        </SectionTitle>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[14rem] flex-1">
            <span className="kicker mb-1.5 block">Arrangement</span>
            <input
              type="text"
              value={saved.name}
              onChange={(e) => update({ ...saved, name: e.target.value })}
              placeholder="e.g. CRM SaaS for customer servicing"
              className="block min-h-10 w-full rounded-lg border border-line bg-paper px-3 text-base placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
            />
          </label>
          {started && (
            <button
              type="button"
              onClick={() => window.confirm('Clear the answers, the due-diligence ticks and the arrangement name?') && update(EMPTY)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs text-ink hover:border-ink/30"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Start again
            </button>
          )}
        </div>

        <div className="space-y-3">
          <QuestionRow q={service} step="Step 1 · Is it outsourcing?" value={a[service.id]} options={['yes', 'no']} onAnswer={(v) => answer(service.id, v)} />
          {showBanking && (
            <QuestionRow
              q={banking}
              step="Step 2 · Is it banking-related?"
              value={a[banking.id]}
              options={['yes', 'no', 'unsure']}
              onAnswer={(v) => answer(banking.id, v)}
            />
          )}
          {showFactors && (
            <div className="space-y-3 border-l-2 border-phase/30 pl-3 sm:pl-4">
              <p className="kicker text-phase">Step 3 · Is it material? Any yes makes it material on this screen</p>
              {kit.factors.map((f) => (
                <QuestionRow key={f.id} q={f} value={a[f.id]} options={['yes', 'no']} onAnswer={(v) => answer(f.id, v)} />
              ))}
            </div>
          )}
        </div>

        <div aria-live="polite" className="mt-5">
          {result && outcome ? (
            <div className={`rounded-xl border px-4 py-4 sm:px-5 ${TONE[result.id]}`}>
              <p className="kicker mb-1">Result{result.complete ? '' : ' so far'}</p>
              <h4 className="font-serif text-xl font-semibold leading-snug">{outcome.label}</h4>
              <p className="mt-2 leading-relaxed">
                <RichText text={outcome.verdict} />
              </p>
              {!result.complete && (
                <p className="mt-2 text-sm text-ink/75">Answer the remaining questions: one yes would make it material.</p>
              )}
              {a[banking.id] === 'unsure' && (
                <p className="mt-2 text-sm text-ink/75">
                  You were not sure it is banking-related, so it is treated as banking-related; SA-2 1.3.2 says to seek the
                  HKMA&apos;s advice when in doubt.
                </p>
              )}
              {marked.length > 0 && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Factors marked: </span>
                  {marked.map((f) => `${f.ask.replace(/\?$/, '')} (${f.ref})`).join('; ')}.
                </p>
              )}
              <h5 className="kicker mb-2 mt-4">What to do</h5>
              <BulletList items={outcome.steps} />
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    download(
                      `materiality-${(saved.name.trim() || 'arrangement').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}-${today()}.md`,
                      noteMarkdown(kit, saved, result.id, today()),
                      'text/markdown;charset=utf-8'
                    )
                  }
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-paper hover:bg-ink/90"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> Assessment note (.md)
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
              Answer step 1 to see the result.
            </p>
          )}
        </div>
      </section>

      {kit.dueDiligence && (
        <section aria-labelledby="due-diligence">
          <SectionTitle>
            <span id="due-diligence">Due diligence before signing</span>
          </SectionTitle>
          <BulletList items={kit.dueDiligence.intro} className="mb-4" />
          <DueDiligenceList
            dd={kit.dueDiligence}
            ticks={saved.dd}
            material={result?.id === 'material'}
            onToggle={toggleDd}
          />
        </section>
      )}

      <section>
        <SectionTitle>Why procurement feels the friction</SectionTitle>
        <SectionVisual visual={kit.friction} />
        <BulletList items={kit.frictionPoints} className="mt-4" />
      </section>

      <section>
        <SectionTitle>Signing before the HKMA discussion ends</SectionTitle>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Model wording for a regulatory condition, using the playbook&apos;s defined terms (Vendors tab). Choices and
          figures are in brackets.
          {!showCondition && result ? ' On your answers it is not needed, but it does no harm.' : ''}
        </p>
        <div className="space-y-2 rounded-xl border border-line bg-panel px-4 py-3.5 font-serif text-[15px] leading-relaxed shadow-card">
          {kit.condition.map((c) => (
            <p key={c.slice(0, 12)}>
              <Bracketed text={c} />
            </p>
          ))}
        </div>
        <div className="mt-3">
          <CopyButton text={kit.condition.map(plain).join('\n\n')} label="Copy the clause" />
        </div>
      </section>

      <section>
        <SectionTitle>Sources</SectionTitle>
        <SourceList sources={kit.sources} />
      </section>

      <p className="rounded-lg border border-line px-4 py-3 text-xs leading-relaxed text-muted">
        <RichText text={kit.caveat} />
      </p>
    </div>
  );
}
