import stagesJson from '@/data/banking/stages.json';
import extractsJson from '@/data/banking/statute-extracts.json';

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
  deepDive: { heading: string; points: string[] }[];
  provisions: Provision[];
  checklist: string[];
  itAngle: string[];
  virtualBankNotes: string[];
  pitfalls: string[];
  glossary: { term: string; definition: string }[];
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

// color is RGB channels for the --phase CSS variable.
export const PHASES: Record<BankingPhase, { label: string; color: string }> = {
  orientation: { label: 'Orientation', color: '52 87 140' },
  entry: { label: 'Getting licensed', color: '109 74 150' },
  operate: { label: 'Running the bank', color: '30 117 88' },
  oversight: { label: 'Oversight & stress', color: '168 54 40' },
};
