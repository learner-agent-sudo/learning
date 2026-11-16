import type { SwStage } from './softwareIp';
import { PLACES } from './softwareIp';
import { BANK_SECTION, onboardPhaseId } from './bankingOutline';
import { essentialsSections, tab, type OutlineTab } from './outline';
import { kitLabels } from './onboardingExport';
import { FINDER_SECTION } from '@/components/software-ip/LicenceFinder';

export const SW_NOTE_CARDS = {
  eng: { key: 'engineering', label: 'The engineering angle' },
  bank: { key: 'bank', label: 'In a bank or fintech' },
  elsewhere: { key: 'elsewhere', label: 'What differs elsewhere' },
  pitfalls: { key: 'pitfalls', label: 'Common pitfalls' },
} as const;

export const swIdBase = (stageId: string) => `sw-${stageId}`;

/** The checklist tab's name, from the kit's labels. */
export const reviewTabLabel = (stage: SwStage) => stage.reviewKit?.labels?.tabLabel ?? 'Review';

/** Tabs and sections of a software IP stage, in page order. */
export function swOutline(stage: SwStage): OutlineTab[] {
  const idBase = swIdBase(stage.id);
  const S = BANK_SECTION;
  const rk = stage.reviewKit;
  const N = SW_NOTE_CARDS;
  const notes = [
    ...(stage.itAngle.length ? [{ id: `${idBase}-${N.eng.key}`, label: N.eng.label }] : []),
    ...(stage.virtualBankNotes.length ? [{ id: `${idBase}-${N.bank.key}`, label: N.bank.label }] : []),
    ...(stage.elsewhere?.length
      ? stage.elsewhere.map((e) => ({ id: `${idBase}-${N.elsewhere.key}-${e.place.toLowerCase()}`, label: PLACES[e.place] }))
      : []),
    ...(stage.pitfalls.length ? [{ id: `${idBase}-${N.pitfalls.key}`, label: N.pitfalls.label }] : []),
  ];
  return [
    tab('essentials', 'Essentials', essentialsSections(idBase, stage)),
    tab('provisions', 'Provisions'),
    ...(stage.licenceKit
      ? [
          tab('finder', 'Licence finder', [
            { id: FINDER_SECTION.pick, label: 'Pick the licence and the use' },
            { id: FINDER_SECTION.duties, label: 'What the licence asks' },
            { id: FINDER_SECTION.combine, label: 'Combining two licences' },
            { id: FINDER_SECTION.table, label: 'The pairs in the table' },
          ]),
        ]
      : []),
    ...(rk
      ? [
          tab('review', reviewTabLabel(stage), [
            { id: S.onboardProfile, label: kitLabels(rk).profileTitle },
            { id: S.onboardDocuments, label: kitLabels(rk).documentsTitle },
            ...rk.phases.map((p, i) => ({ id: onboardPhaseId(p.id), label: `${i + 1}. ${p.title}` })),
          ]),
        ]
      : []),
    tab('checklist', 'Checklist'),
    tab('notes', 'Notes', notes),
    tab('glossary', 'Glossary'),
  ];
}
