import stagesJson from '@/data/insurance/stages.json';
import extractsJson from '@/data/insurance/statute-extracts.json';
import type { PointSection } from '@/components/ui/Bullets';
import type { DeeperLink } from '@/components/ui/GoDeeper';
import type { SectionVisualData } from '@/components/ui/SectionVisual';
import type { ActivityKit } from './banking';
import type { CapAnatomy, Provision, StatuteExtract } from './statute';
import { TONES, type Tone } from './theme';

export type InsurancePhase = 'orientation' | 'bank' | 'entry' | 'business' | 'oversight';

export interface InsuranceStage {
  id: string;
  index: number;
  title: string;
  phase: InsurancePhase;
  // 'draft' stages have not yet been through the independent fact-check.
  review: 'fact-checked' | 'draft';
  oneLiner: string;
  keyPoints: string[];
  conceptMap?: SectionVisualData;
  deepDive: PointSection[];
  provisions: Provision[];
  checklist: string[];
  itAngle: string[];
  // What changes when the intermediary is a bank.
  bankNotes: string[];
  pitfalls: string[];
  glossary: { term: string; definition: string }[];
  // Where a topic is covered in depth: a stage of this volume by id, or a
  // page in another volume by href.
  related?: { stage?: string; href?: string; label?: string; why: string }[];
  // The bank's route stages: the legal route to launch, Legal's workplan and
  // what each activity needs.
  activityKit?: ActivityKit;
}

export const INSURANCE_STAGES = stagesJson as InsuranceStage[];

const EXTRACTS = extractsJson.extracts as Record<string, StatuteExtract>;

export const CAP41_ANATOMY = extractsJson.anatomy as CapAnatomy | null;

const BY_ID = Object.fromEntries(INSURANCE_STAGES.map((s) => [s.id, s]));

const VOLUME_OF = (href: string) =>
  href.startsWith('/hk-banking') ? 'Banking volume' : href.startsWith('/hk-securities') ? 'Securities volume' : 'Elsewhere';

/** A stage's related links, resolved to titles and hrefs. */
export function deeperLinks(stage: InsuranceStage): DeeperLink[] {
  return (stage.related ?? []).flatMap((r) => {
    const target = r.stage ? BY_ID[r.stage] : undefined;
    if (target) return [{ href: `#${target.id}`, title: target.title, where: `Stage ${target.index}`, why: r.why }];
    if (r.href && r.label) return [{ href: r.href, title: r.label, where: VOLUME_OF(r.href), why: r.why }];
    return [];
  });
}

export function insuranceExtract(p: Pick<Provision, 'cap' | 'section'>): StatuteExtract | undefined {
  return p.cap && p.section ? EXTRACTS[`${p.cap}|${p.section}`] : undefined;
}

const TERMS: Record<string, string> = {};
for (const stage of INSURANCE_STAGES) {
  for (const g of stage.glossary) TERMS[g.term.toLowerCase()] ??= g.definition;
}

export function defineInsuranceTerm(term: string): string | undefined {
  return TERMS[term.toLowerCase()];
}

export const INSURANCE_PHASES: Record<InsurancePhase, { label: string; tone: Tone }> = {
  orientation: { label: 'Orientation', tone: TONES.blue },
  bank: { label: "The digital bank's route", tone: TONES.teal },
  entry: { label: 'Insurers & licences', tone: TONES.violet },
  business: { label: 'Selling the business', tone: TONES.green },
  oversight: { label: 'Oversight & redress', tone: TONES.brick },
};

// Tabs of a stage view, in order; the first is the default (no hash suffix).
export const INSURANCE_TABS = ['essentials', 'provisions', 'launch', 'checklist', 'notes', 'glossary'] as const;
export type InsuranceTab = (typeof INSURANCE_TABS)[number];
