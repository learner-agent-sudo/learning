import { ChevronRight, ExternalLink, Lightbulb, ScrollText } from 'lucide-react';
import type { Provision, ProvisionKind, StatuteExtract } from '@/lib/statute';
import {
  BODY,
  CARD,
  CHEVRON,
  EDGE,
  INNER_DISCLOSURE,
  PILL_BASE,
  SUMMARY,
  TITLE,
} from '../cardStyles';

export const KIND: Record<ProvisionKind, { label: string; className: string; bar: string; title: string }> = {
  statute: { label: 'Statute', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200', bar: 'bg-indigo-500', title: 'Primary legislation' },
  subsidiary: { label: 'Sub. leg.', className: 'bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200', bar: 'bg-violet-500', title: 'Subsidiary legislation (rules, regulations)' },
  spm: { label: 'SPM', className: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200', bar: 'bg-sky-500', title: 'HKMA Supervisory Policy Manual module' },
  guideline: { label: 'Guideline', className: 'bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-200', bar: 'bg-teal-500', title: 'Regulatory guideline' },
  circular: { label: 'Circular', className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200', bar: 'bg-cyan-500', title: 'Regulator\'s circular, guidance letter or FAQ' },
  code: { label: 'Code', className: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200', bar: 'bg-amber-500', title: 'Industry or statutory code' },
  case: { label: 'Case', className: 'bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200', bar: 'bg-rose-500', title: 'Case law' },
  other: { label: 'Other', className: 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-200', bar: 'bg-slate-400', title: 'Other source' },
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// First sentence of the counsel note, previewed while the card is closed.
function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : text;
}

export function ProvisionCard({
  provision: p,
  extract,
  defaultOpen = false,
}: {
  provision: Provision;
  // Official text of the cited section, when it has been attached.
  extract?: StatuteExtract;
  defaultOpen?: boolean;
}) {
  const kind = KIND[p.kind] ?? KIND.other;
  return (
    <details className={`${CARD} min-w-0`} open={defaultOpen}>
      <summary className={SUMMARY}>
        <span aria-hidden className={`${EDGE} ${kind.bar}`} />
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={`${TITLE} min-w-0`}>
          {p.title}
          <span className="mt-1 block font-mono text-[11.5px] font-normal text-muted">{p.ref}</span>
          <span className="mt-1 line-clamp-2 text-[13px] font-normal leading-snug text-ink/65 group-open:hidden">
            {firstSentence(p.counselNote)}
          </span>
        </span>
        {p.confidence === 'low' && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200"
            title="Our fact-check could not fully confirm this reference — check the source."
          >
            verify
          </span>
        )}
        <span className={`${PILL_BASE} ${kind.className}`} title={kind.title}>
          {kind.label}
        </span>
      </summary>
      <div className={`${BODY} break-words`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>{p.instrument}</span>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 py-1 font-medium text-accent underline underline-offset-2"
            >
              Source <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
        {p.confidence === 'low' && (
          <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">
            Our fact-check could not fully confirm this reference: check the source before relying on it.
          </p>
        )}
        <p className="mt-2 leading-relaxed">{p.summary}</p>
        <div className="mt-3 flex gap-3 rounded-lg bg-amber-50/70 px-3.5 py-3 ring-1 ring-amber-200/60 dark:bg-amber-400/10 dark:ring-amber-300/20">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
          <p className="leading-relaxed">
            <span className="font-semibold">Why it matters to you: </span>
            {p.counselNote}
          </p>
        </div>
        {extract?.text && (
          <details className="group/st">
            <summary className={INNER_DISCLOSURE + ' list-none'}>
              <ScrollText className="h-3.5 w-3.5" aria-hidden />
              <span className="group-open/st:hidden">Read the statute text</span>
              <span className="hidden group-open/st:inline">Hide statute text</span>
            </summary>
            <div className="mt-2 overflow-hidden rounded-lg border border-line bg-panel">
              <div className="border-b border-line bg-paper/60 px-3.5 py-2 text-xs">
                <span className="font-semibold">
                  {extract.capTitle}, {extract.label}
                </span>
                {extract.heading && <span className="text-muted"> — {extract.heading}</span>}
                {extract.part && <div className="mt-0.5 text-muted">{extract.part}</div>}
              </div>
              {/* Phones: the opened text simply runs on, with no scroll box inside the page. Wider
                  screens scroll it in a box, which keyboard users can focus. */}
              <div
                role="region"
                aria-label={`${extract.label}: statute text`}
                tabIndex={0}
                className="whitespace-pre-wrap px-3.5 py-3 font-serif text-[15px] leading-relaxed text-ink/90 focus-visible:outline-offset-[-2px] sm:max-h-96 sm:overflow-auto"
              >
                {extract.text}
                {extract.truncated && <span className="text-muted">{'\n'}… (continues on HKeL)</span>}
              </div>
              <div className="border-t border-line px-3.5 py-2 text-[11px] text-muted">
                As at {formatDate(extract.versionDate)} · Hong Kong e-Legislation (DoJ) via DATA.GOV.HK ·
                not a verified copy ·{' '}
                <a href={extract.hkelUrl} target="_blank" rel="noreferrer" className="inline-block py-1 text-accent underline underline-offset-2">
                  Official text ↗
                </a>
              </div>
            </div>
          </details>
        )}
      </div>
    </details>
  );
}
