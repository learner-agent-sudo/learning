'use client';

import Link from 'next/link';
import {
  CAP41_ANATOMY,
  INSURANCE_PHASES,
  INSURANCE_STAGES,
  INSURANCE_TABS,
  InsurancePhase,
  InsuranceTab,
  defineInsuranceTerm,
} from '@/lib/insurance';
import { focusStageTitle, useChecklists, useOutlineJump, useScrollTopOnChange, useStageHash, useVisited } from '@/lib/useStudyState';
import { insIdBase, insuranceOutline } from '@/lib/insuranceOutline';
import { TONES, toneVars } from '@/lib/theme';
import { REGULATION_ABBR } from '@/lib/abbreviations';
import { AbbrProvider } from '@/components/AbbrContext';
import { GlossaryProvider } from '@/components/GlossaryContext';
import { InsuranceStage } from '@/components/insurance/InsuranceStage';
import { ModuleMasthead } from '@/components/ui/ModuleMasthead';
import { RailGroup, StageRail, StageStrip } from '@/components/ui/StageRail';
import { tabsTopId } from '@/components/ui/Tabs';

// Module-level so hooks get stable inputs.
const IDS = INSURANCE_STAGES.map((s) => s.id);
const TABS: string[] = [...INSURANCE_TABS];
const SIZES = Object.fromEntries(INSURANCE_STAGES.map((s) => [s.id, s.checklist.length]));
const GROUPS: RailGroup[] = (
  Object.entries(INSURANCE_PHASES) as [InsurancePhase, (typeof INSURANCE_PHASES)[InsurancePhase]][]
).map(([id, p]) => ({ id, label: p.label, tone: p.tone }));
const PROVISIONS = INSURANCE_STAGES.reduce((n, s) => n + s.provisions.length, 0);
const CHECK_TOTAL = INSURANCE_STAGES.reduce((n, s) => n + s.checklist.length, 0);
const OUTLINES = Object.fromEntries(INSURANCE_STAGES.map((s) => [s.id, insuranceOutline(s)]));
const TABS_TOP = (id: string) => tabsTopId(insIdBase(id));

export default function HkInsurancePage() {
  const { stage: selectedId, tab, ready, go } = useStageHash('hk-insurance', IDS, TABS);
  const visited = useVisited('hk-insurance', ready ? selectedId : null);
  const [ticks, toggle] = useChecklists('hk-insurance:checklist', SIZES);
  const articleRef = useScrollTopOnChange(selectedId, ready);

  const idx = Math.max(0, IDS.indexOf(selectedId));
  const stage = INSURANCE_STAGES[idx];
  const prev = idx > 0 ? INSURANCE_STAGES[idx - 1] : null;
  const next = idx < INSURANCE_STAGES.length - 1 ? INSURANCE_STAGES[idx + 1] : null;

  const doneOf = (id: string) => (ticks[id] ?? []).filter(Boolean).length;
  const ticked = IDS.reduce((n, id) => n + doneOf(id), 0);
  const rail = INSURANCE_STAGES.map((s) => ({
    id: s.id,
    index: s.index,
    title: s.title,
    group: s.phase,
    progress: s.checklist.length ? doneOf(s.id) / s.checklist.length : undefined,
  }));
  // A stage without a launch kit shows Essentials instead.
  const shownTab = (OUTLINES[stage.id].some((t) => t.id === tab) ? tab : 'essentials') as InsuranceTab;
  const jump = useOutlineJump(go, stage.id, shownTab, TABS_TOP);
  const railProps = { groups: GROUPS, stages: rail, selectedId, visited, onSelect: (id: string) => go(id), label: 'Insurance stages' };

  return (
    <GlossaryProvider value={defineInsuranceTerm}>
      <AbbrProvider value={REGULATION_ABBR}>
        <div style={toneVars('--module', TONES.bronze)}>
          <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <ModuleMasthead
              kicker="Hong Kong · Insurance Ordinance (Cap. 41) · IA"
              title="HK insurance regulation"
              watermark="Cap. 41"
              standfirst={
                <>
                  The Insurance Ordinance from the seat of counsel at a <em>digital bank that wants to sell insurance in
                  its app</em>: how the IA regulates insurers and intermediaries, where the HKMA comes in, and what the
                  bank must do before launch.
                </>
              }
              stats={[
                { value: INSURANCE_STAGES.length, label: 'stages' },
                { value: PROVISIONS, label: 'provisions & guidance' },
              ]}
              progress={{ done: ticked, total: CHECK_TOTAL, label: 'Checklist done' }}
              aboutHref="/hk-insurance/about/"
            />

            <StageStrip {...railProps} />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-14">
              <aside className="hidden lg:block">
                <StageRail {...railProps} outlines={OUTLINES} tab={shownTab} onJump={jump} />
              </aside>

              <article ref={articleRef} className="min-w-0 max-w-3xl">
                <InsuranceStage
                  key={stage.id}
                  stage={stage}
                  total={INSURANCE_STAGES.length}
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
                {CAP41_ANATOMY && ` Insurance Ordinance text as at ${CAP41_ANATOMY.versionDate}.`}
              </span>
              <Link href="/hk-insurance/about/" className="inline-flex min-h-10 items-center underline-offset-4 hover:text-ink hover:underline">
                Sources &amp; method
              </Link>
            </footer>
          </main>
        </div>
      </AbbrProvider>
    </GlossaryProvider>
  );
}
