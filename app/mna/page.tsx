'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DealType, MNA_TABS, MnaTab, STAGES } from '@/lib/workflow';
import { focusStageTitle, useScrollTopOnChange, useStageHash, useVisited } from '@/lib/useStudyState';
import { DealTypeSelector } from '@/components/DealTypeSelector';
import { MnaStage } from '@/components/mna/MnaStage';
import { ModuleMasthead } from '@/components/ui/ModuleMasthead';
import { RailGroup, StageRail, StageStrip } from '@/components/ui/StageRail';

const IDS = STAGES.map((s) => s.id);
const TABS: string[] = [...MNA_TABS];

// Colours are RGB channels chosen for at least 4.5:1 contrast on the paper
// background, on their own 10% tint, and for white text on them.
const GROUPS: RailGroup[] = [
  { id: 'pre', label: 'Pre-deal', color: '52 87 140' },
  { id: 'active', label: 'Active deal', color: '134 88 18' },
  { id: 'post', label: 'Post-signing', color: '26 104 78' },
];

function groupOf(index: number): string {
  if (index <= 3) return 'pre';
  if (index <= 6) return 'active';
  return 'post';
}

const NOTES: Record<string, string> = {
  'pre-process': 'Internal',
  branch: 'Structure chosen',
};

const CLAUSES = STAGES.reduce((n, s) => n + s.clauses.length, 0);
const TERMS = STAGES.reduce((n, s) => n + s.glossary.length, 0);

export default function Page() {
  const [dealType, setDealType] = useState<DealType>('apa');
  const { stage: selectedId, tab, ready, go } = useStageHash('mna', IDS, TABS);
  const visited = useVisited('mna', ready ? selectedId : null);
  const articleRef = useScrollTopOnChange(selectedId, ready);

  const stages = useMemo(() => STAGES.filter((s) => s.dealTypes.includes(dealType)), [dealType]);
  const idx = Math.max(0, stages.findIndex((s) => s.id === selectedId));
  const stage = stages[idx];
  const prev = idx > 0 ? stages[idx - 1] : null;
  const next = idx < stages.length - 1 ? stages[idx + 1] : null;
  const group = GROUPS.find((g) => g.id === groupOf(stage.index))!;
  const opened = stages.filter((s) => visited.has(s.id)).length;

  const rail = stages.map((s) => ({
    id: s.id,
    index: s.index,
    title: s.title,
    group: groupOf(s.index),
    note: NOTES[s.kind],
  }));
  const select = (id: string) => go(id);
  const railProps = { groups: GROUPS, stages: rail, selectedId: stage.id, visited, onSelect: select, label: 'Deal stages' };

  return (
    <div style={{ '--module': '36 64 107' } as React.CSSProperties}>
      <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <ModuleMasthead
          kicker="U.S. private company · Asset Purchase Agreement"
          title="Learning M&A"
          watermark="APA"
          standfirst="A deal from first strategy memo to post-closing true-up, with the documents, real contract clauses and jargon at each stage."
          stats={[
            { value: stages.length, label: 'stages' },
            { value: CLAUSES, label: 'clauses' },
            { value: TERMS, label: 'glossary terms' },
            { value: `${opened}/${stages.length}`, label: 'stages opened' },
          ]}
          controls={<DealTypeSelector dealType={dealType} onChange={setDealType} />}
          aboutHref="/mna/about/"
        />

        <StageStrip {...railProps} />

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-14">
          <aside className="hidden lg:block">
            <StageRail {...railProps} />
          </aside>

          <article
            ref={articleRef}
            className="min-w-0 max-w-4xl"
            style={{ '--phase': group.color } as React.CSSProperties}
          >
            <MnaStage
              key={stage.id}
              stage={stage}
              total={stages.length}
              phaseLabel={group.label}
              prev={prev}
              next={next}
              onNavigate={(id) => {
                go(id);
                focusStageTitle();
              }}
              tab={tab as MnaTab}
              onTabChange={(t) => go(stage.id, t)}
            />
          </article>
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
          <span>Educational visualiser, not legal advice. SPA and merger paths are coming; APA is complete.</span>
          <Link href="/mna/about/" className="inline-flex min-h-10 items-center underline-offset-4 hover:text-ink hover:underline">
            Sources &amp; disclaimer
          </Link>
        </footer>
      </main>
    </div>
  );
}
