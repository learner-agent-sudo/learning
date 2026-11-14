import type { CaBankingStage } from './caBanking';
import { BANK_SECTION, onboardPhaseId } from './bankingOutline';
import { essentialsSections, noteSections, tab, type OutlineTab } from './outline';

export const CA_NOTE_CARDS = {
  it: { key: 'it', label: 'The IT angle' },
  vb: { key: 'digital', label: 'Digital bank specifics' },
  pitfalls: { key: 'pitfalls', label: 'Common pitfalls' },
} as const;

export const caIdBase = (stageId: string) => `ca-${stageId}`;

/** Tabs and sections of a Canadian banking stage, in page order. */
export function caOutline(stage: CaBankingStage): OutlineTab[] {
  const idBase = caIdBase(stage.id);
  const S = BANK_SECTION;
  const vk = stage.vendorKit;
  const mk = stage.materialityKit;
  const ok = stage.onboardingKit;
  return [
    tab('essentials', 'Essentials', essentialsSections(idBase, stage)),
    tab('provisions', 'Provisions'),
    ...(ok
      ? [
          tab('onboarding', 'New IT vendor', [
            { id: S.onboardProfile, label: 'Describe the deal' },
            { id: S.onboardDocuments, label: 'The document set' },
            ...ok.phases.map((p, i) => ({ id: onboardPhaseId(p.id), label: `${i + 1}. ${p.title}` })),
          ]),
        ]
      : []),
    ...(vk
      ? [
          tab('vendors', 'Vendors', [
            ...(vk.crosswalk ? [{ id: S.vendorsCrosswalk, label: 'From the Hong Kong kit to Canada' }] : []),
            ...(vk.addendum ? [{ id: S.vendorsAddendum, label: 'Main agreement or banking addendum' }] : []),
            ...(vk.saasMatrix ? [{ id: S.vendorsSaas, label: vk.labels?.saasTitle ?? 'SaaS terms' }] : []),
            { id: S.vendorsClauses, label: 'Clauses the contract needs' },
            ...(vk.process.length ? [{ id: S.vendorsProcess, label: 'Around the contract' }] : []),
          ]),
        ]
      : []),
    ...(mk
      ? [
          tab('materiality', 'Risk & criticality', [
            { id: S.matAssess, label: 'Assess one arrangement' },
            ...(mk.dueDiligence ? [{ id: S.matDiligence, label: 'Due diligence before signing' }] : []),
            { id: S.matFriction, label: 'Why procurement feels the friction' },
            { id: S.matCondition, label: mk.labels?.conditionTitle ?? 'Signing early' },
            { id: S.matSources, label: 'Sources' },
          ]),
        ]
      : []),
    ...(stage.incidentKit
      ? [
          tab('incidents', 'Incidents', [
            { id: S.incScenario, label: 'The scenario' },
            { id: S.incClocks, label: 'The clocks' },
            { id: S.incCalls, label: 'Who gets called, in order' },
            { id: S.incPlan, label: 'Points to settle in the incident plan' },
          ]),
        ]
      : []),
    tab('checklist', 'Checklist'),
    tab(
      'notes',
      'Notes',
      noteSections(idBase, [
        { ...CA_NOTE_CARDS.it, items: stage.itAngle },
        { ...CA_NOTE_CARDS.vb, items: stage.virtualBankNotes },
        { ...CA_NOTE_CARDS.pitfalls, items: stage.pitfalls },
      ])
    ),
    tab('glossary', 'Glossary'),
  ];
}
