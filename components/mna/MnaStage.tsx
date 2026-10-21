'use client';

import { useState } from 'react';
import { BookOpen, BookText, Briefcase, FileText, GitBranch, Handshake, ScrollText } from 'lucide-react';
import type { Stage } from '@/lib/workflow';
import { ClauseCard } from '../ClauseCard';
import { BulletList, SectionTitle } from '../ui/Bullets';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { PrevNext } from '../ui/PrevNext';
import { Badge, StageHeader } from '../ui/StageHeader';
import { TabPanel, Tabs, type TabDef } from '../ui/Tabs';

interface Props {
  stage: Stage;
  total: number;
  phaseLabel: string;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
}

type TabId = 'essentials' | 'documents' | 'clauses' | 'glossary';

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
            (strong ? 'bg-phase text-white' : 'bg-ink/[0.06] text-ink')
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

export function MnaStage({ stage, total, phaseLabel, prev, next, onNavigate }: Props) {
  const [tab, setTab] = useState<TabId>('essentials');
  const cuad = stage.clauses.filter((c) => c.provenance === 'cuad');
  const gapFills = stage.clauses.filter((c) => c.provenance === 'hand-authored');
  const idBase = `mna-${stage.id}`;

  const tabs: (TabDef & { id: TabId })[] = [
    { id: 'essentials', label: 'Essentials', icon: BookOpen },
    { id: 'documents', label: 'Documents', icon: FileText, count: stage.documents.length },
    { id: 'clauses', label: 'Clauses', icon: ScrollText, count: stage.clauses.length },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];

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

      <div className="mt-8">
        <Tabs idBase={idBase} tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          <div className="grid gap-5 xl:grid-cols-2">
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
          {cuad.length > 0 && (
            <section>
              <SectionTitle aside={<span className="font-mono text-xs text-blue-700">{cuad.length}</span>}>
                From real contracts (CUAD)
              </SectionTitle>
              <div className="grid gap-3">
                {cuad.map((c) => (
                  <ClauseCard key={c.id} clause={c} />
                ))}
              </div>
            </section>
          )}
          {gapFills.length > 0 && (
            <section className={cuad.length > 0 ? 'mt-10' : ''}>
              <SectionTitle aside={<span className="font-mono text-xs text-amber-700">{gapFills.length}</span>}>
                APA-specific drafting (hand-authored)
              </SectionTitle>
              <div className="grid gap-3">
                {gapFills.map((c) => (
                  <ClauseCard key={c.id} clause={c} />
                ))}
              </div>
            </section>
          )}
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
