import stagesJson from '@/data/banking/stages.json';
import extractsJson from '@/data/banking/statute-extracts.json';
import type { PointSection } from '@/components/ui/Bullets';
import type { SectionVisualData } from '@/components/ui/SectionVisual';
import type { CapAnatomy, Provision, StatuteExtract } from './statute';
import { TONES, type Tone } from './theme';

export type { CapAnatomy, Provision, ProvisionKind, StatuteExtract } from './statute';

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
  // How the stage's main actors and rules relate, as a concept map.
  conceptMap?: SectionVisualData;
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
  // Technology & outsourcing: is a deployment material outsourcing, and who
  // is notified, by when, when a vendor has an incident.
  materialityKit?: MaterialityKit;
  incidentKit?: IncidentKit;
}

// Legal force of a source behind a requirement, strongest first.
export type Strength =
  | 'statute'
  | 'case-law'
  | 'statutory-guideline'
  | 'hkma-guidance'
  | 'sfc-guidance'
  | 'industry-code'
  | 'proposal'
  | 'good-practice';

export const STRENGTH_LABEL: Record<Strength, string> = {
  statute: 'Statute',
  'case-law': 'Case law',
  'statutory-guideline': 'Statutory guideline',
  'hkma-guidance': 'HKMA guidance',
  'sfc-guidance': 'SFC guidance',
  'industry-code': 'Industry code',
  proposal: 'Proposal',
  'good-practice': 'Good practice',
};

// A statute section or schedule whose official text can be shown inline;
// scripts/build_statute_extracts.py attaches the text and fails on a miss.
export interface StatuteCite {
  cap: string;
  section: string;
}

export interface ContractSource {
  label: string;
  // Paragraph or section as printed in the source.
  ref: string;
  strength: Strength;
  note?: string;
  url?: string;
  cites?: StatuteCite[];
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

// One standard SaaS contract term set against what SA-2 and TM-G-1 need.
export interface SaasRow {
  // The clause in terms[] that carries the full playbook.
  term: string;
  saasTerm: string;
  // How standard SaaS or cloud paper usually treats the point.
  standard: string;
  ask: string;
  refs: string[];
  // Compromise wording the bank can accept, one sub-clause per entry.
  compromise: string[];
  holdLine: string;
}

export interface SaasMatrix {
  intro: string[];
  rows: SaasRow[];
}

export interface VendorKit {
  intro: string[];
  lifecycle: SectionVisualData;
  saasMatrix?: SaasMatrix;
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

// A yes / no question in the materiality assessment.
export interface MaterialityQuestion {
  id: string;
  ask: string;
  help: string;
  ref: string;
}

export type MaterialityOutcomeId = 'procurement' | 'non-banking' | 'banking' | 'material';

export interface MaterialityOutcome {
  label: string;
  verdict: string;
  steps: string[];
}

export interface MaterialityKit {
  intro: string[];
  // Asked in order: is it outsourcing, and is it banking-related?
  gates: MaterialityQuestion[];
  // Any yes makes it material on our screen.
  factors: MaterialityQuestion[];
  outcomes: Record<MaterialityOutcomeId, MaterialityOutcome>;
  friction: SectionVisualData;
  frictionPoints: string[];
  // Model wording for signing before the HKMA discussion ends.
  condition: string[];
  sources: ContractSource[];
  caveat: string;
}

export interface IncidentQuestion {
  id: string;
  ask: string;
  help: string;
  // Asked only when that question is answered yes.
  dependsOn?: string;
}

export interface IncidentMark {
  col: string;
  label: string;
  // Shown only when the question is answered yes (if) or not yes (unless).
  if?: string;
  unless?: string;
}

export interface IncidentTrack {
  id: string;
  who: string;
  // The question that switches this track on, or 'always'.
  applies: string;
  when: string;
  marks: IncidentMark[];
  what: string;
  basis: string;
  strength: Strength;
  sources: ContractSource[];
  verify?: boolean;
}

export interface IncidentKit {
  intro: string[];
  questions: IncidentQuestion[];
  columns: { id: string; label: string }[];
  tracks: IncidentTrack[];
  notes: string[];
  caveat: string;
}

export const BANKING_STAGES = stagesJson as BankingStage[];

export const BANKING_STAGE_BY_ID: Record<string, BankingStage> = Object.fromEntries(
  BANKING_STAGES.map((s) => [s.id, s])
);

const EXTRACTS = extractsJson.extracts as Record<string, StatuteExtract>;

export const CAP155_ANATOMY = extractsJson.anatomy as CapAnatomy | null;

export function statuteExtract(p: Pick<Provision, 'cap' | 'section'>): StatuteExtract | undefined {
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
export const BANKING_TABS = [
  'essentials',
  'provisions',
  'vendors',
  'materiality',
  'incidents',
  'activities',
  'checklist',
  'notes',
  'glossary',
] as const;
export type BankingTab = (typeof BANKING_TABS)[number];
