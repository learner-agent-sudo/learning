import {
  STRENGTH_LABEL, type ContractTerm, type OnboardingItem, type OnboardingKit, type OnboardingLabels,
} from './banking';
import { STANCE_LABEL, plain } from './vendorExport';

export type StepStatus = 'done' | 'issue' | 'na';

export const STEP_STATUSES: StepStatus[] = ['done', 'issue', 'na'];

export const STEP_LABEL: Record<StepStatus, string> = {
  done: 'Done',
  issue: 'Open issue',
  na: 'Not applicable',
};

export interface StepState {
  status?: StepStatus;
  note?: string;
}

export interface OnboardingState {
  deal: string;
  picks: string[];
  showAll: boolean;
  items: Record<string, StepState>;
}

const DEFAULT_LABELS: OnboardingLabels = {
  profileTitle: 'Describe the deal',
  nameLabel: 'Vendor or deal',
  namePlaceholder: 'e.g. Acme Cloud CRM, 2027 renewal',
  noun: 'deal',
  documentsTitle: 'The document set',
  exportTitle: 'New IT vendor checklist',
  fileStem: 'it-vendor-checklist',
};

/** The kit's wording, with the new-vendor defaults for anything it leaves out. */
export const kitLabels = (kit: Pick<OnboardingKit, 'labels'>): OnboardingLabels => ({ ...DEFAULT_LABELS, ...kit.labels });

/** Whether a step applies to a deal with these profile picks. */
export function applies(item: OnboardingItem, picks: string[]): boolean {
  return !item.when?.length || item.when.some((w) => picks.includes(w));
}

const sourceLine = (item: OnboardingItem) =>
  item.sources.map((s) => `${s.label} ${s.ref} (${STRENGTH_LABEL[s.strength]})`).join('; ');

const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;

function pickLabels(kit: OnboardingKit, picks: string[]): string[] {
  return kit.profile.flatMap((g) => g.options.filter((o) => picks.includes(o.id)).map((o) => o.label));
}

/** The checklist as a Markdown working note for the deal file. */
export function onboardingMarkdown(
  kit: OnboardingKit,
  state: OnboardingState,
  shown: OnboardingItem[],
  terms: ContractTerm[],
  date: string
): string {
  const byId = Object.fromEntries(terms.map((t) => [t.id, t]));
  const st = (id: string) => state.items[id]?.status;
  const count = (s: StepStatus) => shown.filter((i) => st(i.id) === s).length;
  const picks = pickLabels(kit, state.picks);
  const L = kitLabels(kit);
  const out: string[] = [
    `# ${L.exportTitle}${state.deal ? `: ${state.deal}` : ''}`,
    '',
    `${kit.exportNote}. Exported ${date}.`,
    '',
    `**Profile:** ${picks.length ? picks.join('; ') : 'none chosen (every step shown)'}`,
    '',
    `**Progress:** ${count('done')} of ${shown.length} steps done; ${count('issue')} open ${count('issue') === 1 ? 'issue' : 'issues'}; ${count('na')} not applicable.`,
    '',
  ];
  kit.phases.forEach((p, n) => {
    const items = shown.filter((i) => i.phase === p.id);
    if (!items.length) return;
    out.push(`## ${n + 1}. ${p.title}`, '', `_${p.lede}_`, '');
    for (const i of items) {
      const s = st(i.id);
      const box = s === 'done' ? '[x]' : s === 'na' ? '[-]' : s === 'issue' ? '[!]' : '[ ]';
      out.push(`- ${box} **${i.title}** (${i.owner.join(', ')})`);
      if (s) out.push(`  - Status: ${STEP_LABEL[s]}`);
      const note = state.items[i.id]?.note?.trim();
      if (note) out.push(`  - Note: ${note.replace(/\n+/g, ' ')}`);
      for (const d of i.detail) out.push(`  - ${plain(d)}`);
      if (i.evidence?.length) out.push(`  - On the file: ${i.evidence.map(plain).join('; ')}`);
      for (const w of i.wording ?? []) out.push(`  - Model wording: "${plain(w)}"`);
      out.push(`  - Sources: ${sourceLine(i)}`);
      const linked = (i.terms ?? []).map((t) => byId[t]?.title).filter(Boolean);
      if (linked.length) out.push(`  - Clauses: ${linked.join('; ')}`);
    }
    out.push('');
  });
  const issues = shown.filter((i) => st(i.id) === 'issue');
  if (issues.length) {
    out.push('## Open issues', '');
    for (const i of issues) {
      const note = state.items[i.id]?.note?.trim();
      out.push(`- ${i.title}${note ? `: ${note.replace(/\n+/g, ' ')}` : ''}`);
    }
    out.push('');
  }
  const clauseIds = [...new Set(shown.flatMap((i) => i.terms ?? []))];
  const clauses = terms.filter((t) => clauseIds.includes(t.id));
  if (clauses.length) {
    out.push(`## Clauses this ${L.noun} needs`, '');
    for (const t of clauses) {
      out.push(`- ${t.title}${t.playbook ? ` (${STANCE_LABEL[t.playbook.stance]})` : ''}`);
    }
    out.push('');
  }
  if (kit.caveat) out.push('---', '', plain(kit.caveat), '');
  return out.join('\n');
}

/** One row per step, for a tracker spreadsheet. */
export function onboardingCsv(kit: OnboardingKit, state: OnboardingState, shown: OnboardingItem[], terms: ContractTerm[]): string {
  const byId = Object.fromEntries(terms.map((t) => [t.id, t.title]));
  const phase = Object.fromEntries(kit.phases.map((p, n) => [p.id, `${n + 1}. ${p.title}`]));
  const wording = shown.some((i) => i.wording?.length);
  const clauses = shown.some((i) => i.terms?.length);
  const head = ['Phase', 'Step', 'Owner', 'Status', 'Note', 'Sources', ...(clauses ? ['Clauses'] : []), 'On the file',
    ...(wording ? ['Model wording'] : [])];
  const rows = shown.map((i) => {
    const s = state.items[i.id];
    return [
      phase[i.phase] ?? i.phase,
      i.title,
      i.owner.join(', '),
      s?.status ? STEP_LABEL[s.status] : '',
      s?.note ?? '',
      sourceLine(i),
      ...(clauses ? [(i.terms ?? []).map((t) => byId[t] ?? t).join('; ')] : []),
      (i.evidence ?? []).map(plain).join('; '),
      ...(wording ? [(i.wording ?? []).map(plain).join(' | ')] : []),
    ];
  });
  // The byte-order mark makes Excel read the file as UTF-8.
  return '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function onboardingName(deal: string, ext: string, date: string, stem = DEFAULT_LABELS.fileStem) {
  const slug = deal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${stem}-${slug || 'deal'}-${date}.${ext}`;
}
