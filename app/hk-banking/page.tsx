'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BANKING_STAGES,
  BANKING_STAGE_BY_ID,
  BankingPhase,
  CAP155_ANATOMY,
  DEPTH_LABELS,
  PHASES,
  defineBankingTerm,
} from '@/lib/banking';
import type { Depth } from '@/lib/workflow';
import { DiagramStage, WorkflowDiagram } from '@/components/WorkflowDiagram';
import { DepthToggle } from '@/components/DepthToggle';
import { GlossaryProvider } from '@/components/GlossaryContext';
import { BankingStagePanel } from '@/components/banking/BankingStagePanel';

const ALL_IDS = new Set(BANKING_STAGES.map((s) => s.id));

// Module-level so the diagram does not re-render on every state change.
const classOf = (s: DiagramStage) => BANKING_STAGE_BY_ID[s.id].phase;
const CLASS_DEFS = Object.fromEntries(
  (Object.entries(PHASES) as [BankingPhase, (typeof PHASES)[BankingPhase]][]).map(([phase, p]) => [
    phase,
    `fill:${p.fill},stroke:${p.stroke},color:#0f172a`,
  ])
);

export default function HkBankingPage() {
  const [depth, setDepth] = useState<Depth>('beginner');
  const [selectedId, setSelectedId] = useState<string>(BANKING_STAGES[0].id);

  const idx = BANKING_STAGES.findIndex((s) => s.id === selectedId);
  const selected = BANKING_STAGES[idx];
  const prev = idx > 0 ? BANKING_STAGES[idx - 1] : null;
  const next = idx < BANKING_STAGES.length - 1 ? BANKING_STAGES[idx + 1] : null;

  return (
    <GlossaryProvider value={defineBankingTerm}>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <Link href="/" className="text-xs text-muted hover:text-ink hover:underline">
              ← All topics
            </Link>
            <h1 className="text-xl font-semibold sm:text-2xl">HK banking regulation</h1>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              The Banking Ordinance and HKMA rulebook, from the seat of counsel at a digital bank.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DepthToggle depth={depth} onChange={setDepth} labels={DEPTH_LABELS} />
            <Link href="/hk-banking/about/" className="text-sm text-muted hover:text-ink hover:underline">
              About
            </Link>
          </div>
        </header>

        <p className="mt-4 rounded-md border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm leading-relaxed">
          Start at <strong>Regulatory map</strong> and work down. <strong>Orientation</strong> gives the big
          picture; <strong>Counsel</strong> shows how the rules bite in practice. Statute cards carry the official
          text{CAP155_ANATOMY ? ` (Banking Ordinance as at ${CAP155_ANATOMY.versionDate})` : ''}. &ldquo;Digital
          bank&rdquo; is the HKMA&apos;s term since 25 October 2024 for what were called virtual banks.
        </p>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section>
            <WorkflowDiagram
              stages={BANKING_STAGES}
              selectedStageId={selectedId}
              enabledStageIds={ALL_IDS}
              onSelectStage={setSelectedId}
              classOf={classOf}
              classDefs={CLASS_DEFS}
              label="HK banking regulation learning path"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
              {Object.values(PHASES).map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm border"
                    style={{ background: p.fill, borderColor: p.stroke }}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          </section>

          <section>
            <BankingStagePanel
              stage={selected}
              depth={depth}
              prev={prev}
              next={next}
              onNavigate={setSelectedId}
            />
          </section>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-muted">
          Study material — not legal advice. Verify against the official sources before relying on it.{' '}
          <Link href="/hk-banking/about/" className="hover:underline">
            Sources &amp; method
          </Link>
          .
        </footer>
      </main>
    </GlossaryProvider>
  );
}
