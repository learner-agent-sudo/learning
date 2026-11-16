import stagesJson from '@/data/software-ip/stages.json';
import extractsJson from '@/data/software-ip/statute-extracts.json';
import type { BankingStage, ContractSource, StatuteCite, Strength } from './banking';
import type { CapAnatomy, Provision, StatuteExtract } from './statute';
import { TONES, type Tone } from './theme';

export type SwPhase = 'foundations' | 'oss' | 'practice';

// Where the notes say what differs from the United States.
export type Place = 'EU' | 'UK' | 'HK' | 'CA';

export const PLACES: Record<Place, string> = {
  EU: 'European Union',
  UK: 'United Kingdom',
  HK: 'Hong Kong',
  CA: 'Canada',
};

export interface ElsewhereNote {
  place: Place;
  points: string[];
}

// How a licence family behaves, from no conditions to network copyleft.
export type LicenceFamily =
  | 'public-domain'
  | 'permissive'
  | 'weak-copyleft'
  | 'strong-copyleft'
  | 'network-copyleft'
  | 'source-available'
  | 'content';

export interface LicenceUse {
  id: string;
  label: string;
  hint?: string;
}

// What the licence asks for when the bank uses the code in one of these ways.
export interface LicenceDuty {
  uses: string[];
  text: string;
  // Licence sections behind the duty, shown in the licence's own words.
  cites?: StatuteCite[];
}

export interface Licence {
  // SPDX identifier where there is one.
  id: string;
  name: string;
  family: LicenceFamily;
  osi: boolean;
  summary: string;
  // What sets the main obligations off.
  trigger: string;
  // Patent grant, retaliation or silence.
  patent: string;
  duties: LicenceDuty[];
  watch: string[];
  sources: ContractSource[];
}

export type CompatVerdict = 'yes' | 'one-way' | 'no' | 'check';

// Can code under `a` be combined into a program distributed under `b`?
export interface CompatRow {
  a: string;
  b: string;
  verdict: CompatVerdict;
  note: string;
}

export interface LicenceKit {
  intro: string[];
  uses: LicenceUse[];
  families: { id: LicenceFamily; label: string; blurb: string }[];
  licences: Licence[];
  compat: CompatRow[];
  caveat: string;
}

// Same shape as a banking stage; `itAngle` holds the engineering angle and
// `virtualBankNotes` the notes for a bank or fintech.
export type SwStage = Omit<BankingStage, 'phase'> & {
  phase: SwPhase;
  elsewhere?: ElsewhereNote[];
  licenceKit?: LicenceKit;
};

export const SW_STAGES = stagesJson as unknown as SwStage[];

const EXTRACTS = extractsJson.extracts as Record<string, StatuteExtract>;

export const USC17_ANATOMY = extractsJson.anatomy as CapAnatomy | null;

export function swExtract(p: Pick<Provision, 'cap' | 'section'>): StatuteExtract | undefined {
  return p.cap && p.section ? EXTRACTS[`${p.cap}|${p.section}`] : undefined;
}

const TERMS: Record<string, string> = {};
for (const stage of SW_STAGES) {
  for (const g of stage.glossary) TERMS[g.term.toLowerCase()] ??= g.definition;
}

export function defineSwTerm(term: string): string | undefined {
  return TERMS[term.toLowerCase()];
}

export const SW_PHASES: Record<SwPhase, { label: string; tone: Tone }> = {
  foundations: { label: 'Software IP', tone: TONES.blue },
  oss: { label: 'Open source licences', tone: TONES.green },
  practice: { label: 'In practice', tone: TONES.violet },
};

// Tabs of a stage view, in order; the first is the default (no hash suffix).
export const SW_TABS = ['essentials', 'provisions', 'finder', 'review', 'checklist', 'notes', 'glossary'] as const;
export type SwTab = (typeof SW_TABS)[number];

// How the legal force of a US source is explained.
export const SW_STRENGTH_TITLES: Partial<Record<Strength, string>> = {
  statute: 'An Act of Congress, a federal regulation or a state statute: binding, with remedies or penalties for breach',
  'case-law': 'A court judgment: binding on the points it decides in that court’s jurisdiction, subject to appeal and later cases',
  'agency-guidance':
    'Guidance or a report from a US agency (Copyright Office, USPTO, NIST, CISA, OMB, the bank regulators): how the agency applies the law, not law in itself',
  'industry-code':
    'A standard or industry framework (SPDX, OpenChain, PCI DSS, the NTIA minimum elements): voluntary unless a contract, a rule or a card scheme adopts it',
  proposal: 'A bill, proposed rule, draft guidance or pending case: not settled, so check its current status',
};

export const VERDICT: Record<CompatVerdict, { label: string; tone: string }> = {
  yes: { label: 'Can combine', tone: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200' },
  'one-way': { label: 'One way only', tone: 'bg-sky-50 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200' },
  check: { label: 'Check the facts', tone: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200' },
  no: { label: 'Cannot combine', tone: 'bg-rose-50 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200' },
};
