'use client';

import { useState } from 'react';
import {
  BookOpen,
  BookText,
  ClipboardCheck,
  Check,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Cpu,
  Info,
  Lightbulb,
  ListChecks,
  Rocket,
  Scale,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { BankingStage as Stage, BankingTab, CAP155_ANATOMY, PHASES, ProvisionKind } from '@/lib/banking';
import { toneVars } from '@/lib/theme';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, SUMMARY, TITLE } from '../cardStyles';
import { KeyPoints, SectionedPoints, SectionTitle, sectionId } from '../ui/Bullets';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { NoteCard } from '../ui/NoteCard';
import { PageContents, type PageSection } from '../ui/PageContents';
import { PrevNext } from '../ui/PrevNext';
import { Badge, StageHeader } from '../ui/StageHeader';
import { NextTab, TabPanel, Tabs, tabsTopId, type TabDef } from '../ui/Tabs';
import { KIND, ProvisionCard } from './ProvisionCard';
import { ActivityKit } from './ActivityKit';
import { VendorKit } from './VendorKit';

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: BankingTab;
  onTabChange: (tab: BankingTab) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

const CHIP =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors focus-visible:outline-offset-1';

function Cap155Anatomy() {
  if (!CAP155_ANATOMY) return null;
  return (
    <details className={`${CARD} mt-10`}>
      <summary className={SUMMARY}>
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={TITLE}>
          Anatomy of the Banking Ordinance
          <span className="mt-1 block font-mono text-[11.5px] font-normal text-muted">
            {CAP155_ANATOMY.parts.length} Parts · {CAP155_ANATOMY.schedules.length} Schedules · as at{' '}
            {CAP155_ANATOMY.versionDate}
          </span>
        </span>
      </summary>
      <div className={BODY}>
        <p className="text-xs text-muted">Generated from the official text. Repealed Parts are omitted.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <tbody>
              {CAP155_ANATOMY.parts.map((p) => (
                <tr key={p.num} className="border-t border-line/70 align-top">
                  <td className="whitespace-nowrap py-1.5 pr-3 font-mono text-xs font-medium text-phase">{p.num}</td>
                  <td className="py-1.5 pr-3">{p.heading}</td>
                  <td className="whitespace-nowrap py-1.5 font-mono text-[11px] text-muted">{p.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="kicker mt-4">Schedules</p>
        <ul className="mt-1.5 space-y-1 text-sm">
          {CAP155_ANATOMY.schedules.map((s) => (
            <li key={s.num}>
              <span className="font-mono text-xs font-medium text-phase">{s.num}</span> — {s.heading}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function Provisions({ stage }: { stage: Stage }) {
  const [filter, setFilter] = useState<ProvisionKind | 'all'>('all');
  // Bumping the version remounts the cards with every card open or closed.
  const [expand, setExpand] = useState({ open: false, version: 0 });
  const kinds = Array.from(new Set(stage.provisions.map((p) => p.kind)));
  const shown = filter === 'all' ? stage.provisions : stage.provisions.filter((p) => p.kind === filter);
  const chip = (id: ProvisionKind | 'all', label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={
        CHIP + ' ' + (filter === id ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-muted hover:text-ink')
      }
    >
      {label} <span className="font-mono tabular-nums">{count}</span>
    </button>
  );
  return (
    <>
      <p className="mb-4 flex gap-2 text-sm text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Statute cards include the official text. HKMA guidance is summarised in our own words, with a link to the
        source.
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {kinds.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by source type">
            {chip('all', 'All', stage.provisions.length)}
            {kinds.map((k) => chip(k, KIND[k].label, stage.provisions.filter((p) => p.kind === k).length))}
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setExpand((e) => ({ open: !e.open, version: e.version + 1 }))}
          className={`${CHIP} border-line bg-panel text-ink hover:border-ink/30`}
        >
          {expand.open ? <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />}
          {expand.open ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <div className="grid gap-3">
        {shown.map((p) => (
          <ProvisionCard key={`${p.instrument}|${p.ref}|${expand.version}`} provision={p} defaultOpen={expand.open} />
        ))}
      </div>
    </>
  );
}

function Checklist({ items, ticks, onToggle }: { items: string[]; ticks: boolean[]; onToggle: (i: number) => void }) {
  const done = ticks.filter(Boolean).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return (
    <>
      <div className="mb-5 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-phase transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs text-muted">
          {done}/{items.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const on = ticks[i] ?? false;
          return (
            <li key={`${i}-${item.slice(0, 24)}`}>
              <label
                className={
                  'flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3 leading-relaxed transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-phase ' +
                  (on ? 'border-phase/30 bg-phase/[0.05] text-ink/70' : 'border-line bg-panel shadow-card hover:border-ink/25')
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
                  <RichText text={item} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Ticks are saved in this browser only.</p>
    </>
  );
}

export function BankingStage({ stage, total, prev, next, onNavigate, tab, onTabChange, ticks, onToggle }: Props) {
  const phase = PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.virtualBankNotes.length + stage.pitfalls.length;

  const tabs: (TabDef & { id: BankingTab })[] = [
    { id: 'essentials', label: 'Essentials', short: stage.vendorKit || stage.activityKit ? 'Basics' : undefined, icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    ...(stage.vendorKit
      ? [{ id: 'vendors' as const, label: 'Vendors', icon: ClipboardCheck, count: stage.vendorKit.terms.length }]
      : []),
    ...(stage.activityKit
      ? [{ id: 'activities' as const, label: 'Activities', short: 'Can we?', icon: Rocket, count: stage.activityKit.activities.length }]
      : []),
    { id: 'checklist', label: 'Checklist', icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];
  const idBase = `bank-${stage.id}`;
  const sections: PageSection[] =
    tab === 'essentials'
      ? [
          { id: `${idBase}-key`, label: 'In 30 seconds' },
          ...stage.deepDive.map((d, i) => ({ id: sectionId(idBase, i), label: d.heading, mark: `§${i + 1}` })),
        ]
      : [];

  return (
    <div style={toneVars('--phase', phase.tone)}>
      <StageHeader
        index={stage.index}
        total={total}
        phaseLabel={phase.label}
        title={stage.title}
        standfirst={stage.oneLiner}
        badges={
          stage.review === 'draft' ? (
            <Badge tone="warn" title="See the note under Essentials">
              <TriangleAlert className="h-3 w-3" aria-hidden /> Fact-check pending
            </Badge>
          ) : (
            <Badge title="Dates, references and figures independently checked">
              <Check className="h-3 w-3" aria-hidden /> Fact-checked
            </Badge>
          )
        }
      />

      <Tabs className="mt-7" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as BankingTab)} />

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          {stage.review === 'draft' && (
            <details className="group mb-5 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2.5 px-4 py-2 [&::-webkit-details-marker]:hidden">
                <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                <strong className="font-semibold">Independent fact-check pending</strong>
                <span className="ml-auto text-xs text-amber-800 underline underline-offset-2 dark:text-amber-200">
                  <span className="group-open:hidden">What this means</span>
                  <span className="hidden group-open:inline">Hide</span>
                </span>
              </summary>
              <p className="px-4 pb-3 leading-relaxed">
                Statute citations in this stage are matched against the official text and the stage has had an
                editorial review, but its HKMA guidance references, dates and figures have not yet been independently
                confirmed.
              </p>
            </details>
          )}
          <KeyPoints id={`${idBase}-key`} title="In 30 seconds" points={stage.keyPoints} />
          <div className="mt-10">
            <SectionTitle>In depth · how it bites in practice</SectionTitle>
            <SectionedPoints sections={stage.deepDive} idPrefix={idBase} />
          </div>
          {stage.id === 'map' && <Cap155Anatomy />}
        </TabPanel>
      )}

      {tab === 'provisions' && (
        <TabPanel idBase={idBase} id="provisions">
          <Provisions stage={stage} />
        </TabPanel>
      )}

      {tab === 'vendors' && stage.vendorKit && (
        <TabPanel idBase={idBase} id="vendors">
          <VendorKit kit={stage.vendorKit} />
        </TabPanel>
      )}

      {tab === 'activities' && stage.activityKit && (
        <TabPanel idBase={idBase} id="activities">
          <ActivityKit kit={stage.activityKit} />
        </TabPanel>
      )}

      {tab === 'checklist' && (
        <TabPanel idBase={idBase} id="checklist">
          <Checklist items={stage.checklist} ticks={ticks} onToggle={onToggle} />
        </TabPanel>
      )}

      {tab === 'notes' && (
        <TabPanel idBase={idBase} id="notes">
          <div className="grid gap-5">
            <NoteCard title="The IT angle" subtitle="Where law meets the stack" icon={Cpu} tone="sky" items={stage.itAngle} />
            <NoteCard
              title="Digital bank specifics"
              subtitle="What changes for a bank without branches"
              icon={Smartphone}
              tone="violet"
              items={stage.virtualBankNotes}
            />
            <NoteCard
              title="Common pitfalls"
              subtitle="Where banks and their counsel get caught"
              icon={TriangleAlert}
              tone="rose"
              items={stage.pitfalls}
            />
          </div>
        </TabPanel>
      )}

      {tab === 'glossary' && (
        <TabPanel idBase={idBase} id="glossary">
          <GlossaryGrid terms={stage.glossary} />
        </TabPanel>
      )}

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as BankingTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents sections={sections} topId={tabsTopId(idBase)} />
    </div>
  );
}
