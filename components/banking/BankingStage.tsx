import {
  BookOpen,
  BookText,
  ClipboardCheck,
  Check,
  Cpu,
  Lightbulb,
  ListChecks,
  Rocket,
  Scale,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { BankingStage as Stage, BankingTab, CAP155_ANATOMY, PHASES, statuteExtract } from '@/lib/banking';
import { toneVars } from '@/lib/theme';
import { ActAnatomy } from '../ui/ActAnatomy';
import { KeyPoints, SectionedPoints, SectionTitle, sectionId } from '../ui/Bullets';
import { Checklist } from '../ui/Checklist';
import { DraftNotice } from '../ui/DraftNotice';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { NoteCard } from '../ui/NoteCard';
import { PageContents, type PageSection } from '../ui/PageContents';
import { PrevNext } from '../ui/PrevNext';
import { ProvisionList } from '../ui/ProvisionList';
import { SectionVisual } from '../ui/SectionVisual';
import { AbbrKey } from '../ui/AbbrKey';
import { Badge, StageHeader } from '../ui/StageHeader';
import { NextTab, TabPanel, Tabs, tabsTopId, type TabDef } from '../ui/Tabs';
import { ActivityKit } from './ActivityKit';
import { VendorKit } from './VendorKit';

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: BankingTab;
  onTabChange: (tab: BankingTab) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

export function BankingStage({ stage, total, prev, next, onNavigate, tab, onTabChange, ticks, onToggle }: Props) {
  const phase = PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.virtualBankNotes.length + stage.pitfalls.length;

  const tabs: (TabDef & { id: BankingTab })[] = [
    { id: 'essentials', label: 'Essentials', short: stage.vendorKit || stage.activityKit ? 'Basics' : undefined, icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    ...(stage.vendorKit
      ? [{ id: 'vendors' as const, label: 'Vendors', icon: ClipboardCheck, count: stage.vendorKit.terms.length }]
      : []),
    ...(stage.activityKit
      ? [{ id: 'activities' as const, label: 'Activities', short: 'Can we?', icon: Rocket, count: stage.activityKit.activities.length }]
      : []),
    { id: 'checklist', label: 'Checklist', icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];
  const idBase = `bank-${stage.id}`;
  const sections: PageSection[] =
    tab === 'essentials'
      ? [
          { id: `${idBase}-key`, label: 'In 30 seconds' },
          ...(stage.conceptMap ? [{ id: `${idBase}-map`, label: 'How it fits together' }] : []),
          ...stage.deepDive.map((d, i) => ({ id: sectionId(idBase, i), label: d.heading, mark: `§${i + 1}` })),
        ]
      : [];

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
      <Tabs className="mt-5" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as BankingTab)} />

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          {stage.review === 'draft' && <DraftNotice regulator="HKMA" />}
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
          {stage.id === 'map' && <ActAnatomy anatomy={CAP155_ANATOMY} name="Banking Ordinance" />}
        </TabPanel>
      )}

      {tab === 'provisions' && (
        <TabPanel idBase={idBase} id="provisions">
          <ProvisionList
            provisions={stage.provisions}
            lookup={statuteExtract}
            note="Statute cards include the official text. HKMA guidance is summarised in our own words, with a link to the source."
          />
        </TabPanel>
      )}

      {tab === 'vendors' && stage.vendorKit && (
        <TabPanel idBase={idBase} id="vendors">
          <VendorKit kit={stage.vendorKit} />
        </TabPanel>
      )}

      {tab === 'activities' && stage.activityKit && (
        <TabPanel idBase={idBase} id="activities">
          <ActivityKit kit={stage.activityKit} />
        </TabPanel>
      )}

      {tab === 'checklist' && (
        <TabPanel idBase={idBase} id="checklist">
          <Checklist items={stage.checklist} ticks={ticks} onToggle={onToggle} />
        </TabPanel>
      )}

      {tab === 'notes' && (
        <TabPanel idBase={idBase} id="notes">
          <div className="grid gap-5">
            <NoteCard title="The IT angle" subtitle="Where law meets the stack" icon={Cpu} tone="sky" items={stage.itAngle} />
            <NoteCard
              title="Digital bank specifics"
              subtitle="What changes for a bank without branches"
              icon={Smartphone}
              tone="violet"
              items={stage.virtualBankNotes}
            />
            <NoteCard
              title="Common pitfalls"
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

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as BankingTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents sections={sections} topId={tabsTopId(idBase)} />
    </div>
  );
}
