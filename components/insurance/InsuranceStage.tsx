import { BookOpen, BookText, Check, Cpu, Landmark, Lightbulb, ListChecks, Rocket, Scale, TriangleAlert } from 'lucide-react';
import {
  CAP41_ANATOMY,
  INSURANCE_PHASES,
  InsuranceStage as Stage,
  InsuranceTab,
  deeperLinks,
  insuranceExtract,
} from '@/lib/insurance';
import { INS_NOTE_CARDS, insIdBase, insuranceOutline } from '@/lib/insuranceOutline';
import { toneVars } from '@/lib/theme';
import { ActivityKit } from '../banking/ActivityKit';
import { StatuteLookupProvider } from '../banking/Sources';
import { ActAnatomy } from '../ui/ActAnatomy';
import { KeyPoints, SectionedPoints, SectionTitle } from '../ui/Bullets';
import { Checklist } from '../ui/Checklist';
import { DraftNotice } from '../ui/DraftNotice';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { GoDeeper } from '../ui/GoDeeper';
import { NoteCard } from '../ui/NoteCard';
import { PageContents } from '../ui/PageContents';
import { PrevNext } from '../ui/PrevNext';
import { ProvisionList } from '../ui/ProvisionList';
import { SectionVisual } from '../ui/SectionVisual';
import { AbbrKey } from '../ui/AbbrKey';
import { Badge, StageHeader } from '../ui/StageHeader';
import { NextTab, TabPanel, Tabs, tabsTopId, type TabDef } from '../ui/Tabs';

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: InsuranceTab;
  onTabChange: (tab: InsuranceTab) => void;
  // Move to a tab, or a section in it, from the contents sheet.
  onJump: (tab: InsuranceTab, section?: string) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

export function InsuranceStage({ stage, total, prev, next, onNavigate, tab, onTabChange, onJump, ticks, onToggle }: Props) {
  const phase = INSURANCE_PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.bankNotes.length + stage.pitfalls.length;

  const tabs: (TabDef & { id: InsuranceTab })[] = [
    { id: 'essentials', label: 'Essentials', icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    ...(stage.activityKit
      ? [{ id: 'launch' as const, label: 'Launch kit', short: 'Launch', icon: Rocket, count: stage.activityKit.activities.length }]
      : []),
    { id: 'checklist', label: 'Checklist', icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];
  const idBase = insIdBase(stage.id);
  const deeper = deeperLinks(stage);
  const outline = insuranceOutline(stage);
  const sections = outline.find((t) => t.id === tab)?.sections ?? [];

  return (
    <div style={toneVars('--phase', phase.tone)}>
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

      <AbbrKey stage={stage} className="mt-4" />
      <Tabs className="mt-5" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as InsuranceTab)} />

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          {stage.review === 'draft' && <DraftNotice regulator="IA, HKMA and SFC" />}
          <KeyPoints id={`${idBase}-key`} title="In 30 seconds" points={stage.keyPoints} />
          {stage.conceptMap && (
            <section id={`${idBase}-map`} className="mt-8">
              <SectionTitle>How it fits together</SectionTitle>
              <SectionVisual visual={stage.conceptMap} />
            </section>
          )}
          <div className="mt-10">
            <SectionTitle>In depth · how it bites in practice</SectionTitle>
            <SectionedPoints sections={stage.deepDive} idPrefix={idBase} />
          </div>
          <GoDeeper links={deeper} id={`${idBase}-deeper`} />
          {stage.id === 'map' && <ActAnatomy anatomy={CAP41_ANATOMY} name="Insurance Ordinance" />}
        </TabPanel>
      )}

      {tab === 'provisions' && (
        <TabPanel idBase={idBase} id="provisions">
          <ProvisionList
            provisions={stage.provisions}
            lookup={insuranceExtract}
            note="Statute cards include the official text. IA, HKMA and SFC material is summarised in our own words, with a link to the source where we have one."
          />
        </TabPanel>
      )}

      {tab === 'launch' && stage.activityKit && (
        <TabPanel idBase={idBase} id="launch">
          <StatuteLookupProvider value={insuranceExtract}>
            <ActivityKit
              kit={stage.activityKit}
              storage="hk-insurance"
              title={stage.title.split(":")[0]}
              idBase={`${idBase}-launch`}
              routeTitle="The legal route to launch"
              searchHint="e.g. broker, referral, ILAS, premium financing"
            />
          </StatuteLookupProvider>
        </TabPanel>
      )}

      {tab === 'checklist' && (
        <TabPanel idBase={idBase} id="checklist">
          <Checklist
            items={stage.checklist}
            ticks={ticks}
            onToggle={onToggle}
            notesKey={`hk-insurance:checklist-notes:${stage.id}`}
            title={`HK insurance: ${stage.index}. ${stage.title}`}
          />
        </TabPanel>
      )}

      {tab === 'notes' && (
        <TabPanel idBase={idBase} id="notes">
          <div className="grid gap-5">
            <NoteCard
              id={`${idBase}-${INS_NOTE_CARDS.it.key}`}
              title={INS_NOTE_CARDS.it.label}
              subtitle="Where law meets the stack"
              icon={Cpu}
              tone="sky"
              items={stage.itAngle}
            />
            <NoteCard
              id={`${idBase}-${INS_NOTE_CARDS.bank.key}`}
              title={INS_NOTE_CARDS.bank.label}
              subtitle="What changes when a bank is the intermediary"
              icon={Landmark}
              tone="violet"
              items={stage.bankNotes}
            />
            <NoteCard
              id={`${idBase}-${INS_NOTE_CARDS.pitfalls.key}`}
              title={INS_NOTE_CARDS.pitfalls.label}
              subtitle="Where firms and their counsel get caught"
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

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as InsuranceTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents
        sections={sections}
        topId={tabsTopId(idBase)}
        outline={{ tabs: outline, current: tab, onJump: (t, section) => onJump(t as InsuranceTab, section) }}
      />
    </div>
  );
}
