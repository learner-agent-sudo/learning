'use client';

import { useEffect, useState } from 'react';
import { ArrowDownRight, Check, ChevronRight, Download, FilePlus2, Link2 } from 'lucide-react';
import type { AddendumKit, ContractTerm, TermHome } from '@/lib/banking';
import { load, save } from '@/lib/useStudyState';
import { addendumMarkdown, download, plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { CARD, CHEVRON, SUMMARY, TITLE } from '../cardStyles';
import { BulletList } from '../ui/Bullets';
import { Bracketed, CopyButton, openClause } from './Wording';

export const HOMES: TermHome[] = ['main', 'addendum', 'own'];

export const HOME_TONE: Record<TermHome, { chip: string; dot: string; edge: string }> = {
  main: {
    chip: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-200 dark:ring-slate-300/20',
    dot: 'bg-slate-500',
    edge: 'border-t-slate-400',
  },
  addendum: {
    chip: 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-400/15 dark:text-indigo-200 dark:ring-indigo-300/25',
    dot: 'bg-indigo-500',
    edge: 'border-t-indigo-500',
  },
  own: {
    chip: 'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-400/15 dark:text-teal-200 dark:ring-teal-300/25',
    dot: 'bg-teal-500',
    edge: 'border-t-teal-500',
  },
};

const OPTIONS_KEY = 'hk-banking:addendum-options';

const today = () => new Date().toISOString().slice(0, 10);

function defaults(kit: AddendumKit): Record<string, boolean> {
  return Object.fromEntries(kit.options.map((o) => [o.id, o.default]));
}

/** Which clauses go in the provider's main agreement, a banking addendum or a separate agreement with an agent, partner or group company, and a draft addendum. */
export function Addendum({
  kit, terms, definitions, contract,
}: {
  kit: AddendumKit;
  terms: ContractTerm[];
  definitions: { term: string; meaning: string }[];
  contract: string;
}) {
  const [opts, setOpts] = useState<Record<string, boolean>>(() => defaults(kit));

  useEffect(() => {
    const v = load(OPTIONS_KEY);
    if (v && typeof v === 'object') {
      const saved = v as Record<string, unknown>;
      setOpts((o) => Object.fromEntries(Object.entries(o).map(([k, d]) => [k, typeof saved[k] === 'boolean' ? (saved[k] as boolean) : d])));
    }
  }, []);
  const toggle = (id: string) =>
    setOpts((o) => {
      const next = { ...o, [id]: !o[id] };
      save(OPTIONS_KEY, next);
      return next;
    });

  const byHome = (h: TermHome) => terms.filter((t) => (t.home ?? 'addendum') === h);
  const optionOf = (id: string) => kit.options.find((o) => o.terms.includes(id));
  const included = byHome('addendum').filter((t) => {
    const o = optionOf(t.id);
    return !o || opts[o.id];
  });
  const always = byHome('addendum').filter((t) => !optionOf(t.id)).length;
  const chosen = kit.options.filter((o) => opts[o.id]).map((o) => o.label);

  const notes = [
    ...byHome('main').map((t) => `${t.title}: ${t.homeNote ?? kit.homes.main.blurb}`),
    `Agents, partners and group companies: ${byHome('own')
      .map((t) => t.title)
      .join('; ')} go in the agreement with that party.`,
  ];
  const text = () =>
    addendumMarkdown({ kit, definitions, terms: included, notes, contract, chosen, date: today() });

  return (
    <div className="space-y-6">
      <BulletList items={kit.intro} />

      <div className="grid gap-3 md:grid-cols-3">
        {HOMES.map((h) => {
          const list = byHome(h);
          const home = kit.homes[h];
          return (
            <div key={h} className={`rounded-xl border border-line border-t-4 bg-panel px-4 py-3.5 shadow-card ${HOME_TONE[h].edge}`}>
              <h3 className="flex items-baseline justify-between gap-2 font-serif text-[1.05rem] font-semibold leading-snug">
                {home.label}
                <span className="font-mono text-xs font-normal text-muted">{list.length}</span>
              </h3>
              <p className="mt-1 text-[13px] leading-snug text-ink/75">{home.blurb}</p>
              <ul className="mt-2.5 space-y-0.5">
                {list.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openClause(t.id)}
                      className="flex min-h-8 w-full items-start gap-1.5 py-1 text-left text-[13px] leading-snug text-accent underline-offset-2 hover:underline"
                    >
                      <ArrowDownRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                      {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="kicker mb-1 flex items-center gap-1.5 text-phase">
          <Link2 className="h-3.5 w-3.5" aria-hidden /> Clauses that tie the addendum to the provider&apos;s paper
        </h3>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          The regulatory clauses are in the list below. These {kit.mechanics.length} make them hold when the
          provider&apos;s own terms, order forms and online documents say otherwise.
        </p>
        <div className="grid gap-2.5">
          {kit.mechanics.map((m) => (
            <details key={m.id} id={`addendum-${m.id}`} className={CARD}>
              <summary className={SUMMARY}>
                <ChevronRight className={CHEVRON} aria-hidden />
                <span className={TITLE}>{m.title}</span>
              </summary>
              <div className="space-y-3 border-t border-line/80 px-4 pb-4 pt-3">
                <p className="text-sm leading-relaxed">
                  <RichText text={m.why} />
                </p>
                <div className="rounded-lg bg-paper px-4 py-3.5 ring-1 ring-line">
                  <div className="space-y-2.5 font-serif text-[1.02rem] leading-relaxed">
                    {m.model.map((p, i) => (
                      <p key={i}>
                        <Bracketed text={p} />
                      </p>
                    ))}
                  </div>
                  <div className="mt-3">
                    <CopyButton text={m.model.map(plain).join('\n\n')} label="Copy clause" />
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div>
        <h3 className="kicker mb-2">If the provider offers its own financial-services addendum</h3>
        <BulletList items={kit.vendorPaper} />
      </div>

      <div className="rounded-xl border border-phase/25 bg-phase/[0.05] px-4 py-4 sm:px-5">
        <h3 className="kicker flex items-center gap-1.5 text-phase">
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden /> Build a draft addendum
        </h3>
        <p className="mt-2 text-sm leading-relaxed">
          The draft puts together the defined terms, the {kit.mechanics.length} tying clauses and the preferred model
          wording of the addendum clauses: {always} that every provider gets, plus the ones you tick.
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">Optional clauses</legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {kit.options.map((o) => (
              <label
                key={o.id}
                className="flex min-h-10 cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-panel px-3 py-2 text-sm leading-snug has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-phase"
              >
                <input type="checkbox" checked={!!opts[o.id]} onChange={() => toggle(o.id)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={
                    'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ' +
                    (opts[o.id] ? 'border-phase bg-phase text-onaccent' : 'border-ink/60 bg-panel')
                  }
                >
                  {opts[o.id] && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {included.length} clauses in this draft. The main agreement is named from &ldquo;Contract under review&rdquo;
          below. Main-agreement points go at the end as drafting notes. The draft is a starting point for markup against
          the provider&apos;s paper, not a finished document.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => download(`banking-addendum-${today()}.md`, text(), 'text/markdown;charset=utf-8')}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-paper hover:bg-ink/90"
          >
            <Download className="h-3.5 w-3.5" aria-hidden /> Draft addendum (.md)
          </button>
          <CopyButton text={text()} label="Copy draft" />
        </div>
      </div>
    </div>
  );
}
