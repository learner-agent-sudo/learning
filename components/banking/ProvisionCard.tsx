import { ChevronRight, ExternalLink, Lightbulb, ScrollText } from 'lucide-react';
import { Provision, ProvisionKind, statuteExtract } from '@/lib/banking';
import {
  BODY,
  CARD,
  CHEVRON,
  INNER_DISCLOSURE,
  PILL_BASE,
  SUMMARY,
  TITLE,
} from '../cardStyles';

export const KIND: Record<ProvisionKind, { label: string; className: string; bar: string; title: string }> = {
  statute: { label: 'Statute', className: 'bg-indigo-50 text-indigo-700', bar: 'bg-indigo-500', title: 'Primary legislation' },
  subsidiary: { label: 'Sub. leg.', className: 'bg-violet-50 text-violet-700', bar: 'bg-violet-500', title: 'Subsidiary legislation (rules, regulations)' },
  spm: { label: 'SPM', className: 'bg-sky-50 text-sky-700', bar: 'bg-sky-500', title: 'HKMA Supervisory Policy Manual module' },
  guideline: { label: 'Guideline', className: 'bg-teal-50 text-teal-700', bar: 'bg-teal-500', title: 'Regulatory guideline' },
  circular: { label: 'Circular', className: 'bg-cyan-50 text-cyan-700', bar: 'bg-cyan-500', title: 'HKMA circular or guidance letter' },
  code: { label: 'Code', className: 'bg-amber-50 text-amber-800', bar: 'bg-amber-500', title: 'Industry or statutory code' },
  case: { label: 'Case', className: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500', title: 'Case law' },
  other: { label: 'Other', className: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400', title: 'Other source' },
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function ProvisionCard({ provision: p }: { provision: Provision }) {
  const kind = KIND[p.kind] ?? KIND.other;
  const extract = statuteExtract(p);
  return (
    <details className={`${CARD} min-w-0`}>
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${kind.bar}`} />
      <summary className={SUMMARY}>
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={`${TITLE} min-w-0`}>
          {p.title}
          <span className="mt-1 block font-mono text-[11.5px] font-normal text-muted">{p.ref}</span>
        </span>
        {p.confidence === 'low' && (
          <span
            className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900"
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
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              Source <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
        <p className="mt-2 leading-relaxed">{p.summary}</p>
        <div className="mt-3 flex gap-3 rounded-lg bg-amber-50/70 px-3.5 py-3 ring-1 ring-amber-200/60">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
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
            <div className="mt-2 overflow-hidden rounded-lg border border-line bg-white">
              <div className="border-b border-line bg-paper/60 px-3.5 py-2 text-xs">
                <span className="font-semibold">
                  {extract.capTitle}, {extract.label}
                </span>
                {extract.heading && <span className="text-muted"> — {extract.heading}</span>}
                {extract.part && <div className="mt-0.5 text-muted">{extract.part}</div>}
              </div>
              <div className="max-h-96 overflow-auto whitespace-pre-wrap px-3.5 py-3 font-serif text-[15px] leading-relaxed text-ink/90">
                {extract.text}
                {extract.truncated && <span className="text-muted">{'\n'}… (continues on HKeL)</span>}
              </div>
              <div className="border-t border-line px-3.5 py-2 text-[11px] text-muted">
                As at {formatDate(extract.versionDate)} · Hong Kong e-Legislation (DoJ) via DATA.GOV.HK ·
                not a verified copy ·{' '}
                <a href={extract.hkelUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
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
