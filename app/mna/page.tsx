'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { STAGES, STAGE_BY_ID, Depth, DealType } from '@/lib/workflow';
import { WorkflowDiagram } from '@/components/WorkflowDiagram';
import { StagePanel } from '@/components/StagePanel';
import { DepthToggle } from '@/components/DepthToggle';
import { DealTypeSelector } from '@/components/DealTypeSelector';

export default function Page() {
  const [depth, setDepth] = useState<Depth>('beginner');
  const [dealType, setDealType] = useState<DealType>('apa');
  const [selectedStageId, setSelectedStageId] = useState<string | null>('strategy');

  const enabledStageIds = useMemo(
    () => new Set(STAGES.filter((s) => s.dealTypes.includes(dealType)).map((s) => s.id)),
    [dealType]
  );

  const stages = useMemo(
    () => STAGES.filter((s) => s.dealTypes.includes(dealType)),
    [dealType]
  );

  const selected = selectedStageId ? STAGE_BY_ID[selectedStageId] : null;
  const selectedIdx = selected ? stages.findIndex((s) => s.id === selected.id) : -1;
  const prevStage = selectedIdx > 0 ? stages[selectedIdx - 1] : null;
  const nextStage = selectedIdx >= 0 && selectedIdx < stages.length - 1
    ? stages[selectedIdx + 1]
    : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="text-xs text-muted hover:text-ink hover:underline">
            ← All topics
          </Link>
          <h1 className="text-xl font-semibold sm:text-2xl">Learning M&amp;A</h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Interactive walkthrough of a U.S. private-company Asset Purchase Agreement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DealTypeSelector dealType={dealType} onChange={setDealType} />
          <DepthToggle depth={depth} onChange={setDepth} />
          <Link
            href="/mna/about/"
            className="text-sm text-muted hover:text-ink hover:underline"
          >
            About
          </Link>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section>
          <WorkflowDiagram
            stages={stages}
            selectedStageId={selectedStageId}
            enabledStageIds={enabledStageIds}
            onSelectStage={setSelectedStageId}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#93c5fd] bg-[#eff6ff]" />
              Pre-deal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#fcd34d] bg-[#fffbeb]" />
              Active deal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#6ee7b7] bg-[#ecfdf5]" />
              Post-deal
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Click any stage for documents, clauses, and glossary. SPA and
            Merger paths are coming soon — APA is the only complete deal
            type in v1.
          </p>
        </section>

        <section>
          {selected ? (
            <StagePanel
              stage={selected}
              depth={depth}
              prev={prevStage}
              next={nextStage}
              onNavigate={setSelectedStageId}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-muted">
              Click a stage in the diagram to open its details.
            </div>
          )}
        </section>
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-muted">
        Educational visualizer — not legal advice.{' '}
        <Link href="/mna/about/" className="hover:underline">
          Sources &amp; disclaimer
        </Link>
        .
      </footer>
    </main>
  );
}
