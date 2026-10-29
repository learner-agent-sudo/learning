import { BookOpen, BookText, Check, Cpu, Landmark, Lightbulb, ListChecks, Scale, TriangleAlert } from 'lucide-react';
import {
  CAP571_ANATOMY,
  SECURITIES_PHASES,
  SecuritiesStage as Stage,
  SecuritiesTab,
  deeperLinks,
  sfoExtract,
} from '@/lib/securities';
import { toneVars } from '@/lib/theme';
import { ActAnatomy } from '../ui/ActAnatomy';
import { KeyPoints, SectionedPoints, SectionTitle, sectionId } from '../ui/Bullets';
import { Checklist } from '../ui/Checklist';
import { DraftNotice } from '../ui/DraftNotice';
import { GlossaryGrid } from '../ui/GlossaryGrid';
import { GoDeeper } from '../ui/GoDeeper';
import { NoteCard } from '../ui/NoteCard';
import { PageContents, type PageSection } from '../ui/PageContents';
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
  tab: SecuritiesTab;
  onTabChange: (tab: SecuritiesTab) => void;
  ticks: boolean[];
  onToggle: (i: number) => void;
}

export function SecuritiesStage({ stage, total, prev, next, onNavigate, tab, onTabChange, ticks, onToggle }: Props) {
  const phase = SECURITIES_PHASES[stage.phase];
  const done = ticks.filter(Boolean).length;
  const noteCount = stage.itAngle.length + stage.bankNotes.length + stage.pitfalls.length;

  const tabs: (TabDef & { id: SecuritiesTab })[] = [
    { id: 'essentials', label: 'Essentials', icon: BookOpen },
    { id: 'provisions', label: 'Provisions', short: 'Law', icon: Scale, count: stage.provisions.length },
    { id: 'checklist', label: 'Checklist', icon: ListChecks, count: `${done}/${stage.checklist.length}` },
    { id: 'notes', label: 'Notes', icon: Lightbulb, count: noteCount },
    { id: 'glossary', label: 'Glossary', icon: BookText, count: stage.glossary.length },
  ];
  const idBase = `sec-${stage.id}`;
  const deeper = deeperLinks(stage);
  const sections: PageSection[] =
    tab === 'essentials'
      ? [
          { id: `${idBase}-key`, label: 'In 30 seconds' },
          ...(stage.conceptMap ? [{ id: `${idBase}-map`, label: 'How it fits together' }] : []),
          ...stage.deepDive.map((d, i) => ({ id: sectionId(idBase, i), label: d.heading, mark: `§${i + 1}` })),
          ...(deeper.length ? [{ id: `${idBase}-deeper`, label: 'Go deeper' }] : []),
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
      <Tabs className="mt-5" idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as SecuritiesTab)} />

      {tab === 'essentials' && (
        <TabPanel idBase={idBase} id="essentials">
          {stage.review === 'draft' && <DraftNotice regulator="SFC and HKMA" />}
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
          {stage.id === 'map' && <ActAnatomy anatomy={CAP571_ANATOMY} name="Securities and Futures Ordinance" />}
        </TabPanel>
      )}

      {tab === 'provisions' && (
        <TabPanel idBase={idBase} id="provisions">
          <ProvisionList
            provisions={stage.provisions}
            lookup={sfoExtract}
            note="Statute cards include the official text. SFC, HKMA and HKEX material is summarised in our own words, with a link to the source where we have one."
          />
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
              title="When the firm is a bank"
              subtitle="What changes for a registered institution"
              icon={Landmark}
              tone="violet"
              items={stage.bankNotes}
            />
            <NoteCard
              title="Common pitfalls"
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

      <NextTab idBase={idBase} tabs={tabs} active={tab} onChange={(id) => onTabChange(id as SecuritiesTab)} />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <PageContents sections={sections} topId={tabsTopId(idBase)} />
    </div>
  );
}
