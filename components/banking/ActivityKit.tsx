'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, ChevronRight, Download, Landmark, RotateCcw, Search, TriangleAlert } from 'lucide-react';
import type { Activity, ActivityGroup, ActivityKit as Kit, Regime } from '@/lib/banking';
import { GROUP_LABEL, REGIME_LABEL, launchNotesMarkdown } from '@/lib/activityExport';
import { load, save, useChecklists } from '@/lib/useStudyState';
import { download, plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, EDGE, PILL_BASE, SUMMARY, TITLE, chipClass } from '../cardStyles';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { SectionVisual } from '../ui/SectionVisual';
import { ViewTabs } from '../ui/ViewTabs';
import { SourceList, STRENGTH, StrengthLegend } from './Sources';

const REGIME: Record<Regime, { pill: string; dot: string; title: string }> = {
  'in-force': {
    pill: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
    dot: 'bg-emerald-500',
    title: 'The rules that govern it are in force: legislation, or regulator guidance where no statute applies',
  },
  transitional: {
    pill: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    dot: 'bg-amber-500',
    title: 'Rules apply now, but a new statutory regime or transitional arrangements are on the way',
  },
  proposed: {
    pill: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-200',
    dot: 'bg-fuchsia-500',
    title: 'The main regime is a bill or proposal: check its status before relying on it',
  },
  pilot: {
    pill: 'bg-sky-50 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
    dot: 'bg-sky-500',
    title: 'An HKMA pilot or sandbox: terms are set case by case',
  },
};
const REGIMES = Object.keys(REGIME) as Regime[];

type View = 'rules' | 'gates' | 'sources';
const VIEW_KEY = 'hk-banking:activity-view';
const VIEWS: { id: View; label: string }[] = [
  { id: 'rules', label: 'Rules' },
  { id: 'gates', label: 'Launch gates' },
  { id: 'sources', label: 'Sources' },
];

const today = () => new Date().toISOString().slice(0, 10);

function Block({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h4 className="kicker mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function RulesView({ act }: { act: Activity }) {
  return (
    <div className="space-y-4">
      <p className="leading-relaxed">
        <RichText text={act.summary} />
      </p>
      <div className="rounded-lg bg-phase/[0.06] px-3.5 py-3 ring-1 ring-phase/15">
        <h4 className="mb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-phase">
          Can the bank do it?
        </h4>
        <p className="leading-relaxed">
          <RichText text={act.route} />
        </p>
      </div>
      <Block title="What the rules require">
        <BulletList items={act.require} />
      </Block>
      <p className="flex items-center gap-2 text-sm text-muted">
        <Landmark className="h-4 w-4 shrink-0" aria-hidden />
        Regulators: {act.regulators.join(' · ')}
      </p>
    </div>
  );
}

function GatesView({ act, ticks, onToggle }: { act: Activity; ticks: boolean[]; onToggle: (i: number) => void }) {
  const done = ticks.filter(Boolean).length;
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-phase transition-all duration-500"
              style={{ width: `${act.gates.length ? (done / act.gates.length) * 100 : 0}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted">
            {done}/{act.gates.length} confirmed
          </span>
        </div>
        <ul className="space-y-2">
          {act.gates.map((g, i) => {
            const on = ticks[i] ?? false;
            return (
              <li key={`${i}-${g.slice(0, 24)}`}>
                <label
                  className={
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 text-[15px] leading-relaxed transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-phase ' +
                    (on ? 'border-phase/30 bg-phase/[0.05] text-ink/70' : 'border-line bg-panel hover:border-ink/25')
                  }
                >
                  <input type="checkbox" checked={on} onChange={() => onToggle(i)} className="peer sr-only" />
                  <span
                    aria-hidden
                    className={
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ' +
                      (on ? 'border-phase bg-phase text-onaccent' : 'border-ink/60 bg-panel')
                    }
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span>
                    <RichText text={g} />
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      <Block title="Watch for" icon={<TriangleAlert className="h-3.5 w-3.5" aria-hidden />}>
        <BulletList items={act.watchFor} />
      </Block>
    </div>
  );
}

function ActivityCard({
  act, view, onView, ticks, onToggle,
}: {
  act: Activity;
  view: View;
  onView: (v: View) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}) {
  const top = STRENGTH[act.sources[0]?.strength ?? 'good-practice'];
  const rg = REGIME[act.regime];
  const done = ticks.filter(Boolean).length;
  const id = `activity-${act.id}`;
  return (
    <details id={id} className={`${CARD} min-w-0`}>
      <summary className={SUMMARY}>
        <span aria-hidden className={`${EDGE} ${top.bar}`} />
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={`${TITLE} min-w-0`}>
          {act.title}
          <span className="mt-1 line-clamp-2 text-[13px] font-normal leading-snug text-ink/65 group-open:hidden">
            {plain(act.route)}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-full bg-ink/[0.06] px-2 py-px text-[10.5px] font-normal text-muted">
              {GROUP_LABEL[act.group]}
            </span>
            {act.regulators.map((r) => (
              <span key={r} className="rounded-full border border-line px-2 py-px text-[10.5px] font-normal text-muted">
                {r}
              </span>
            ))}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`${PILL_BASE} inline-flex items-center gap-1 ${rg.pill}`} title={rg.title}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${rg.dot}`} />
            {REGIME_LABEL[act.regime]}
          </span>
          {done > 0 && (
            <span className="font-mono text-[11px] text-muted" title="Launch gates confirmed">
              {done}/{act.gates.length} gates
            </span>
          )}
        </span>
      </summary>
      <div className={`${BODY} break-words`}>
        <ViewTabs id={id} label="Activity view" view={view} views={VIEWS} onView={onView} />
        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${view}`}>
          {view === 'rules' && <RulesView act={act} />}
          {view === 'gates' && <GatesView act={act} ticks={ticks} onToggle={onToggle} />}
          {view === 'sources' && <SourceList sources={act.sources} />}
        </div>
      </div>
    </details>
  );
}

/** Digital-asset and platform activities: can the bank do it, and what must be true before launch. */
export function ActivityKit({ kit }: { kit: Kit }) {
  const [group, setGroup] = useState<ActivityGroup | 'all'>('all');
  const [regime, setRegime] = useState<Regime | 'any'>('any');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('rules');
  const [sizes] = useState(() => Object.fromEntries(kit.activities.map((a) => [a.id, a.gates.length])));
  const [ticks, toggle, reset] = useChecklists('hk-banking:gates', sizes);

  useEffect(() => {
    const v = load(VIEW_KEY);
    if (v === 'rules' || v === 'gates' || v === 'sources') setView(v);
  }, []);
  const changeView = (v: View) => {
    setView(v);
    save(VIEW_KEY, v);
  };

  const groups = Array.from(new Set(kit.activities.map((a) => a.group)));
  const q = query.trim().toLowerCase();
  const shown = kit.activities.filter(
    (a) =>
      (group === 'all' || a.group === group) &&
      (regime === 'any' || a.regime === regime) &&
      (!q || [a.title, a.summary, a.route, ...a.regulators].join(' ').toLowerCase().includes(q))
  );
  const totalGates = kit.activities.reduce((n, a) => n + a.gates.length, 0);
  const confirmed = kit.activities.reduce((n, a) => n + (ticks[a.id] ?? []).filter(Boolean).length, 0);

  const exportMd = () => {
    const d = today();
    download(`launch-notes-${d}.md`, launchNotesMarkdown(shown, kit, ticks, d), 'text/markdown;charset=utf-8');
  };
  const clear = () => {
    if (window.confirm('Untick every launch gate?')) reset();
  };

  return (
    <div className="space-y-10">
      <section>
        <BulletList items={kit.intro} />
        <SectionVisual visual={kit.triage} />
      </section>

      <section>
        <SectionTitle
          aside={
            <span className="font-mono text-xs text-muted">
              {confirmed}/{totalGates} gates confirmed
            </span>
          }
        >
          Can the bank do it?
        </SectionTitle>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Each card has three views: the route and what the rules require, the launch gates to confirm before going
          live, and the sources with their legal force. Ticks stay in this browser and go into the launch notes.
        </p>

        <div className="mb-4 rounded-xl border border-line bg-panel px-4 py-3.5 shadow-card">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[14rem] flex-1">
              <span className="kicker mb-1.5 block">Find an activity</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. custody, stablecoin, money lender, SFC"
                  className="block min-h-10 w-full rounded-lg border border-line bg-paper pl-9 pr-3 text-base placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
                />
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={exportMd}
                disabled={shown.length === 0}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> Launch notes (.md)
              </button>
              {confirmed > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs text-ink hover:border-ink/30"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear ticks
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">The download covers the activities shown below.</p>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Show activities in">
          {[{ id: 'all' as const, label: `All ${kit.activities.length}` }, ...groups.map((g) => ({ id: g, label: GROUP_LABEL[g] }))].map(
            (c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setGroup(c.id)}
                aria-pressed={group === c.id}
                className={chipClass(group === c.id)}
              >
                {c.label}
                {c.id !== 'all' && (
                  <span className="font-mono tabular-nums">{kit.activities.filter((a) => a.group === c.id).length}</span>
                )}
              </button>
            )
          )}
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Show activities whose regime is">
          {REGIMES.map((r) => {
            const n = kit.activities.filter((a) => a.regime === r).length;
            return n === 0 ? null : (
              <button
                key={r}
                type="button"
                onClick={() => setRegime(regime === r ? 'any' : r)}
                aria-pressed={regime === r}
                title={REGIME[r].title}
                className={chipClass(regime === r)}
              >
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${REGIME[r].dot}`} />
                {REGIME_LABEL[r]}
                <span className="font-mono tabular-nums">{n}</span>
              </button>
            );
          })}
        </div>
        <StrengthLegend
          sources={kit.activities.flatMap((a) => a.sources)}
          more={[
            {
              title: 'Regime',
              entries: REGIMES.filter((r) => kit.activities.some((a) => a.regime === r)).map((r) => ({
                label: REGIME_LABEL[r],
                meaning: REGIME[r].title,
                dot: REGIME[r].dot,
              })),
            },
          ]}
        />

        <div className="grid gap-3">
          {shown.map((a) => (
            <ActivityCard
              key={a.id}
              act={a}
              view={view}
              onView={changeView}
              ticks={ticks[a.id] ?? []}
              onToggle={(i) => toggle(a.id, i)}
            />
          ))}
          {shown.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No activity matches these filters.
            </p>
          )}
        </div>
      </section>

      {kit.caveat && (
        <p className="rounded-lg border border-line px-4 py-3 text-xs leading-relaxed text-muted">
          <RichText text={kit.caveat} />
        </p>
      )}
    </div>
  );
}
