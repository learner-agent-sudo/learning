import {
  AlarmClock,
  BookOpen,
  BookText,
  ClipboardCheck,
  Check,
  Gauge,
  Cpu,
  Lightbulb,
  ListChecks,
  Rocket,
  Scale,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { BankingStage as Stage, BankingTab, CAP155_ANATOMY, PHASES, statuteExtract } from '@/lib/banking';
import { NOTE_CARDS, bankIdBase, bankingOutline } from '@/lib/bankingOutline';
import { toneVars } from '@/lib/theme';
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
import { ActivityKit } from './ActivityKit';
import { IncidentClocks } from './IncidentClocks';
import { MaterialityTool } from './MaterialityTool';
import { VendorKit } from './VendorKit';

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: BankingTab;
  onTabChange: (tab: BankingTab) => void;
  // Move to a tab, or a section in it, from the contents sheet.
  onJump: (tab: BankingTab, section?: string) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

export function BankingStage({ stage, total, prev, next, onNavigate, tab, onTabChange, onJump, ticks, onToggle }: Props) {
  const phase = PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.virtualBankNotes.length + stage.pitfalls.length;

  // The Technology stage carries two extra tools, so its tab labels shorten.
  const crowded = !!(stage.materialityKit || stage.incidentKit);
  const tabs: (TabDef & { id: BankingTab })[] = [
    { id: 'essentials', label: 'Essentials', short: stage.vendorKit || stage.activityKit ? 'Basics' : undefined, icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    ...(stage.vendorKit
      ? [{ id: 'vendors' as const, label: 'Vendors', icon: ClipboardCheck, count: stage.vendorKit.terms.length }]
      : []),
    ...(stage.materialityKit ? [{ id: 'materiality' as const, label: 'Materiality', short: 'Assess', icon: Gauge }] : []),
    ...(stage.incidentKit ? [{ id: 'incidents' as const, label: 'Incidents', short: 'Clocks', icon: AlarmClock }] : []),
    ...(stage.activityKit
      ? [{ id: 'activities' as const, label: 'Activities', short: 'Can we?', icon: Rocket, count: stage.activityKit.activities.length }]
      : []),
    { id: 'checklist', label: 'Checklist', short: crowded ? 'Tasks' : undefined, icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', short: crowded ? 'Terms' : undefined, icon: BookText, count: stage.glossary.length },
  ];
  const idBase = bankIdBase(stage.id);
  const outline = bankingOutline(stage);
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
          <VendorKit kit={stage.vendorKit} stageId={stage.id} />
        </TabPanel>
      )}

      {tab === 'materiality' && stage.materialityKit && (
        <TabPanel idBase={idBase} id="materiality">
          <MaterialityTool kit={stage.materialityKit} />
        </TabPanel>
      )}

      {tab === 'incidents' && stage.incidentKit && (
        <TabPanel idBase={idBase} id="incidents">
          <IncidentClocks kit={stage.incidentKit} />
        </TabPanel>
      )}

      {tab === 'activities' && stage.activityKit && (
        <TabPanel idBase={idBase} id="activities">
          <ActivityKit kit={stage.activityKit} />
        </TabPanel>
      )}

      {tab === 'checklist' && (
        <TabPanel idBase={idBase} id="checklist">
          <Checklist
            items={stage.checklist}
            ticks={ticks}
            onToggle={onToggle}
            notesKey={`hk-banking:checklist-notes:${stage.id}`}
            title={`HK banking: ${stage.index}. ${stage.title}`}
          />
        </TabPanel>
      )}

      {tab === 'notes' && (
        <TabPanel idBase={idBase} id="notes">
          <div className="grid gap-5">
            <NoteCard
              id={`${idBase}-${NOTE_CARDS.it.key}`}
              title={NOTE_CARDS.it.label}
              subtitle="Where law meets the stack"
              icon={Cpu}
              tone="sky"
              items={stage.itAngle}
            />
            <NoteCard
              id={`${idBase}-${NOTE_CARDS.vb.key}`}
              title={NOTE_CARDS.vb.label}
              subtitle="What changes for a bank without branches"
              icon={Smartphone}
              tone="violet"
              items={stage.virtualBankNotes}
            />
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

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as BankingTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents
        sections={sections}
        topId={tabsTopId(idBase)}
        outline={{ tabs: outline, current: tab, onJump: (t, section) => onJump(t as BankingTab, section) }}
      />
    </div>
  );
}
