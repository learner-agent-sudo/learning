'use client';

import Link from 'next/link';
import { defineSwTerm, SW_PHASES, SW_STAGES, SW_TABS, USC17_ANATOMY, type SwPhase, type SwTab } from '@/lib/softwareIp';
import { swIdBase, swOutline } from '@/lib/softwareIpOutline';
import { focusStageTitle, useChecklists, useOutlineJump, useScrollTopOnChange, useStageHash, useVisited } from '@/lib/useStudyState';
import { TONES, toneVars } from '@/lib/theme';
import { SW_ABBR } from '@/lib/abbreviations';
import { AbbrProvider } from '@/components/AbbrContext';
import { GlossaryProvider } from '@/components/GlossaryContext';
import { SwStage } from '@/components/software-ip/SwStage';
import { ModuleMasthead } from '@/components/ui/ModuleMasthead';
import { RailGroup, StageRail, StageStrip } from '@/components/ui/StageRail';
import { tabsTopId } from '@/components/ui/Tabs';

// Module-level so hooks get stable inputs.
const IDS = SW_STAGES.map((s) => s.id);
const TABS: string[] = [...SW_TABS];
const SIZES = Object.fromEntries(SW_STAGES.map((s) => [s.id, s.checklist.length]));
const GROUPS: RailGroup[] = (Object.entries(SW_PHASES) as [SwPhase, (typeof SW_PHASES)[SwPhase]][]).map(
  ([id, p]) => ({ id, label: p.label, tone: p.tone })
);
const PROVISIONS = SW_STAGES.reduce((n, s) => n + s.provisions.length, 0);
const LICENCES = SW_STAGES.reduce((n, s) => n + (s.licenceKit?.licences.length ?? 0), 0);
const CHECK_TOTAL = SW_STAGES.reduce((n, s) => n + s.checklist.length, 0);
const OUTLINES = Object.fromEntries(SW_STAGES.map((s) => [s.id, swOutline(s)]));
const TABS_TOP = (id: string) => tabsTopId(swIdBase(id));

export default function SoftwareIpPage() {
  const { stage: selectedId, tab, ready, go } = useStageHash('software-ip', IDS, TABS);
  const visited = useVisited('software-ip', ready ? selectedId : null);
  const [ticks, toggle] = useChecklists('software-ip:checklist', SIZES);
  const articleRef = useScrollTopOnChange(selectedId, ready);

  const idx = Math.max(0, IDS.indexOf(selectedId));
  const stage = SW_STAGES[idx];
  const prev = idx > 0 ? SW_STAGES[idx - 1] : null;
  const next = idx < SW_STAGES.length - 1 ? SW_STAGES[idx + 1] : null;

  const doneOf = (id: string) => (ticks[id] ?? []).filter(Boolean).length;
  const ticked = IDS.reduce((n, id) => n + doneOf(id), 0);
  const rail = SW_STAGES.map((s) => ({
    id: s.id,
    index: s.index,
    title: s.title,
    group: s.phase,
    progress: s.checklist.length ? doneOf(s.id) / s.checklist.length : undefined,
  }));
  // A stage without the tool a tab needs shows Essentials instead.
  const shownTab = (OUTLINES[stage.id].some((t) => t.id === tab) ? tab : 'essentials') as SwTab;
  const select = (id: string) => go(id);
  const jump = useOutlineJump(go, stage.id, shownTab, TABS_TOP);
  const railProps = { groups: GROUPS, stages: rail, selectedId, visited, onSelect: select, label: 'Software IP stages' };

  return (
    <GlossaryProvider value={defineSwTerm}>
      <AbbrProvider value={SW_ABBR}>
        <div style={toneVars('--module', TONES.amber)}>
          <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <ModuleMasthead
              kicker="United States · copyright, patents, trade secrets · open source"
              title="Open source & software IP"
              watermark="17 U.S.C."
              standfirst={
                <>
                  Who owns the bank's code, what an <em>open source licence</em> asks of it, and how to use, release,
                  buy and defend software, from the seat of counsel at a <em>bank or fintech</em>, with notes on the EU,
                  the UK, Hong Kong and Canada.
                </>
              }
              stats={[
                { value: SW_STAGES.length, label: 'stages' },
                { value: PROVISIONS, label: 'provisions, licences & cases' },
                { value: LICENCES, label: 'licences in the finder' },
              ]}
              progress={{ done: ticked, total: CHECK_TOTAL, label: 'Checklist done' }}
              aboutHref="/software-ip/about/"
            />

            <StageStrip {...railProps} />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-14">
              <aside className="hidden lg:block">
                <StageRail {...railProps} outlines={OUTLINES} tab={shownTab} onJump={jump} />
              </aside>

              <article ref={articleRef} className="min-w-0 max-w-3xl">
                <SwStage
                  key={stage.id}
                  stage={stage}
                  total={SW_STAGES.length}
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
                Study material, not legal advice. US federal law with state examples; other places are noted, not covered.
                {USC17_ANATOMY && ` U.S. Code text from GovInfo's annual edition, current through ${USC17_ANATOMY.versionDate}; not the official version.`}
              </span>
              <Link href="/software-ip/about/" className="inline-flex min-h-10 items-center underline-offset-4 hover:text-ink hover:underline">
                Sources &amp; method
              </Link>
            </footer>
          </main>
        </div>
      </AbbrProvider>
    </GlossaryProvider>
  );
}
