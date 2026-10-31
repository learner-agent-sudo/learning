'use client';

import { useEffect, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import type { MaterialityKit, MaterialityOutcomeId, MaterialityQuestion } from '@/lib/banking';
import { load, save } from '@/lib/useStudyState';
import { download, plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { chipClass } from '../cardStyles';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { SectionVisual } from '../ui/SectionVisual';
import { SourceList } from './Sources';
import { Bracketed, CopyButton } from './Wording';

type Answer = 'yes' | 'no' | 'unsure';
interface Saved {
  name: string;
  answers: Record<string, Answer>;
}

const KEY = 'hk-banking:materiality';
const EMPTY: Saved = { name: '', answers: {} };
const LABEL: Record<Answer, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' };

const today = () => new Date().toISOString().slice(0, 10);

function parse(v: unknown): Saved {
  if (!v || typeof v !== 'object') return EMPTY;
  const o = v as { name?: unknown; answers?: unknown };
  const answers: Record<string, Answer> = {};
  if (o.answers && typeof o.answers === 'object') {
    for (const [k, a] of Object.entries(o.answers as Record<string, unknown>)) {
      if (a === 'yes' || a === 'no' || a === 'unsure') answers[k] = a;
    }
  }
  return { name: typeof o.name === 'string' ? o.name : '', answers };
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

/** Step-by-step check of whether a SaaS or cloud deployment is (material) outsourcing, and what follows. */
export function MaterialityTool({ kit }: { kit: MaterialityKit }) {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  useEffect(() => setSaved(parse(load(KEY))), []);

  const update = (next: Saved) => {
    setSaved(next);
    save(KEY, next);
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
  const started = saved.name !== '' || Object.keys(a).length > 0;
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
              onClick={() => window.confirm('Clear the answers and the arrangement name?') && update(EMPTY)}
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
