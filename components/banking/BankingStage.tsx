'use client';

import { useState } from 'react';
import {
  BookOpen,
  BookText,
  Check,
  ChevronRight,
  Cpu,
  Info,
  Lightbulb,
  ListChecks,
  Scale,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { BankingStage as Stage, CAP155_ANATOMY, PHASES, ProvisionKind } from '@/lib/banking';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, SUMMARY, TITLE } from '../cardStyles';
import { KeyPoints, SectionedPoints, SectionTitle } from '../ui/Bullets';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { NoteCard } from '../ui/NoteCard';
import { PrevNext } from '../ui/PrevNext';
import { Badge, StageHeader } from '../ui/StageHeader';
import { TabPanel, Tabs, type TabDef } from '../ui/Tabs';
import { KIND, ProvisionCard } from './ProvisionCard';

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

type TabId = 'essentials' | 'provisions' | 'checklist' | 'notes' | 'glossary';

function Cap155Anatomy() {
  if (!CAP155_ANATOMY) return null;
  return (
    <details className={`${CARD} mt-8`}>
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
        <h4 className="kicker mt-4">Schedules</h4>
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
  const kinds = Array.from(new Set(stage.provisions.map((p) => p.kind)));
  const shown = filter === 'all' ? stage.provisions : stage.provisions.filter((p) => p.kind === filter);
  const chip = (id: ProvisionKind | 'all', label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={
        'rounded-full border px-3 py-1 text-xs transition-colors ' +
        (filter === id ? 'border-ink bg-ink text-white' : 'border-line bg-panel text-muted hover:text-ink')
      }
    >
      {label} <span className="font-mono opacity-70">{count}</span>
    </button>
  );
  return (
    <>
      <p className="mb-4 flex gap-2 text-sm text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Statute cards include the official text. HKMA guidance is summarised in our own words, with a link to the
        source.
      </p>
      {kinds.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by source type">
          {chip('all', 'All', stage.provisions.length)}
          {kinds.map((k) => chip(k, KIND[k].label, stage.provisions.filter((p) => p.kind === k).length))}
        </div>
      )}
      <div className="grid gap-3">
        {shown.map((p) => (
          <ProvisionCard key={`${p.instrument}|${p.ref}`} provision={p} />
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
            <li key={item}>
              <label
                className={
                  'flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3 leading-relaxed transition-colors ' +
                  (on ? 'border-phase/30 bg-phase/[0.05]' : 'border-line bg-panel shadow-card hover:border-ink/20')
                }
              >
                <input type="checkbox" checked={on} onChange={() => onToggle(i)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-phase/50 ' +
                    (on ? 'border-phase bg-phase text-white' : 'border-ink/30 bg-white')
                  }
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className={on ? 'text-muted line-through decoration-ink/30' : ''}>
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

export function BankingStage({ stage, total, prev, next, onNavigate, ticks, onToggle }: Props) {
  const [tab, setTab] = useState<TabId>('essentials');
  const phase = PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.virtualBankNotes.length + stage.pitfalls.length;

  const tabs: (TabDef & { id: TabId })[] = [
    { id: 'essentials', label: 'Essentials', icon: BookOpen },
    { id: 'provisions', label: 'Provisions', icon: Scale, count: stage.provisions.length },
    { id: 'checklist', label: 'Checklist', icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Practice notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];
  const idBase = `bank-${stage.id}`;

  return (
    <div style={{ '--phase': phase.color } as React.CSSProperties}>
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

      <div className="mt-8">
        <Tabs idBase={idBase} tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          {stage.review === 'draft' && (
            <p className="mb-5 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <span>
                <strong>Independent fact-check pending.</strong> Statute citations in this stage are matched against
                the official text and the stage has had an editorial review, but its HKMA guidance references, dates
                and figures have not yet been independently confirmed.
              </span>
            </p>
          )}
          <KeyPoints title="In 30 seconds" points={stage.keyPoints} />
          <div className="mt-10">
            <SectionTitle>In depth · how it bites in practice</SectionTitle>
            <SectionedPoints sections={stage.deepDive} />
          </div>
          {stage.id === 'map' && <Cap155Anatomy />}
        </TabPanel>
      )}

      {tab === 'provisions' && (
        <TabPanel idBase={idBase} id="provisions">
          <Provisions stage={stage} />
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

      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
