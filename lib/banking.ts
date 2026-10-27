import stagesJson from '@/data/banking/stages.json';
import extractsJson from '@/data/banking/statute-extracts.json';
import type { PointSection } from '@/components/ui/Bullets';
import type { SectionVisualData } from '@/components/ui/SectionVisual';
import { TONES, type Tone } from './theme';

export type ProvisionKind =
  | 'statute'
  | 'subsidiary'
  | 'spm'
  | 'guideline'
  | 'circular'
  | 'code'
  | 'case'
  | 'other';

export interface Provision {
  kind: ProvisionKind;
  instrument: string;
  ref: string;
  title: string;
  summary: string;
  counselNote: string;
  url?: string;
  // Chapter and section for statute text lookup (e.g. "155", "16").
  cap?: string;
  section?: string;
  confidence: 'high' | 'medium' | 'low';
}

export type BankingPhase = 'orientation' | 'entry' | 'operate' | 'oversight';

export interface BankingStage {
  id: string;
  index: number;
  title: string;
  phase: BankingPhase;
  // 'draft' stages have not yet been through the independent fact-check.
  review: 'fact-checked' | 'draft';
  oneLiner: string;
  // The short version, then the detail grouped under headings.
  keyPoints: string[];
  deepDive: PointSection[];
  provisions: Provision[];
  checklist: string[];
  itAngle: string[];
  virtualBankNotes: string[];
  pitfalls: string[];
  glossary: { term: string; definition: string }[];
  // Stage-specific toolkits: vendor contracts (Technology & outsourcing) and
  // new-business activities (Digital assets).
  vendorKit?: VendorKit;
  activityKit?: ActivityKit;
}

// Legal force of a source behind a requirement, strongest first.
export type Strength =
  | 'statute'
  | 'statutory-guideline'
  | 'hkma-guidance'
  | 'sfc-guidance'
  | 'industry-code'
  | 'proposal'
  | 'good-practice';

export const STRENGTH_LABEL: Record<Strength, string> = {
  statute: 'Statute',
  'statutory-guideline': 'Statutory guideline',
  'hkma-guidance': 'HKMA guidance',
  'sfc-guidance': 'SFC guidance',
  'industry-code': 'Industry code',
  proposal: 'Proposal',
  'good-practice': 'Good practice',
};

export interface ContractSource {
  label: string;
  // Paragraph or section as printed in the source.
  ref: string;
  strength: Strength;
  note?: string;
  url?: string;
}

export interface ContractTerm {
  id: string;
  title: string;
  // Which engagements need it: all, material, personal-data, offshore,
  // critical, intragroup, agents.
  appliesTo: string[];
  summary: string;
  require: string[];
  sources: ContractSource[];
  drafting?: string[];
  cloud?: string;
  playbook?: ClausePlaybook;
}

// How hard the bank should hold the line on a clause in negotiation.
export type Stance = 'must-have' | 'expected' | 'negotiable';

export interface ClausePlaybook {
  stance: Stance;
  why: string;
  preferred: string[];
  fallback: string[];
  redLines: string[];
  // Model wording, one sub-clause per entry; [brackets] mark choices and figures.
  model: string[];
  watchFor: string[];
  pushback: { says: string; reply: string }[];
  escalate: string;
}

export interface KitPlaybook {
  intro: string[];
  definitions: { term: string; meaning: string }[];
  escalation: string[];
}

export interface VendorKit {
  intro: string[];
  lifecycle: SectionVisualData;
  terms: ContractTerm[];
  playbook?: KitPlaybook;
  process: PointSection[];
  caveat?: string;
}

export type ActivityGroup = 'crypto' | 'stablecoins' | 'tokenisation' | 'wallets' | 'lending' | 'web3';

// State of the regime that mainly governs an activity.
export type Regime = 'in-force' | 'transitional' | 'proposed' | 'pilot';

export interface Activity {
  id: string;
  title: string;
  group: ActivityGroup;
  regime: Regime;
  regulators: string[];
  summary: string;
  // Can the bank do it, and how?
  route: string;
  require: string[];
  // Conditions counsel confirms before launch.
  gates: string[];
  watchFor: string[];
  sources: ContractSource[];
}

export interface ActivityKit {
  intro: string[];
  // How to classify a new product.
  triage: SectionVisualData;
  activities: Activity[];
  caveat?: string;
}

export interface StatuteExtract {
  label: string;
  heading: string;
  capTitle: string;
  versionDate: string;
  hkelUrl: string;
  part?: string;
  text?: string;
  truncated?: boolean;
}

export interface CapAnatomy {
  cap: string;
  title: string;
  versionDate: string;
  hkelUrl: string;
  parts: { num: string; heading: string; range: string }[];
  schedules: { num: string; heading: string }[];
}

export const BANKING_STAGES = stagesJson as BankingStage[];

export const BANKING_STAGE_BY_ID: Record<string, BankingStage> = Object.fromEntries(
  BANKING_STAGES.map((s) => [s.id, s])
);

const EXTRACTS = extractsJson.extracts as Record<string, StatuteExtract>;

export const CAP155_ANATOMY = extractsJson.anatomy as CapAnatomy | null;

export function statuteExtract(p: Provision): StatuteExtract | undefined {
  return p.cap && p.section ? EXTRACTS[`${p.cap}|${p.section}`] : undefined;
}

const TERMS: Record<string, string> = {};
for (const stage of BANKING_STAGES) {
  for (const g of stage.glossary) TERMS[g.term.toLowerCase()] ??= g.definition;
}

export function defineBankingTerm(term: string): string | undefined {
  return TERMS[term.toLowerCase()];
}

export const PHASES: Record<BankingPhase, { label: string; tone: Tone }> = {
  orientation: { label: 'Orientation', tone: TONES.blue },
  entry: { label: 'Getting licensed', tone: TONES.violet },
  operate: { label: 'Running the bank', tone: TONES.green },
  oversight: { label: 'Oversight & stress', tone: TONES.brick },
};

// Tabs of a stage view, in order; the first is the default (no hash suffix).
export const BANKING_TABS = ['essentials', 'provisions', 'vendors', 'activities', 'checklist', 'notes', 'glossary'] as const;
export type BankingTab = (typeof BANKING_TABS)[number];
