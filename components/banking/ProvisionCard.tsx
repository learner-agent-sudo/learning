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

const KIND: Record<ProvisionKind, { label: string; className: string; title: string }> = {
  statute: { label: 'Statute', className: 'bg-indigo-50 text-indigo-700', title: 'Primary legislation' },
  subsidiary: { label: 'Sub. leg.', className: 'bg-violet-50 text-violet-700', title: 'Subsidiary legislation (rules, regulations)' },
  spm: { label: 'SPM', className: 'bg-sky-50 text-sky-700', title: 'HKMA Supervisory Policy Manual module' },
  guideline: { label: 'Guideline', className: 'bg-teal-50 text-teal-700', title: 'Regulatory guideline' },
  circular: { label: 'Circular', className: 'bg-cyan-50 text-cyan-700', title: 'HKMA circular or guidance letter' },
  code: { label: 'Code', className: 'bg-amber-50 text-amber-800', title: 'Industry or statutory code' },
  case: { label: 'Case', className: 'bg-rose-50 text-rose-700', title: 'Case law' },
  other: { label: 'Other', className: 'bg-slate-100 text-slate-600', title: 'Other source' },
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
    <details className={CARD}>
      <summary className={SUMMARY}>
        <span className={CHEVRON}>▸</span>
        <span className={TITLE}>
          {p.title}
          <span className="ml-2 whitespace-nowrap text-xs font-normal text-muted">{p.ref}</span>
        </span>
        {p.confidence === 'low' && (
          <span
            className="shrink-0 text-[10px] italic text-amber-700"
            title="Our fact-check could not fully confirm this reference — check the source."
          >
            verify
          </span>
        )}
        <span className={`${PILL_BASE} ${kind.className}`} title={kind.title}>
          {kind.label}
        </span>
      </summary>
      <div className={BODY}>
        <div className="text-[11px] uppercase tracking-wide text-muted">
          {p.instrument} · {p.ref}
          {p.url && (
            <>
              {' · '}
              <a href={p.url} target="_blank" rel="noreferrer" className="normal-case text-accent hover:underline">
                Source ↗
              </a>
            </>
          )}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed">{p.summary}</p>
        <p className="mt-2 rounded bg-slate-50 px-2.5 py-2 text-sm leading-relaxed">
          <span className="font-semibold">Why it matters to you: </span>
          {p.counselNote}
        </p>
        {extract?.text && (
          <details className="group/st">
            <summary className={INNER_DISCLOSURE + ' list-none'}>
              <span className="transition group-open/st:rotate-90">▸</span>
              <span className="group-open/st:hidden">Read the statute text</span>
              <span className="hidden group-open/st:inline">Hide statute text</span>
            </summary>
            <div className="mt-2 rounded border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-3 py-2 text-xs">
                <span className="font-semibold">
                  {extract.capTitle}, {extract.label}
                </span>
                {extract.heading && <span className="text-muted"> — {extract.heading}</span>}
                {extract.part && <div className="mt-0.5 text-muted">{extract.part}</div>}
              </div>
              <div className="max-h-96 overflow-auto whitespace-pre-wrap px-3 py-2 font-serif text-[13px] leading-relaxed text-ink/90">
                {extract.text}
                {extract.truncated && <span className="text-muted">{'\n'}… (continues on HKeL)</span>}
              </div>
              <div className="border-t border-slate-200 px-3 py-1.5 text-[11px] text-muted">
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
