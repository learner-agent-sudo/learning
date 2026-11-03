'use client';

import Link from 'next/link';
import {
  CAP571_ANATOMY,
  SECURITIES_PHASES,
  SECURITIES_STAGES,
  SECURITIES_TABS,
  SecuritiesPhase,
  SecuritiesTab,
  defineSecuritiesTerm,
} from '@/lib/securities';
import { focusStageTitle, useChecklists, useOutlineJump, useScrollTopOnChange, useStageHash, useVisited } from '@/lib/useStudyState';
import { secIdBase, securitiesOutline } from '@/lib/securitiesOutline';
import { TONES, toneVars } from '@/lib/theme';
import { REGULATION_ABBR } from '@/lib/abbreviations';
import { AbbrProvider } from '@/components/AbbrContext';
import { GlossaryProvider } from '@/components/GlossaryContext';
import { SecuritiesStage } from '@/components/securities/SecuritiesStage';
import { ModuleMasthead } from '@/components/ui/ModuleMasthead';
import { RailGroup, StageRail, StageStrip } from '@/components/ui/StageRail';
import { tabsTopId } from '@/components/ui/Tabs';

// Module-level so hooks get stable inputs.
const IDS = SECURITIES_STAGES.map((s) => s.id);
const TABS: string[] = [...SECURITIES_TABS];
const SIZES = Object.fromEntries(SECURITIES_STAGES.map((s) => [s.id, s.checklist.length]));
const GROUPS: RailGroup[] = (
  Object.entries(SECURITIES_PHASES) as [SecuritiesPhase, (typeof SECURITIES_PHASES)[SecuritiesPhase]][]
).map(([id, p]) => ({ id, label: p.label, tone: p.tone }));
const PROVISIONS = SECURITIES_STAGES.reduce((n, s) => n + s.provisions.length, 0);
const CHECK_TOTAL = SECURITIES_STAGES.reduce((n, s) => n + s.checklist.length, 0);
const OUTLINES = Object.fromEntries(SECURITIES_STAGES.map((s) => [s.id, securitiesOutline(s)]));
const TABS_TOP = (id: string) => tabsTopId(secIdBase(id));

export default function HkSecuritiesPage() {
  const { stage: selectedId, tab, ready, go } = useStageHash('hk-securities', IDS, TABS);
  const visited = useVisited('hk-securities', ready ? selectedId : null);
  const [ticks, toggle] = useChecklists('hk-securities:checklist', SIZES);
  const articleRef = useScrollTopOnChange(selectedId, ready);

  const idx = Math.max(0, IDS.indexOf(selectedId));
  const stage = SECURITIES_STAGES[idx];
  const prev = idx > 0 ? SECURITIES_STAGES[idx - 1] : null;
  const next = idx < SECURITIES_STAGES.length - 1 ? SECURITIES_STAGES[idx + 1] : null;

  const doneOf = (id: string) => (ticks[id] ?? []).filter(Boolean).length;
  const ticked = IDS.reduce((n, id) => n + doneOf(id), 0);
  const rail = SECURITIES_STAGES.map((s) => ({
    id: s.id,
    index: s.index,
    title: s.title,
    group: s.phase,
    progress: s.checklist.length ? doneOf(s.id) / s.checklist.length : undefined,
  }));
  // A stage without a launch kit shows Essentials instead.
  const shownTab = (OUTLINES[stage.id].some((t) => t.id === tab) ? tab : 'essentials') as SecuritiesTab;
  const jump = useOutlineJump(go, stage.id, shownTab, TABS_TOP);
  const railProps = { groups: GROUPS, stages: rail, selectedId, visited, onSelect: (id: string) => go(id), label: 'Securities stages' };

  return (
    <GlossaryProvider value={defineSecuritiesTerm}>
      <AbbrProvider value={REGULATION_ABBR}>
        <div style={toneVars('--module', TONES.plum)}>
          <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <ModuleMasthead
              kicker="Hong Kong · Securities and Futures Ordinance (Cap. 571) · SFC"
              title="HK securities regulation"
              watermark="Cap. 571"
              standfirst={
                <>
                  The SFO from the seat of counsel at a <em>bank registered with the SFC</em>: what the law says, how
                  the SFC and the HKMA apply it, and what you do about it.
                </>
              }
              stats={[
                { value: SECURITIES_STAGES.length, label: 'stages' },
                { value: PROVISIONS, label: 'provisions & guidance' },
              ]}
              progress={{ done: ticked, total: CHECK_TOTAL, label: 'Checklist done' }}
              aboutHref="/hk-securities/about/"
            />

            <StageStrip {...railProps} />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-14">
              <aside className="hidden lg:block">
                <StageRail {...railProps} outlines={OUTLINES} tab={shownTab} onJump={jump} />
              </aside>

              <article ref={articleRef} className="min-w-0 max-w-3xl">
                <SecuritiesStage
                  key={stage.id}
                  stage={stage}
                  total={SECURITIES_STAGES.length}
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
                Study material, not legal advice.
                {CAP571_ANATOMY && ` Securities and Futures Ordinance text as at ${CAP571_ANATOMY.versionDate}.`}
              </span>
              <Link href="/hk-securities/about/" className="inline-flex min-h-10 items-center underline-offset-4 hover:text-ink hover:underline">
                Sources &amp; method
              </Link>
            </footer>
          </main>
        </div>
      </AbbrProvider>
    </GlossaryProvider>
  );
}
