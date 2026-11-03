import { deeperLinks, type SecuritiesStage } from './securities';
import { essentialsSections, noteSections, tab, type OutlineTab } from './outline';

export const SEC_NOTE_CARDS = {
  it: { key: 'it', label: 'The IT angle' },
  bank: { key: 'bank', label: 'When the firm is a bank' },
  pitfalls: { key: 'pitfalls', label: 'Common pitfalls' },
} as const;

export const secIdBase = (stageId: string) => `sec-${stageId}`;

/** Tabs and sections of a securities stage, in page order. */
export function securitiesOutline(stage: SecuritiesStage): OutlineTab[] {
  const idBase = secIdBase(stage.id);
  const deeper = deeperLinks(stage);
  return [
    tab(
      'essentials',
      'Essentials',
      essentialsSections(idBase, stage, deeper.length ? [{ id: `${idBase}-deeper`, label: 'Go deeper' }] : [])
    ),
    tab('provisions', 'Provisions'),
    tab('checklist', 'Checklist'),
    tab(
      'notes',
      'Notes',
      noteSections(idBase, [
        { ...SEC_NOTE_CARDS.it, items: stage.itAngle },
        { ...SEC_NOTE_CARDS.bank, items: stage.bankNotes },
        { ...SEC_NOTE_CARDS.pitfalls, items: stage.pitfalls },
      ])
    ),
    tab('glossary', 'Glossary'),
  ];
}
