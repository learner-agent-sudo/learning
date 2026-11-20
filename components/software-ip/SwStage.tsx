'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  BookText,
  Check,
  ClipboardList,
  Cpu,
  Globe2,
  Landmark,
  Lightbulb,
  ListChecks,
  MapPin,
  Scale,
  SearchCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { PLACES, SW_PHASES, SW_STRENGTH_TITLES, swExtract, USC17_ANATOMY, type SwStage as Stage, type SwTab } from '@/lib/softwareIp';
import { reviewTabLabel, SW_NOTE_CARDS as NOTE_CARDS, swIdBase, swOutline } from '@/lib/softwareIpOutline';
import { toneVars } from '@/lib/theme';
import { loadSettings, SEEN_EVENT } from '@/lib/seen';
import { checklistUnitId, headUnitId, provisionUnitId, SW_MODULE, swUnits } from '@/lib/swUnits';
import { DESK_QUESTIONS } from '@/lib/desk';
import { ReadingAsk } from '../desk/ReadingAsk';
import { SeenTracker } from '../ui/SeenTracker';
import { RichText } from '../RichText';
import { ActAnatomy } from '../ui/ActAnatomy';
import { KeyPoints, SectionedPoints, SectionTitle } from '../ui/Bullets';
import { Checklist } from '../ui/Checklist';
import { DraftNotice } from '../ui/DraftNotice';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { NoteCard } from '../ui/NoteCard';
import { PageContents } from '../ui/PageContents';
import { PrevNext } from '../ui/PrevNext';
import { ProvisionList } from '../ui/ProvisionList';
import { SectionVisual } from '../ui/SectionVisual';
import { AbbrKey } from '../ui/AbbrKey';
import { Badge, StageHeader } from '../ui/StageHeader';
import { NextTab, TabPanel, Tabs, tabsTopId, type TabDef } from '../ui/Tabs';
import { OnboardingKit } from '../banking/OnboardingKit';
import { BankingModuleProvider } from '../banking/ModuleContext';
import { StatuteLookupProvider } from '../banking/Sources';
import { HongKongTab } from './HongKongTab';
import { LicenceFinder } from './LicenceFinder';

// The shared tools keep their state under this volume's prefix and explain
// legal force in US terms.
const MODULE = { storage: 'software-ip', strengthTitles: SW_STRENGTH_TITLES };
const DESK_HREF = '/software-ip/desk/';

/** "Questions while reading" (off unless the reader turns it on on the Desk). */
function useReadingQuestions(stageId: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(loadSettings(SW_MODULE).reading);
    read();
    window.addEventListener(SEEN_EVENT, read);
    return () => window.removeEventListener(SEEN_EVENT, read);
  }, []);
  return useMemo(
    () => (on ? DESK_QUESTIONS.filter((q) => q.stage === stageId && q.primes && q.colleague) : []),
    [on, stageId]
  );
}

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: SwTab;
  onTabChange: (tab: SwTab) => void;
  onJump: (tab: SwTab, section?: string) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

/** "the EU, the UK and Canada": the places a stage's notes cover, in order. */
function placeList(names: string[]): string {
  const short = names.map((n) => (n === 'European Union' ? 'the EU' : n === 'United Kingdom' ? 'the UK' : n));
  return short.length > 1 ? `${short.slice(0, -1).join(', ')} and ${short[short.length - 1]}` : short[0] ?? '';
}

/** What differs in the EU, the UK and Canada (Hong Kong has its own tab), one block per place. */
function Elsewhere({ stage, idBase }: { stage: Stage; idBase: string }) {
  if (!stage.elsewhere?.length) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-teal-200 dark:border-teal-400/30">
      <div className="flex items-center gap-3 bg-teal-50 px-4 py-3 text-teal-900 dark:bg-teal-400/10 dark:text-teal-100">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-white">
          <Globe2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-[15px] font-semibold leading-tight">{NOTE_CARDS.elsewhere.label}</h3>
          <p className="text-xs opacity-80">Where {placeList(stage.elsewhere.map((e) => PLACES[e.place]))} part from US law</p>
        </div>
      </div>
      <div className="divide-y divide-line bg-panel">
        {stage.elsewhere.map((e) => (
          <div key={e.place} id={`${idBase}-${NOTE_CARDS.elsewhere.key}-${e.place.toLowerCase()}`} className="scroll-mt-28 px-4 py-3.5">
            <p className="kicker mb-1.5 text-teal-800 dark:text-teal-300">{PLACES[e.place]}</p>
            <ul className="space-y-2 text-[14.5px] leading-relaxed text-ink/85">
              {e.points.map((p, i) => (
                <li key={i} className="relative pl-4">
                  <span className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rotate-45 bg-teal-500" aria-hidden />
                  <RichText text={p} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SwStage({ stage, total, prev, next, onNavigate, tab, onTabChange, onJump, ticks, onToggle }: Props) {
  const phase = SW_PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount =
    stage.itAngle.length + stage.virtualBankNotes.length + (stage.productNotes?.length ?? 0) + stage.pitfalls.length +
    (stage.elsewhere ?? []).reduce((n, e) => n + e.points.length, 0);
  const tool = !!(stage.licenceKit || stage.reviewKit);
  const tabs: (TabDef & { id: SwTab })[] = [
    { id: 'essentials', label: 'Essentials', short: tool ? 'Basics' : undefined, icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    ...(stage.hongKong
      ? [{ id: 'hongkong' as const, label: 'Hong Kong', short: 'HK', icon: MapPin, count: stage.hongKong.provisions.length }]
      : []),
    ...(stage.licenceKit
      ? [{ id: 'finder' as const, label: 'Licence finder', short: 'Finder', icon: SearchCheck, count: stage.licenceKit.licences.length }]
      : []),
    ...(stage.reviewKit
      ? [{
          id: 'review' as const,
          label: reviewTabLabel(stage),
          short: stage.reviewKit.labels?.tabShort,
          icon: ClipboardList,
          count: stage.reviewKit.items.length,
        }]
      : []),
    { id: 'checklist', label: 'Checklist', short: tool ? 'Tasks' : undefined, icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', short: tool ? 'Terms' : undefined, icon: BookText, count: stage.glossary.length },
  ];
  const idBase = swIdBase(stage.id);
  const outline = swOutline(stage);
  const units = useMemo(() => swUnits(stage).filter((u) => u.tab === tab), [stage, tab]);
  const asks = useReadingQuestions(stage.id);
  const askFor = (unit: string) =>
    asks.filter((q) => q.primes === unit).map((q) => <ReadingAsk key={q.id} q={q} deskHref={DESK_HREF} />);
  const sections = outline.find((t) => t.id === tab)?.sections ?? [];

  return (
    <BankingModuleProvider value={MODULE}>
      <StatuteLookupProvider value={swExtract}>
        <div style={toneVars('--phase', phase.tone)}>
          <SeenTracker module={SW_MODULE} units={units} />
          <div id={headUnitId(stage.id)}>
          <StageHeader
            index={stage.index}
            total={total}
            phaseLabel={phase.label}
            title={stage.title}
            standfirst={stage.oneLiner}
            badges={
              stage.review === 'draft' ? (
                <Badge tone="warn" title="See the note under Essentials">
                  <TriangleAlert className="h-3 w-3" aria-hidden /> Fact-check pending
                </Badge>
              ) : (
                <Badge title="Dates, references and figures independently checked">
                  <Check className="h-3 w-3" aria-hidden /> Fact-checked
                </Badge>
              )
            }
          />
          </div>

          <AbbrKey stage={stage} className="mt-4" />
          <Tabs className="mt-5" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as SwTab)} />

          {tab === 'essentials' && (
            <TabPanel idBase={idBase} id="essentials">
              {stage.review === 'draft' && <DraftNotice what="case citations, agency guidance" />}
              {askFor(`${idBase}-key`)}
              <KeyPoints id={`${idBase}-key`} title="In 30 seconds" points={stage.keyPoints} />
              {stage.conceptMap && (
                <section id={`${idBase}-map`} className="mt-8">
                  <SectionTitle>How it fits together</SectionTitle>
                  <SectionVisual visual={stage.conceptMap} />
                </section>
              )}
              <div className="mt-10">
                <SectionTitle>In depth · how it bites in practice</SectionTitle>
                <SectionedPoints sections={stage.deepDive} idPrefix={idBase} before={(i) => askFor(`${idBase}-s${i + 1}`)} />
              </div>
              {stage.id === 'copyright' && <ActAnatomy anatomy={USC17_ANATOMY} name="Title 17 (as cited here)" />}
            </TabPanel>
          )}

          {tab === 'provisions' && (
            <TabPanel idBase={idBase} id="provisions">
              <ProvisionList
                provisions={stage.provisions}
                lookup={swExtract}
                idOf={(p) => provisionUnitId(stage.id, p)}
                note="Statute cards include the text of the U.S. Code (GovInfo's annual edition) or the state code; licence cards include the licence text from the SPDX License List. Agency guidance and cases are summarised in our own words, with a link where there is one."
              />
            </TabPanel>
          )}

          {tab === 'hongkong' && stage.hongKong && (
            <TabPanel idBase={idBase} id="hongkong">
              <HongKongTab stageId={stage.id} idBase={idBase} hk={stage.hongKong} askFor={askFor} />
            </TabPanel>
          )}

          {tab === 'finder' && stage.licenceKit && (
            <TabPanel idBase={idBase} id="finder">
              <LicenceFinder kit={stage.licenceKit} />
            </TabPanel>
          )}

          {tab === 'review' && stage.reviewKit && (
            <TabPanel idBase={idBase} id="review">
              <OnboardingKit kit={stage.reviewKit} terms={[]} onGo={(t, section) => onJump(t as SwTab, section)} />
            </TabPanel>
          )}

          {tab === 'checklist' && (
            <TabPanel idBase={idBase} id="checklist">
              <div id={checklistUnitId(stage.id)}>
              <Checklist
                items={stage.checklist}
                ticks={ticks}
                onToggle={onToggle}
                notesKey={`software-ip:checklist-notes:${stage.id}`}
                title={`Open source & software IP: ${stage.index}. ${stage.title}`}
              />
              </div>
            </TabPanel>
          )}

          {tab === 'notes' && (
            <TabPanel idBase={idBase} id="notes">
              <div className="grid gap-5">
                <NoteCard
                  id={`${idBase}-${NOTE_CARDS.eng.key}`}
                  title={NOTE_CARDS.eng.label}
                  subtitle="Where the law meets repositories, pipelines and app stores"
                  icon={Cpu}
                  tone="sky"
                  items={stage.itAngle}
                />
                <NoteCard
                  id={`${idBase}-${NOTE_CARDS.bank.key}`}
                  title={NOTE_CARDS.bank.label}
                  subtitle="What the bank regulators and a bank's own risks add"
                  icon={Landmark}
                  tone="violet"
                  items={stage.virtualBankNotes}
                />
                <NoteCard
                  id={`${idBase}-${NOTE_CARDS.product.key}`}
                  title={NOTE_CARDS.product.label}
                  subtitle="What to ask and tell product managers, designers and marketing"
                  icon={Users}
                  tone="amber"
                  items={stage.productNotes ?? []}
                />
                <Elsewhere stage={stage} idBase={idBase} />
                <NoteCard
                  id={`${idBase}-${NOTE_CARDS.pitfalls.key}`}
                  title={NOTE_CARDS.pitfalls.label}
                  subtitle="Where banks and their counsel get caught"
                  icon={TriangleAlert}
                  tone="rose"
                  items={stage.pitfalls}
                />
              </div>
            </TabPanel>
          )}

          {tab === 'glossary' && (
            <TabPanel idBase={idBase} id="glossary">
              <GlossaryGrid terms={stage.glossary} />
            </TabPanel>
          )}

          <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as SwTab)} />
          <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
          <PageContents
            sections={sections}
            topId={tabsTopId(idBase)}
            outline={{ tabs: outline, current: tab, onJump: (t, section) => onJump(t as SwTab, section) }}
          />
        </div>
      </StatuteLookupProvider>
    </BankingModuleProvider>
  );
}
