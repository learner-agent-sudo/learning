import { deeperLinks, type InsuranceStage } from './insurance';
import { essentialsSections, noteSections, tab, type OutlineTab } from './outline';

export const INS_NOTE_CARDS = {
  it: { key: 'it', label: 'The IT angle' },
  bank: { key: 'bank', label: 'When the seller is a bank' },
  pitfalls: { key: 'pitfalls', label: 'Common pitfalls' },
} as const;

export const insIdBase = (stageId: string) => `ins-${stageId}`;

/** Tabs and sections of an insurance stage, in page order. */
export function insuranceOutline(stage: InsuranceStage): OutlineTab[] {
  const idBase = insIdBase(stage.id);
  const deeper = deeperLinks(stage);
  return [
    tab(
      'essentials',
      'Essentials',
      essentialsSections(idBase, stage, deeper.length ? [{ id: `${idBase}-deeper`, label: 'Go deeper' }] : [])
    ),
    tab('provisions', 'Provisions'),
    ...(stage.activityKit
      ? [
          tab('launch', 'Launch kit', [
            { id: `${idBase}-launch-route`, label: 'The legal route to launch' },
            ...(stage.activityKit.workplan?.length ? [{ id: `${idBase}-launch-workplan`, label: "Legal's workplan" }] : []),
            { id: `${idBase}-launch-cards`, label: 'Can the bank do it?' },
          ]),
        ]
      : []),
    tab('checklist', 'Checklist'),
    tab(
      'notes',
      'Notes',
      noteSections(idBase, [
        { ...INS_NOTE_CARDS.it, items: stage.itAngle },
        { ...INS_NOTE_CARDS.bank, items: stage.bankNotes },
        { ...INS_NOTE_CARDS.pitfalls, items: stage.pitfalls },
      ])
    ),
    tab('glossary', 'Glossary'),
  ];
}
