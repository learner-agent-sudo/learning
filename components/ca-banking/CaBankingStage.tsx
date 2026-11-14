'use client';

import {
  AlarmClock,
  BookOpen,
  BookText,
  ClipboardCheck,
  ClipboardList,
  Check,
  Gauge,
  Cpu,
  Lightbulb,
  ListChecks,
  Scale,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import {
  BANK_ACT_ANATOMY, CA_PHASES, CA_STRENGTH_TITLES, caExtract, type CaBankingStage as Stage, type CaTab,
} from '@/lib/caBanking';
import { CA_NOTE_CARDS as NOTE_CARDS, caIdBase, caOutline } from '@/lib/caBankingOutline';
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
import { IncidentClocks } from '../banking/IncidentClocks';
import { MaterialityTool } from '../banking/MaterialityTool';
import { OnboardingKit } from '../banking/OnboardingKit';
import { BankingModuleProvider } from '../banking/ModuleContext';
import { StatuteLookupProvider } from '../banking/Sources';
import { VendorKit } from '../banking/VendorKit';

// The banking tools keep their state under this volume's prefix and explain
// legal force in Canadian terms.
const MODULE = { storage: 'ca-banking', strengthTitles: CA_STRENGTH_TITLES };

interface Props {
  stage: Stage;
  total: number;
  prev: Stage | null;
  next: Stage | null;
  onNavigate: (id: string) => void;
  tab: CaTab;
  onTabChange: (tab: CaTab) => void;
  // Move to a tab, or a section in it, from the contents sheet.
  onJump: (tab: CaTab, section?: string) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

export function CaBankingStage({ stage, total, prev, next, onNavigate, tab, onTabChange, onJump, ticks, onToggle }: Props) {
  const phase = CA_PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.virtualBankNotes.length + stage.pitfalls.length;

  // The Technology stage carries two extra tools, so its tab labels shorten.
  const crowded = !!(stage.materialityKit || stage.incidentKit);
  const tabs: (TabDef & { id: CaTab })[] = [
    { id: 'essentials', label: 'Essentials', short: stage.vendorKit || stage.activityKit ? 'Basics' : undefined, icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    ...(stage.onboardingKit ? [{ id: 'onboarding' as const, label: 'New IT vendor', short: 'Onboard', icon: ClipboardList }] : []),
    ...(stage.vendorKit
      ? [{ id: 'vendors' as const, label: 'Vendors', icon: ClipboardCheck, count: stage.vendorKit.terms.length }]
      : []),
    ...(stage.materialityKit ? [{ id: 'materiality' as const, label: 'Risk & criticality', short: 'Assess', icon: Gauge }] : []),
    ...(stage.incidentKit ? [{ id: 'incidents' as const, label: 'Incidents', short: 'Clocks', icon: AlarmClock }] : []),
    { id: 'checklist', label: 'Checklist', short: crowded ? 'Tasks' : undefined, icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', short: crowded ? 'Terms' : undefined, icon: BookText, count: stage.glossary.length },
  ];
  const idBase = caIdBase(stage.id);
  const outline = caOutline(stage);
  const sections = outline.find((t) => t.id === tab)?.sections ?? [];

  return (
    <BankingModuleProvider value={MODULE}>
    <StatuteLookupProvider value={caExtract}>
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
      <Tabs className="mt-5" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as CaTab)} />

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          {stage.review === 'draft' && <DraftNotice regulator="OSFI and agency" />}
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
          {stage.id === 'map' && <ActAnatomy anatomy={BANK_ACT_ANATOMY} name="Bank Act" />}
        </TabPanel>
      )}

      {tab === 'provisions' && (
        <TabPanel idBase={idBase} id="provisions">
          <ProvisionList
            provisions={stage.provisions}
            lookup={caExtract}
            note="Statute cards include the text of the Act or regulation from the Justice Laws Website. OSFI and other regulators' guidance is summarised in our own words, with a link to the source."
          />
        </TabPanel>
      )}

      {tab === 'onboarding' && stage.onboardingKit && (
        <TabPanel idBase={idBase} id="onboarding">
          <OnboardingKit
            kit={stage.onboardingKit}
            terms={stage.vendorKit?.terms ?? []}
            addendum={stage.vendorKit?.addendum}
            onGo={(t, section) => onJump(t as CaTab, section)}
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

      {tab === 'checklist' && (
        <TabPanel idBase={idBase} id="checklist">
          <Checklist
            items={stage.checklist}
            ticks={ticks}
            onToggle={onToggle}
            notesKey={`ca-banking:checklist-notes:${stage.id}`}
            title={`Canadian banking: ${stage.index}. ${stage.title}`}
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

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as CaTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents
        sections={sections}
        topId={tabsTopId(idBase)}
        outline={{ tabs: outline, current: tab, onJump: (t, section) => onJump(t as CaTab, section) }}
      />
    </div>
    </StatuteLookupProvider>
    </BankingModuleProvider>
  );
}
