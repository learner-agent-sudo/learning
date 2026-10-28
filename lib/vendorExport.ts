import { STRENGTH_LABEL, type ContractTerm, type KitPlaybook, type Stance } from './banking';
import type { ReviewStatus, VendorReview } from './useVendorReview';

export const STANCE_LABEL: Record<Stance, string> = {
  'must-have': 'Must-have',
  expected: 'Expected',
  negotiable: 'Negotiable',
};

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  meets: 'Meets',
  fallback: 'Fallback agreed',
  gap: 'Gap',
  na: 'Not applicable',
};

// Outside the site a glossary link ([[term]] or [[label|key]]) reads as its label.
export const unlink = (s: string) => s.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');

// Exports are plain text: drop the **bold** markers too.
export const plain = (s: string) => unlink(s).replace(/\*\*([^*]+)\*\*/g, '$1');

export const modelText = (t: ContractTerm) => (t.playbook?.model ?? []).map(plain).join('\n\n');

const bullets = (items: string[] = []) => items.map((s) => `• ${plain(s)}`).join('\n');
const sources = (t: ContractTerm) => t.sources.map((s) => `${s.label} ${s.ref} (${STRENGTH_LABEL[s.strength]})`);
const statusOf = (r: VendorReview, id: string) => {
  const s = r.items[id]?.status;
  return s ? STATUS_LABEL[s] : 'Not reviewed';
};

function cell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** One row per clause: the playbook plus this contract's review, for Excel. */
export function reviewCsv(terms: ContractTerm[], review: VendorReview, appliesLabel: (a: string) => string): string {
  const head = [
    'Clause', 'Applies to', 'Main source', 'Stance', 'Status', 'Your notes',
    'Preferred position', 'Fallback', 'Red lines', 'Model clause', 'Sources',
  ];
  const rows = terms.map((t) => {
    const pb = t.playbook;
    return [
      t.title,
      t.appliesTo.map(appliesLabel).join('; '),
      t.sources[0] ? STRENGTH_LABEL[t.sources[0].strength] : '',
      pb ? STANCE_LABEL[pb.stance] : '',
      statusOf(review, t.id),
      review.items[t.id]?.note ?? '',
      bullets(pb?.preferred),
      bullets(pb?.fallback),
      bullets(pb?.redLines),
      modelText(t),
      sources(t).join('\n'),
    ];
  });
  // The byte-order mark makes Excel read the file as UTF-8.
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

/** The whole playbook, with this contract's review, as a Markdown document. */
export function playbookMarkdown(
  terms: ContractTerm[],
  kit: KitPlaybook | undefined,
  review: VendorReview,
  date: string
): string {
  const out: string[] = ['# Vendor contract playbook', ''];
  if (review.contract) out.push(`Contract under review: ${review.contract}`, '');
  out.push(`Exported ${date}. Study material, not legal advice; bracketed figures are illustrative.`, '');
  if (kit) {
    out.push('## Using the playbook', '', ...kit.intro.map((s) => `- ${s}`), '');
    out.push('## Who approves a deviation', '', ...kit.escalation.map((s) => `- ${s}`), '');
    out.push('## Defined terms', '', ...kit.definitions.map((d) => `- **${d.term}:** ${d.meaning}`), '');
  }
  for (const t of terms) {
    const pb = t.playbook;
    out.push(`## ${t.title}`, '');
    const meta = [pb && `Stance: ${STANCE_LABEL[pb.stance]}`, `Status: ${statusOf(review, t.id)}`].filter(Boolean);
    out.push(meta.join(' · '), '');
    const note = review.items[t.id]?.note;
    if (note) out.push(`> Your notes: ${note.replace(/\n/g, '\n> ')}`, '');
    out.push(t.summary, '');
    if (pb) {
      out.push(pb.why, '');
      const list = (title: string, items: string[]) => {
        if (items.length) out.push(`### ${title}`, '', ...items.map((s) => `- ${s}`), '');
      };
      list('Preferred position', pb.preferred);
      list('Fallback', pb.fallback);
      list('Red lines', pb.redLines);
      out.push('### Model clause', '', ...pb.model.flatMap((s) => [`> ${plain(s)}`, '>']), '');
      out.pop();
      out.push('');
      list('Watch for', pb.watchFor);
      if (pb.pushback.length) {
        out.push('### If the vendor pushes back', '');
        for (const p of pb.pushback) out.push(`- **Vendor:** ${p.says}`, `  **Reply:** ${p.reply}`);
        out.push('');
      }
      out.push(`**Escalate:** ${pb.escalate}`, '');
    } else {
      out.push(...t.require.map((s) => `- ${s}`), '');
    }
    out.push(`Sources: ${sources(t).join('; ')}`, '');
  }
  return out.join('\n');
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportName(contract: string, ext: string, date: string) {
  const slug = contract
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `vendor-review-${slug || 'contract'}-${date}.${ext}`;
}
