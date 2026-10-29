// Sources cited in the regulation modules, and the official statute text
// attached to them by scripts/build_statute_extracts.py.

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
