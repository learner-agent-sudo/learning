'use client';

import Link from 'next/link';
import { BANKING_STAGES, BankingPhase, CAP155_ANATOMY, PHASES, defineBankingTerm } from '@/lib/banking';
import { useChecklists, useScrollTopOnChange, useStageHash, useVisited } from '@/lib/useStudyState';
import { GlossaryProvider } from '@/components/GlossaryContext';
import { BankingStage } from '@/components/banking/BankingStage';
import { ModuleMasthead } from '@/components/ui/ModuleMasthead';
import { RailGroup, StageRail, StageStrip } from '@/components/ui/StageRail';

// Module-level so hooks get stable inputs.
const IDS = BANKING_STAGES.map((s) => s.id);
const SIZES = Object.fromEntries(BANKING_STAGES.map((s) => [s.id, s.checklist.length]));
const GROUPS: RailGroup[] = (Object.entries(PHASES) as [BankingPhase, (typeof PHASES)[BankingPhase]][]).map(
  ([id, p]) => ({ id, label: p.label, color: p.color })
);
const PROVISIONS = BANKING_STAGES.reduce((n, s) => n + s.provisions.length, 0);
const CHECK_TOTAL = BANKING_STAGES.reduce((n, s) => n + s.checklist.length, 0);

export default function HkBankingPage() {
  const [selectedId, select] = useStageHash(IDS, IDS[0]);
  const visited = useVisited('hk-banking', selectedId);
  const [ticks, toggle] = useChecklists('hk-banking:checklist', SIZES);
  const articleRef = useScrollTopOnChange(selectedId);

  const idx = Math.max(0, IDS.indexOf(selectedId));
  const stage = BANKING_STAGES[idx];
  const prev = idx > 0 ? BANKING_STAGES[idx - 1] : null;
  const next = idx < BANKING_STAGES.length - 1 ? BANKING_STAGES[idx + 1] : null;

  const doneOf = (id: string) => (ticks[id] ?? []).filter(Boolean).length;
  const ticked = IDS.reduce((n, id) => n + doneOf(id), 0);
  const rail = BANKING_STAGES.map((s) => ({
    id: s.id,
    index: s.index,
    title: s.title,
    group: s.phase,
    progress: s.checklist.length ? doneOf(s.id) / s.checklist.length : undefined,
  }));
  const railProps = { groups: GROUPS, stages: rail, selectedId, visited, onSelect: select, label: 'Banking stages' };

  return (
    <GlossaryProvider value={defineBankingTerm}>
      <div style={{ '--module': '30 82 68' } as React.CSSProperties}>
        <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <ModuleMasthead
            kicker="Hong Kong · Banking Ordinance (Cap. 155) · HKMA"
            title="HK banking regulation"
            watermark="Cap. 155"
            standfirst={
              <>
                The rulebook from the seat of counsel at a <em>digital bank</em>: what the law says, how the HKMA
                applies it, and what you do about it.
              </>
            }
            stats={[
              { value: BANKING_STAGES.length, label: 'stages' },
              { value: PROVISIONS, label: 'provisions & guidance' },
            ]}
            progress={{ done: ticked, total: CHECK_TOTAL, label: 'Checklist done' }}
            aboutHref="/hk-banking/about/"
          />

          <StageStrip {...railProps} />

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-14">
            <aside className="hidden lg:block">
              <StageRail {...railProps} />
            </aside>

            <article ref={articleRef} className="min-w-0 max-w-3xl scroll-mt-20 lg:scroll-mt-6">
              <BankingStage
                key={stage.id}
                stage={stage}
                total={BANKING_STAGES.length}
                prev={prev}
                next={next}
                onNavigate={select}
                ticks={ticks[stage.id] ?? []}
                onToggle={(i) => toggle(stage.id, i)}
              />
            </article>
          </div>

          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
            <span>
              Study material, not legal advice. &ldquo;Digital bank&rdquo; is the HKMA&apos;s term since 25 October
              2024 for what were called virtual banks.
              {CAP155_ANATOMY && ` Banking Ordinance text as at ${CAP155_ANATOMY.versionDate}.`}
            </span>
            <Link href="/hk-banking/about/" className="underline-offset-4 hover:text-ink hover:underline">
              Sources &amp; method
            </Link>
          </footer>
        </main>
      </div>
    </GlossaryProvider>
  );
}
