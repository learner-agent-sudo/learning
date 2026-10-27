import { ExternalLink } from 'lucide-react';
import { STRENGTH_LABEL, type ContractSource, type Strength } from '@/lib/banking';
import { PILL_BASE } from '../cardStyles';

// Legal force of a source, strongest first.
export const STRENGTH: Record<Strength, { label: string; pill: string; bar: string; title: string }> = {
  statute: {
    label: STRENGTH_LABEL.statute,
    pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200',
    bar: 'bg-indigo-500',
    title: 'Legislation: binding, with legal consequences for breach',
  },
  'case-law': {
    label: STRENGTH_LABEL['case-law'],
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200',
    bar: 'bg-blue-500',
    title: 'A court judgment: binding on the points it decides, subject to appeal and later cases',
  },
  'statutory-guideline': {
    label: STRENGTH_LABEL['statutory-guideline'],
    pill: 'bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200',
    bar: 'bg-violet-500',
    title:
      'Guideline issued under a statutory power, such as s.7(3) or s.16(10) of the Banking Ordinance or s.7 of the AMLO',
  },
  'hkma-guidance': {
    label: STRENGTH_LABEL['hkma-guidance'],
    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
    bar: 'bg-sky-500',
    title: 'Non-statutory HKMA expectation, assessed against the Seventh Schedule criteria',
  },
  'sfc-guidance': {
    label: STRENGTH_LABEL['sfc-guidance'],
    pill: 'bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-200',
    bar: 'bg-teal-500',
    title: 'Non-statutory SFC code, circular or FAQ: a breach can reflect on whether a licensed or registered person is fit and proper',
  },
  'industry-code': {
    label: STRENGTH_LABEL['industry-code'],
    pill: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    bar: 'bg-amber-500',
    title: 'Code of Banking Practice: non-statutory, but the HKMA monitors compliance',
  },
  proposal: {
    label: STRENGTH_LABEL.proposal,
    pill: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-200',
    bar: 'bg-fuchsia-500',
    title: 'Bill, consultation, policy statement or pilot: not yet law, so check its current status',
  },
  'good-practice': {
    label: STRENGTH_LABEL['good-practice'],
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-200',
    bar: 'bg-slate-400',
    title: 'Not required by a source; what experienced counsel would add',
  },
};

export const STRENGTH_ORDER = Object.keys(STRENGTH) as Strength[];

export function StrengthPill({ strength }: { strength: Strength }) {
  const st = STRENGTH[strength];
  return (
    <span className={`${PILL_BASE} ${st.pill}`} title={st.title}>
      {st.label}
    </span>
  );
}

/** The legal-force key, limited to the strengths in use. */
export function StrengthLegend({ sources }: { sources: ContractSource[] }) {
  const used = new Set(sources.map((s) => s.strength));
  return (
    <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted" aria-label="Source strength">
      {STRENGTH_ORDER.filter((s) => used.has(s)).map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5" title={STRENGTH[s].title}>
          <span className={`h-2 w-2 rounded-full ${STRENGTH[s].bar}`} aria-hidden />
          {STRENGTH[s].label}
        </li>
      ))}
    </ul>
  );
}

export function SourceList({ sources }: { sources: ContractSource[] }) {
  return (
    <ul className="space-y-2.5">
      {sources.map((s) => (
        <li key={`${s.label}-${s.ref}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <StrengthPill strength={s.strength} />
          <span className="font-medium">{s.label}</span>
          <span className="font-mono text-[12px] text-muted">{s.ref}</span>
          {s.note && <span className="w-full text-[13px] text-ink/70">{s.note}</span>}
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-2"
            >
              Source <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
