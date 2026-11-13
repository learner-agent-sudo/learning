'use client';

import Link from 'next/link';
import { BANK_ACT_ANATOMY, CA_PHASES, CA_STAGES, CA_TABS, defineCaTerm, type CaPhase, type CaTab } from '@/lib/caBanking';
import { caIdBase, caOutline } from '@/lib/caBankingOutline';
import { focusStageTitle, useChecklists, useOutlineJump, useScrollTopOnChange, useStageHash, useVisited } from '@/lib/useStudyState';
import { TONES, toneVars } from '@/lib/theme';
import { CA_ABBR } from '@/lib/abbreviations';
import { AbbrProvider } from '@/components/AbbrContext';
import { GlossaryProvider } from '@/components/GlossaryContext';
import { CaBankingStage } from '@/components/ca-banking/CaBankingStage';
import { ModuleMasthead } from '@/components/ui/ModuleMasthead';
import { RailGroup, StageRail, StageStrip } from '@/components/ui/StageRail';
import { tabsTopId } from '@/components/ui/Tabs';

// Module-level so hooks get stable inputs.
const IDS = CA_STAGES.map((s) => s.id);
const TABS: string[] = [...CA_TABS];
const SIZES = Object.fromEntries(CA_STAGES.map((s) => [s.id, s.checklist.length]));
const GROUPS: RailGroup[] = (Object.entries(CA_PHASES) as [CaPhase, (typeof CA_PHASES)[CaPhase]][]).map(
  ([id, p]) => ({ id, label: p.label, tone: p.tone })
);
const PROVISIONS = CA_STAGES.reduce((n, s) => n + s.provisions.length, 0);
const CLAUSES = CA_STAGES.reduce((n, s) => n + (s.vendorKit?.terms.length ?? 0), 0);
const CHECK_TOTAL = CA_STAGES.reduce((n, s) => n + s.checklist.length, 0);
const OUTLINES = Object.fromEntries(CA_STAGES.map((s) => [s.id, caOutline(s)]));
const TABS_TOP = (id: string) => tabsTopId(caIdBase(id));

export default function CaBankingPage() {
  const { stage: selectedId, tab, ready, go } = useStageHash('ca-banking', IDS, TABS);
  const visited = useVisited('ca-banking', ready ? selectedId : null);
  const [ticks, toggle] = useChecklists('ca-banking:checklist', SIZES);
  const articleRef = useScrollTopOnChange(selectedId, ready);

  const idx = Math.max(0, IDS.indexOf(selectedId));
  const stage = CA_STAGES[idx];
  const prev = idx > 0 ? CA_STAGES[idx - 1] : null;
  const next = idx < CA_STAGES.length - 1 ? CA_STAGES[idx + 1] : null;

  const doneOf = (id: string) => (ticks[id] ?? []).filter(Boolean).length;
  const ticked = IDS.reduce((n, id) => n + doneOf(id), 0);
  const rail = CA_STAGES.map((s) => ({
    id: s.id,
    index: s.index,
    title: s.title,
    group: s.phase,
    progress: s.checklist.length ? doneOf(s.id) / s.checklist.length : undefined,
  }));
  // A stage without the tool a tab needs shows Essentials instead.
  const shownTab = (OUTLINES[stage.id].some((t) => t.id === tab) ? tab : 'essentials') as CaTab;
  const select = (id: string) => go(id);
  const jump = useOutlineJump(go, stage.id, shownTab, TABS_TOP);
  const railProps = { groups: GROUPS, stages: rail, selectedId, visited, onSelect: select, label: 'Canadian banking stages' };

  return (
    <GlossaryProvider value={defineCaTerm}>
      <AbbrProvider value={CA_ABBR}>
        <div style={toneVars('--module', TONES.brick)}>
          <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <ModuleMasthead
              kicker="Canada · Bank Act (S.C. 1991, c. 46) · OSFI"
              title="Canadian banking regulation"
              watermark="Bank Act"
              standfirst={
                <>
                  The rulebook from the seat of counsel at a <em>digital bank</em> in Canada, with the weight on its{' '}
                  <em>vendors and partners</em>: what the Bank Act and OSFI require of the contracts, and how that
                  differs from Hong Kong.
                </>
              }
              stats={[
                { value: CA_STAGES.length, label: 'stages' },
                { value: PROVISIONS, label: 'provisions & guidance' },
                { value: CLAUSES, label: 'vendor clauses' },
              ]}
              progress={{ done: ticked, total: CHECK_TOTAL, label: 'Checklist done' }}
              aboutHref="/ca-banking/about/"
            />

            <StageStrip {...railProps} />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-14">
              <aside className="hidden lg:block">
                <StageRail {...railProps} outlines={OUTLINES} tab={shownTab} onJump={jump} />
              </aside>

              <article ref={articleRef} className="min-w-0 max-w-3xl">
                <CaBankingStage
                  key={stage.id}
                  stage={stage}
                  total={CA_STAGES.length}
                  prev={prev}
                  next={next}
                  onNavigate={(id) => {
                    go(id);
                    focusStageTitle();
                  }}
                  tab={shownTab}
                  onTabChange={(t) => go(stage.id, t)}
                  onJump={(t, section) => jump(stage.id, t, section)}
                  ticks={ticks[stage.id] ?? []}
                  onToggle={(i) => toggle(stage.id, i)}
                />
              </article>
            </div>

            <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
              <span>
                Study material, not legal advice. Canada has no separate licence for a digital bank: it is a bank under
                the Bank Act that serves customers mainly through an app.
                {BANK_ACT_ANATOMY && ` Bank Act text current to ${BANK_ACT_ANATOMY.versionDate}; not the official version.`}
              </span>
              <Link href="/ca-banking/about/" className="inline-flex min-h-10 items-center underline-offset-4 hover:text-ink hover:underline">
                Sources &amp; method
              </Link>
            </footer>
          </main>
        </div>
      </AbbrProvider>
    </GlossaryProvider>
  );
}
