import type { BankingStage } from './banking';
import { essentialsSections, noteSections, tab, type OutlineTab } from './outline';

// Section anchors inside the banking tools; the components use the same ids.
export const BANK_SECTION = {
  vendorsAddendum: 'vendors-addendum',
  vendorsSaas: 'vendors-saas',
  vendorsClauses: 'vendors-clauses',
  vendorsProcess: 'vendors-process',
  matAssess: 'materiality-assess',
  matDiligence: 'materiality-diligence',
  matFriction: 'materiality-friction',
  matCondition: 'materiality-condition',
  matSources: 'materiality-sources',
  incScenario: 'incidents-scenario',
  incClocks: 'incidents-clocks',
  incCalls: 'incidents-calls',
  incPlan: 'incidents-plan',
} as const;

export const NOTE_CARDS = {
  it: { key: 'it', label: 'The IT angle' },
  vb: { key: 'digital', label: 'Digital bank specifics' },
  pitfalls: { key: 'pitfalls', label: 'Common pitfalls' },
} as const;

export const bankIdBase = (stageId: string) => `bank-${stageId}`;

/** Tabs and sections of a banking stage, in page order. */
export function bankingOutline(stage: BankingStage): OutlineTab[] {
  const idBase = bankIdBase(stage.id);
  const S = BANK_SECTION;
  const vk = stage.vendorKit;
  const mk = stage.materialityKit;
  return [
    tab('essentials', 'Essentials', essentialsSections(idBase, stage)),
    tab('provisions', 'Provisions'),
    ...(vk
      ? [
          tab('vendors', 'Vendors', [
            ...(vk.addendum ? [{ id: S.vendorsAddendum, label: 'Main agreement or banking addendum' }] : []),
            ...(vk.saasMatrix ? [{ id: S.vendorsSaas, label: 'SaaS terms against SA-2 and TM-G-1' }] : []),
            { id: S.vendorsClauses, label: 'Clauses the contract needs' },
            ...(vk.process.length ? [{ id: S.vendorsProcess, label: 'Around the contract' }] : []),
          ]),
        ]
      : []),
    ...(mk
      ? [
          tab('materiality', 'Materiality', [
            { id: S.matAssess, label: 'Assess one deployment' },
            ...(mk.dueDiligence ? [{ id: S.matDiligence, label: 'Due diligence before signing' }] : []),
            { id: S.matFriction, label: 'Why procurement feels the friction' },
            { id: S.matCondition, label: 'Signing before the HKMA discussion ends' },
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
    ...(stage.activityKit ? [tab('activities', 'Activities')] : []),
    tab('checklist', 'Checklist'),
    tab(
      'notes',
      'Notes',
      noteSections(idBase, [
        { ...NOTE_CARDS.it, items: stage.itAngle },
        { ...NOTE_CARDS.vb, items: stage.virtualBankNotes },
        { ...NOTE_CARDS.pitfalls, items: stage.pitfalls },
      ])
    ),
    tab('glossary', 'Glossary'),
  ];
}
