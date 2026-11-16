'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Check, ChevronRight, CircleCheck, Download, FilePlus2, FileSpreadsheet, Minus, RotateCcw, TriangleAlert,
} from 'lucide-react';
import type { AddendumKit, ContractTerm, OnboardingItem, OnboardingKit as Kit } from '@/lib/banking';
import { BANK_SECTION, onboardPhaseId } from '@/lib/bankingOutline';
import { load, save } from '@/lib/useStudyState';
import { download } from '@/lib/vendorExport';
import {
  STEP_LABEL, STEP_STATUSES, applies, kitLabels, onboardingCsv, onboardingMarkdown, onboardingName,
  type OnboardingState, type StepState, type StepStatus,
} from '@/lib/onboardingExport';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, EDGE, PILL_BASE, SUMMARY, TITLE, chipClass } from '../cardStyles';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { SectionVisual } from '../ui/SectionVisual';
import { useBankingModule } from './ModuleContext';
import { SourceList, StrengthLegend, useStrengths } from './Sources';
import { openClause } from './Wording';

const EMPTY: OnboardingState = { deal: '', picks: [], showAll: false, items: {} };

const STATUS: Record<StepStatus, { icon: typeof Check; on: string; pill: string }> = {
  done: {
    icon: CircleCheck,
    on: 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-paper',
    pill: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
  },
  issue: {
    icon: TriangleAlert,
    on: 'border-rose-700 bg-rose-700 text-white dark:border-rose-300 dark:bg-rose-300 dark:text-paper',
    pill: 'bg-rose-50 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
  },
  na: {
    icon: Minus,
    on: 'border-slate-600 bg-slate-600 text-white dark:border-slate-300 dark:bg-slate-300 dark:text-paper',
    pill: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200',
  },
};

const TOOL_LABEL: Record<NonNullable<OnboardingItem['tab']>, string> = {
  vendors: 'Open the Vendors tab',
  materiality: 'Open the Risk & criticality tab',
  incidents: 'Open the incident clocks',
};

const today = () => new Date().toISOString().slice(0, 10);

function parse(v: unknown, ids: Set<string>, options: Set<string>): OnboardingState {
  if (!v || typeof v !== 'object') return EMPTY;
  const o = v as Record<string, unknown>;
  const items: Record<string, StepState> = {};
  if (o.items && typeof o.items === 'object') {
    for (const [id, raw] of Object.entries(o.items as Record<string, unknown>)) {
      if (!ids.has(id) || !raw || typeof raw !== 'object') continue;
      const r = raw as { status?: unknown; note?: unknown };
      const e: StepState = {};
      if (STEP_STATUSES.includes(r.status as StepStatus)) e.status = r.status as StepStatus;
      if (typeof r.note === 'string' && r.note) e.note = r.note;
      if (e.status || e.note) items[id] = e;
    }
  }
  return {
    deal: typeof o.deal === 'string' ? o.deal : '',
    picks: Array.isArray(o.picks) ? o.picks.filter((p): p is string => typeof p === 'string' && options.has(p)) : [],
    showAll: o.showAll === true,
    items,
  };
}

// The tab change re-renders the stage; wait for the clause card before opening it.
function whenPresent(id: string, then: () => void) {
  let tries = 0;
  const step = () => {
    if (document.getElementById(id)) then();
    else if (tries++ < 60) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function StepCard({
  item, n, noun, state, terms, onStatus, onNote, onTab, onClause,
}: {
  item: OnboardingItem;
  n: string;
  noun: string;
  state?: StepState;
  terms: Record<string, ContractTerm>;
  onStatus: (s: StepStatus | undefined) => void;
  onNote: (note: string) => void;
  onTab: (tab: string) => void;
  onClause: (id: string) => void;
}) {
  const top = useStrengths()[item.sources[0]?.strength ?? 'good-practice'];
  const status = state?.status;
  const done = status === 'done';
  const StatusIcon = status ? STATUS[status].icon : null;
  const linked = (item.terms ?? []).filter((t) => terms[t]);
  return (
    <li className="flex min-w-0 items-start gap-2.5">
      <button
        type="button"
        aria-pressed={done}
        aria-label={`Mark done: ${item.title}`}
        onClick={() => onStatus(done ? undefined : 'done')}
        className={
          'mt-3.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors focus-visible:outline-offset-2 ' +
          (done ? 'border-phase bg-phase text-onaccent' : 'border-ink/55 bg-panel hover:border-ink')
        }
      >
        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
      </button>
      <details id={`step-${item.id}`} className={`${CARD} min-w-0 flex-1`}>
        <summary className={SUMMARY}>
          <span aria-hidden className={`${EDGE} ${top.bar}`} />
          <ChevronRight className={CHEVRON} aria-hidden />
          <span className={`${TITLE} min-w-0 ${done ? 'text-ink/60' : ''}`}>
            <span className="mr-1.5 font-mono text-[11px] font-normal text-muted">{n}</span>
            {item.title}
            <span className="mt-1.5 flex flex-wrap gap-1">
              {item.owner.map((o, i) => (
                <span
                  key={o}
                  className={
                    'rounded-full px-2 py-px text-[10.5px] ' +
                    (i === 0 ? 'bg-ink/[0.09] font-medium text-ink/80' : 'bg-ink/[0.05] font-normal text-muted')
                  }
                  title={i === 0 ? 'Leads' : 'Involved'}
                >
                  {o}
                </span>
              ))}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`${PILL_BASE} ${top.pill}`} title={top.title}>
              {top.label}
            </span>
            {status && StatusIcon && (
              <span className={`${PILL_BASE} inline-flex items-center gap-1 ${STATUS[status].pill}`}>
                <StatusIcon className="h-3 w-3" aria-hidden />
                {STEP_LABEL[status]}
              </span>
            )}
          </span>
        </summary>
        <div className={`${BODY} space-y-4 break-words`}>
          <BulletList items={item.detail} />
          {item.evidence && item.evidence.length > 0 && (
            <div>
              <h5 className="kicker mb-1.5">On the file</h5>
              <p className="text-sm leading-relaxed text-ink/80">
                {item.evidence.map((e, i) => (
                  <span key={e}>
                    {i > 0 && ' · '}
                    <RichText text={e} />
                  </span>
                ))}
              </p>
            </div>
          )}
          {item.wording && item.wording.length > 0 && (
            <div>
              <h5 className="kicker mb-1.5">Model wording</h5>
              <ul className="space-y-1.5">
                {item.wording.map((w) => (
                  <li
                    key={w}
                    className="rounded-r-lg border-l-2 border-phase/60 bg-ink/[0.03] px-3 py-2 text-sm leading-relaxed text-ink/85"
                  >
                    <RichText text={w} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(linked.length > 0 || item.tab) && (
            <div>
              <h5 className="kicker mb-1.5">Carry it forward</h5>
              <div className="flex flex-wrap gap-1.5">
                {linked.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onClause(t)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-paper px-3 text-left text-xs font-medium text-ink transition-colors hover:border-ink/30"
                  >
                    {terms[t].title}
                    <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
                  </button>
                ))}
                {item.tab && (
                  <button
                    type="button"
                    onClick={() => onTab(item.tab!)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-phase/50 bg-paper px-3 text-xs font-medium text-ink transition-colors hover:border-phase"
                  >
                    {TOOL_LABEL[item.tab]}
                    <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          )}
          <div>
            <h5 className="kicker mb-2">Sources</h5>
            <SourceList sources={item.sources} />
          </div>
          <div className="space-y-2.5 border-t border-line/80 pt-4">
            <fieldset>
              <legend className="kicker mb-2">This {noun}</legend>
              <div className="flex flex-wrap gap-1.5">
                {STEP_STATUSES.map((s) => {
                  const Icon = STATUS[s].icon;
                  const on = status === s;
                  return (
                    <label key={s} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`step-status-${item.id}`}
                        value={s}
                        checked={on}
                        onChange={() => onStatus(s)}
                        onClick={() => on && onStatus(undefined)}
                        className="peer sr-only"
                      />
                      <span
                        className={
                          'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-phase peer-focus-visible:ring-offset-1 ' +
                          (on ? STATUS[s].on : 'border-line bg-panel text-muted hover:text-ink')
                        }
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {STEP_LABEL[s]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <label className="block">
              <span className="sr-only">
                Notes on {item.title} for this {noun}
              </span>
              <textarea
                value={state?.note ?? ''}
                onChange={(e) => onNote(e.target.value)}
                rows={2}
                placeholder="Notes: who has it, what is outstanding, where the evidence is…"
                className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-base leading-relaxed placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
              />
            </label>
          </div>
        </div>
      </details>
    </li>
  );
}

/** Counsel's step-by-step checklist (a new vendor, or one advertisement), narrowed by a profile. */
export function OnboardingKit({
  kit, terms, addendum, onGo,
}: {
  kit: Kit;
  terms: ContractTerm[];
  addendum?: AddendumKit;
  // Move to another tab of the stage, or a section in it.
  onGo: (tab: string, section?: string) => void;
}) {
  const { storage } = useBankingModule();
  const KEY = `${storage}:${kit.storageKey ?? 'onboarding'}:v1`;
  const L = kitLabels(kit);
  const ids = useMemo(() => new Set(kit.items.map((i) => i.id)), [kit]);
  const options = useMemo(() => new Set(kit.profile.flatMap((g) => g.options.map((o) => o.id))), [kit]);
  const [state, setState] = useState<OnboardingState>(EMPTY);
  const [notice, setNotice] = useState('');
  useEffect(() => setState(parse(load(KEY), ids, options)), [KEY, ids, options]);

  const update = (fn: (s: OnboardingState) => OnboardingState) =>
    setState((prev) => {
      const next = fn(prev);
      save(KEY, next);
      return next;
    });
  const setItem = (id: string, patch: Partial<StepState>) =>
    update((s) => {
      const cur = { ...s.items[id], ...patch };
      const items = { ...s.items };
      if (!cur.status) delete cur.status;
      if (!cur.note) delete cur.note;
      if (cur.status || cur.note) items[id] = cur;
      else delete items[id];
      return { ...s, items };
    });
  const togglePick = (id: string) =>
    update((s) => ({ ...s, picks: s.picks.includes(id) ? s.picks.filter((p) => p !== id) : [...s.picks, id] }));

  const filtering = state.picks.length > 0 && !state.showAll;
  const shown = filtering ? kit.items.filter((i) => applies(i, state.picks)) : kit.items;
  const statusOf = (id: string) => state.items[id]?.status;
  const done = shown.filter((i) => statusOf(i.id) === 'done').length;
  const issues = shown.filter((i) => statusOf(i.id) === 'issue').length;
  const na = shown.filter((i) => statusOf(i.id) === 'na').length;
  const byTerm = useMemo(() => Object.fromEntries(terms.map((t) => [t.id, t])), [terms]);

  const exportMd = () =>
    download(
      onboardingName(state.deal, 'md', today(), L.fileStem, L.noun),
      onboardingMarkdown(kit, state, shown, terms, today()),
      'text/markdown;charset=utf-8'
    );
  const exportCsv = () =>
    download(
      onboardingName(state.deal, 'csv', today(), L.fileStem, L.noun),
      onboardingCsv(kit, state, shown, terms),
      'text/csv;charset=utf-8'
    );

  // Switch on the addendum options this profile calls for, then show the builder.
  const setUpAddendum = () => {
    if (!addendum || !kit.addendumOptions) return;
    const key = `${storage}:addendum-options`;
    const saved = load(key);
    const current: Record<string, boolean> = Object.fromEntries(addendum.options.map((o) => [o.id, o.default]));
    if (saved && typeof saved === 'object') {
      for (const [k, v] of Object.entries(saved as Record<string, unknown>)) if (typeof v === 'boolean') current[k] = v;
    }
    for (const o of addendum.options) {
      const from = kit.addendumOptions[o.id];
      if (from) current[o.id] = from.some((p) => state.picks.includes(p));
    }
    save(key, current);
    onGo('vendors', BANK_SECTION.vendorsAddendum);
  };

  const openTerm = (id: string) => {
    onGo('vendors');
    whenPresent(`term-${id}`, () => openClause(id));
  };

  const phaseNumber = (phase: string) => kit.phases.findIndex((p) => p.id === phase) + 1;
  const allSources = kit.items.flatMap((i) => i.sources);

  return (
    <div className="space-y-10">
      <section>
        <BulletList items={kit.intro} />
      </section>

      <section id={BANK_SECTION.onboardProfile} aria-labelledby="onboard-profile-title">
        <SectionTitle>
          <span id="onboard-profile-title">{L.profileTitle}</span>
        </SectionTitle>
        <label className="block">
          <span className="kicker mb-1.5 block">{L.nameLabel}</span>
          <input
            type="text"
            value={state.deal}
            onChange={(e) => update((s) => ({ ...s, deal: e.target.value }))}
            placeholder={L.namePlaceholder}
            className="block w-full rounded-lg border border-line bg-paper px-3 py-2 text-base placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
          />
        </label>
        {kit.profile.map((g) => (
          <fieldset key={g.id} className="mt-5">
            <legend className="text-sm font-medium">{g.label}</legend>
            {g.help && <p className="mt-0.5 text-[13px] text-ink/65">{g.help}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.options.map((o) => {
                const on = state.picks.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    title={o.hint}
                    onClick={() => togglePick(o.id)}
                    className={chipClass(on)}
                  >
                    {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="mt-6 rounded-xl border border-line bg-ink/[0.025] px-4 py-3.5">
          <p className="text-sm" aria-live="polite">
            <span className="font-medium">
              {shown.length} of {kit.items.length} steps
            </span>{' '}
            {filtering
              ? `apply to this ${L.noun}`
              : state.picks.length
                ? 'shown (every step)'
                : 'shown: pick the profile to narrow them'}
            <span className="text-muted">
              {' '}· {done} done · {issues} open {issues === 1 ? 'issue' : 'issues'} · {na} not applicable
            </span>
          </p>
          {state.picks.length > 0 && (
            <label className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-2 text-[13px] text-ink/80">
              <input
                type="checkbox"
                checked={state.showAll}
                onChange={() => update((s) => ({ ...s, showAll: !s.showAll }))}
                className="h-4 w-4 accent-[var(--phase)]"
              />
              Show the steps that do not apply too
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={exportMd} className={chipClass(false) + ' font-medium text-ink'}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Checklist (.md)
            </button>
            <button type="button" onClick={exportCsv} className={chipClass(false) + ' font-medium text-ink'}>
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden /> Tracker (.csv)
            </button>
            {addendum && kit.addendumOptions && (
              <button
                type="button"
                onClick={setUpAddendum}
                title="Switch on the addendum options this profile calls for, then open the addendum builder"
                className={chipClass(false) + ' font-medium text-ink'}
              >
                <FilePlus2 className="h-3.5 w-3.5" aria-hidden /> Set up the addendum for this deal
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`Clear the ${L.nameLabel.toLowerCase()}, the profile, the ticks and the notes?`)) return;
                update(() => EMPTY);
                setNotice('Cleared');
                setTimeout(() => setNotice(''), 1800);
              }}
              className={chipClass(false)}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Start again
            </button>
            <span className="sr-only" aria-live="polite">
              {notice}
            </span>
          </div>
        </div>
      </section>

      <section id={BANK_SECTION.onboardDocuments} aria-labelledby="onboard-documents-title">
        <SectionTitle>
          <span id="onboard-documents-title">{L.documentsTitle}</span>
        </SectionTitle>
        <SectionVisual visual={kit.documents} />
        {kit.documentsNote && <BulletList items={kit.documentsNote} className="mt-4" />}
      </section>

      <div className="space-y-10">
        <StrengthLegend sources={allSources} />
        {kit.phases.map((p) => {
          const items = shown.filter((i) => i.phase === p.id);
          const n = phaseNumber(p.id);
          const phaseDone = items.filter((i) => statusOf(i.id) === 'done').length;
          return (
            <section key={p.id} id={onboardPhaseId(p.id)} aria-labelledby={`${onboardPhaseId(p.id)}-title`}>
              <SectionTitle
                aside={
                  items.length > 0 && (
                    <span className="font-mono text-[11px] tabular-nums text-muted">
                      {phaseDone}/{items.length}
                    </span>
                  )
                }
              >
                <span id={`${onboardPhaseId(p.id)}-title`}>
                  {n}. {p.title}
                </span>
              </SectionTitle>
              <p className="-mt-1 mb-4 text-[15px] leading-relaxed text-ink/75">{p.lede}</p>
              {items.length ? (
                <ol className="grid gap-3">
                  {items.map((i) => (
                    <StepCard
                      key={i.id}
                      item={i}
                      n={`${n}.${kit.items.filter((x) => x.phase === p.id).indexOf(i) + 1}`}
                      noun={L.noun}
                      state={state.items[i.id]}
                      terms={byTerm}
                      onStatus={(s) => setItem(i.id, { status: s })}
                      onNote={(note) => setItem(i.id, { note })}
                      onTab={(t) => onGo(t)}
                      onClause={openTerm}
                    />
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">No steps in this phase apply to the profile chosen.</p>
              )}
            </section>
          );
        })}
      </div>

      {kit.caveat && <p className="border-t border-line pt-4 text-[13px] leading-relaxed text-muted">{kit.caveat}</p>}
    </div>
  );
}
