import stagesJson from '@/data/securities/stages.json';
import extractsJson from '@/data/securities/statute-extracts.json';
import type { PointSection } from '@/components/ui/Bullets';
import type { SectionVisualData } from '@/components/ui/SectionVisual';
import type { CapAnatomy, Provision, StatuteExtract } from './statute';
import { TONES, type Tone } from './theme';

export type SecuritiesPhase = 'orientation' | 'entry' | 'business' | 'markets' | 'oversight';

export interface SecuritiesStage {
  id: string;
  index: number;
  title: string;
  phase: SecuritiesPhase;
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
  // What changes when the firm is a bank registered with the SFC.
  bankNotes: string[];
  pitfalls: string[];
  glossary: { term: string; definition: string }[];
}

export const SECURITIES_STAGES = stagesJson as SecuritiesStage[];

const EXTRACTS = extractsJson.extracts as Record<string, StatuteExtract>;

export const CAP571_ANATOMY = extractsJson.anatomy as CapAnatomy | null;

export function sfoExtract(p: Provision): StatuteExtract | undefined {
  return p.cap && p.section ? EXTRACTS[`${p.cap}|${p.section}`] : undefined;
}

const TERMS: Record<string, string> = {};
for (const stage of SECURITIES_STAGES) {
  for (const g of stage.glossary) TERMS[g.term.toLowerCase()] ??= g.definition;
}

export function defineSecuritiesTerm(term: string): string | undefined {
  return TERMS[term.toLowerCase()];
}

export const SECURITIES_PHASES: Record<SecuritiesPhase, { label: string; tone: Tone }> = {
  orientation: { label: 'Orientation', tone: TONES.blue },
  entry: { label: 'Getting licensed', tone: TONES.violet },
  business: { label: 'Doing the business', tone: TONES.green },
  markets: { label: 'Markets & listed companies', tone: TONES.amber },
  oversight: { label: 'Oversight & redress', tone: TONES.brick },
};

// Tabs of a stage view, in order; the first is the default (no hash suffix).
export const SECURITIES_TABS = ['essentials', 'provisions', 'checklist', 'notes', 'glossary'] as const;
export type SecuritiesTab = (typeof SECURITIES_TABS)[number];
