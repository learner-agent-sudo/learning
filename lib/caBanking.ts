import stagesJson from '@/data/ca-banking/stages.json';
import extractsJson from '@/data/ca-banking/statute-extracts.json';
import type { BankingStage, Strength } from './banking';
import type { CapAnatomy, Provision, StatuteExtract } from './statute';
import { TONES, type Tone } from './theme';

export type CaPhase = 'orientation' | 'entry' | 'vendors' | 'operate' | 'oversight';

// Same shape as an HK banking stage; `virtualBankNotes` holds the digital-bank notes.
export type CaBankingStage = Omit<BankingStage, 'phase'> & { phase: CaPhase };

export const CA_STAGES = stagesJson as unknown as CaBankingStage[];

const EXTRACTS = extractsJson.extracts as Record<string, StatuteExtract>;

export const BANK_ACT_ANATOMY = extractsJson.anatomy as CapAnatomy | null;

export function caExtract(p: Pick<Provision, 'cap' | 'section'>): StatuteExtract | undefined {
  return p.cap && p.section ? EXTRACTS[`${p.cap}|${p.section}`] : undefined;
}

const TERMS: Record<string, string> = {};
for (const stage of CA_STAGES) {
  for (const g of stage.glossary) TERMS[g.term.toLowerCase()] ??= g.definition;
}

export function defineCaTerm(term: string): string | undefined {
  return TERMS[term.toLowerCase()];
}

export const CA_PHASES: Record<CaPhase, { label: string; tone: Tone }> = {
  orientation: { label: 'Orientation', tone: TONES.blue },
  entry: { label: 'Getting chartered', tone: TONES.violet },
  vendors: { label: 'Vendors & third parties', tone: TONES.amber },
  operate: { label: 'Running the bank', tone: TONES.green },
  oversight: { label: 'Oversight & stress', tone: TONES.plum },
};

// Tabs of a stage view, in order; the first is the default (no hash suffix).
export const CA_TABS = ['essentials', 'provisions', 'onboarding', 'vendors', 'materiality', 'incidents', 'checklist', 'notes', 'glossary'] as const;
export type CaTab = (typeof CA_TABS)[number];

// How the legal force of a Canadian source differs from the HK wording.
export const CA_STRENGTH_TITLES: Partial<Record<Strength, string>> = {
  statute: 'An Act of Parliament or a regulation (including a CDIC by-law): binding, with legal consequences for breach',
  'industry-code':
    'Voluntary code of conduct or public commitment: a bank must publish those it adopts (Bank Act s.627.66), and breaching one is wrongdoing under the whistleblowing rules (s.979.1)',
  proposal: 'Bill, draft guidance for consultation, or an Act passed but not yet in force: check its status',
};
