'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  BookText,
  Briefcase,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
  GitBranch,
  Handshake,
  ScrollText,
} from 'lucide-react';
import type { MnaTab, Stage } from '@/lib/workflow';
import { prefersReducedMotion } from '@/lib/useStudyState';
import { ClauseCard } from '../ClauseCard';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { PageContents } from '../ui/PageContents';
import { PrevNext } from '../ui/PrevNext';
import { AbbrKey } from '../ui/AbbrKey';
import { Badge, StageHeader } from '../ui/StageHeader';
import { NextTab, TabPanel, Tabs, tabsTopId, type TabDef } from '../ui/Tabs';

interface Props {
  stage: Stage;
  total: number;
  phaseLabel: string;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: MnaTab;
  onTabChange: (tab: MnaTab) => void;
}

const CHIP =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors focus-visible:outline-offset-1';

function Explainer({ title, subtitle, icon: Icon, points, strong }: {
  title: string;
  subtitle: string;
  icon: typeof BookOpen;
  points: string[];
  strong?: boolean;
}) {
  return (
    <section
      className={
        'rounded-xl border px-5 py-5 ' +
        (strong ? 'border-phase/25 bg-phase/[0.06]' : 'border-line bg-panel shadow-card')
      }
    >
      <header className="flex items-center gap-3">
        <span
          className={
            'flex h-8 w-8 items-center justify-center rounded-lg ' +
            (strong ? 'bg-phase text-onaccent' : 'bg-ink/[0.06] text-ink')
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </header>
      <BulletList items={points} className="mt-4" />
    </section>
  );
}

export function MnaStage({ stage, total, phaseLabel, prev, next, onNavigate, tab, onTabChange }: Props) {
  // A clause picked from the Essentials chips opens (and scrolls to) its card.
  const [target, setTarget] = useState<string | null>(null);
  // Bumping the version remounts the cards with every card open or closed.
  const [expand, setExpand] = useState({ open: false, version: 0 });
  const cuad = stage.clauses.filter((c) => c.provenance === 'cuad');
  const gapFills = stage.clauses.filter((c) => c.provenance === 'hand-authored');
  const idBase = `mna-${stage.id}`;

  useEffect(() => {
    if (tab !== 'clauses') {
      setTarget(null);
      return;
    }
    if (!target) return;
    document
      .getElementById(`clause-${target}`)
      ?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [tab, target]);

  const tabs: (TabDef & { id: MnaTab })[] = [
    { id: 'essentials', label: 'Essentials', icon: BookOpen },
    { id: 'documents', label: 'Documents', short: 'Docs', icon: FileText, count: stage.documents.length },
    { id: 'clauses', label: 'Clauses', icon: ScrollText, count: stage.clauses.length },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];

  const clauseCards = (list: typeof stage.clauses) =>
    list.map((c) => (
      <ClauseCard
        key={`${c.id}|${expand.version}|${target === c.id}`}
        clause={c}
        defaultOpen={expand.open || target === c.id}
      />
    ));

  return (
    <div>
      <StageHeader
        index={stage.index}
        total={total}
        phaseLabel={phaseLabel}
        title={stage.title}
        badges={
          stage.kind === 'pre-process' ? (
            <Badge title="Happens inside each side before any counterparty is involved">Internal, before the deal</Badge>
          ) : stage.kind === 'branch' ? (
            <Badge title="The deal structure is chosen here: asset purchase, stock purchase or merger">
              <GitBranch className="h-3 w-3" aria-hidden /> Structure decided here
            </Badge>
          ) : undefined
        }
      />

      <AbbrKey stage={stage} className="mt-4" />
      <Tabs className="mt-5" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as MnaTab)} />

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <Explainer
              title="In plain terms"
              subtitle="What is going on at this stage"
              icon={Handshake}
              points={stage.description.beginner}
              strong
            />
            <Explainer
              title="Practitioner's view"
              subtitle="What deal lawyers focus on"
              icon={Briefcase}
              points={stage.description.practitioner}
            />
          </div>
          {stage.clauses.length > 0 && (
            <section className="mt-8">
              <SectionTitle>Clauses to know at this stage</SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {stage.clauses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTarget(c.id);
                        onTabChange('clauses');
                      }}
                      className={`${CHIP} group border-line bg-panel text-ink shadow-card hover:border-phase/50`}
                    >
                      <span
                        aria-hidden
                        className={'h-2 w-2 rounded-full ' + (c.provenance === 'cuad' ? 'bg-blue-500' : 'bg-amber-500')}
                      />
                      {c.category}
                      <ArrowRight className="h-3 w-3 text-muted transition group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden /> from real contracts
                (CUAD) <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />{' '}
                hand-authored APA drafting
              </p>
            </section>
          )}
        </TabPanel>
      )}

      {tab === 'documents' && (
        <TabPanel idBase={idBase} id="documents">
          <SectionTitle>Documents produced at this stage</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {stage.documents.map((d) => (
              <li key={d.name} className="flex gap-3 rounded-xl border border-line bg-panel px-4 py-3 shadow-card">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-phase" aria-hidden />
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{d.name}</p>
                  {d.description && <p className="mt-0.5 text-sm text-muted">{d.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </TabPanel>
      )}

      {tab === 'clauses' && (
        <TabPanel idBase={idBase} id="clauses">
          <div className="mb-5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setTarget(null);
                setExpand((e) => ({ open: !e.open, version: e.version + 1 }));
              }}
              className={`${CHIP} border-line bg-panel text-ink hover:border-ink/30`}
            >
              {expand.open ? <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />}
              {expand.open ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {cuad.length > 0 && (
            <section>
              <SectionTitle aside={<span className="font-mono text-xs text-blue-800 dark:text-blue-300">{cuad.length}</span>}>
                From real contracts (CUAD)
              </SectionTitle>
              <div className="grid gap-3">{clauseCards(cuad)}</div>
            </section>
          )}
          {gapFills.length > 0 && (
            <section className={cuad.length > 0 ? 'mt-10' : ''}>
              <SectionTitle aside={<span className="font-mono text-xs text-amber-800 dark:text-amber-300">{gapFills.length}</span>}>
                APA-specific drafting (hand-authored)
              </SectionTitle>
              <div className="grid gap-3">{clauseCards(gapFills)}</div>
            </section>
          )}
        </TabPanel>
      )}

      {tab === 'glossary' && (
        <TabPanel idBase={idBase} id="glossary">
          <GlossaryGrid terms={stage.glossary} />
        </TabPanel>
      )}

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as MnaTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents sections={[]} topId={tabsTopId(idBase)} />
    </div>
  );
}
