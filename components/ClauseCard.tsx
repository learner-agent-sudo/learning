import { ChevronRight } from 'lucide-react';
import { ClauseRef } from '@/lib/workflow';
import { getClause, getCuadByCategory } from '@/lib/clauses';
import {
  BODY,
  CARD,
  CHEVRON,
  INNER_DISCLOSURE,
  PILL_BASE,
  SUMMARY,
  TITLE,
} from './cardStyles';

interface Props {
  clause: ClauseRef;
}

export function ClauseCard({ clause }: Props) {
  if (clause.provenance === 'cuad') {
    const examples = getCuadByCategory(clause.category);
    const empty = examples.length === 0;
    return (
      <details className={CARD}>
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
        <summary className={SUMMARY}>
          <ChevronRight className={CHEVRON} aria-hidden />
          <span className={TITLE}>{clause.category}</span>
          {empty && (
            <span className="shrink-0 text-[10px] italic text-muted">
              no data
            </span>
          )}
          <ProvenancePill provenance="cuad" />
        </summary>
        <div className={BODY}>
          {empty ? (
            <p className="text-xs italic text-muted">
              CUAD excerpt not loaded for this category.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {examples.map((ex) => {
                const hasContext = !!(ex.context_before || ex.context_after);
                return (
                  <li key={ex.id} className="text-sm">
                    <div className="text-[11px] uppercase tracking-wide text-muted">
                      {ex.contract_type ?? 'Contract'} · {ex.contract_title}
                    </div>
                    <blockquote className="mt-1.5 border-l-2 border-blue-200 pl-3 font-serif text-[15px] leading-relaxed text-ink/90">
                      {ex.excerpt}
                    </blockquote>
                    {hasContext && (
                      <details className="group/ctx">
                        <summary className={INNER_DISCLOSURE + ' list-none'}>
                          <ChevronRight className="h-3.5 w-3.5 transition group-open/ctx:rotate-90" aria-hidden />
                          <span className="group-open/ctx:hidden">Show in context</span>
                          <span className="hidden group-open/ctx:inline">Hide context</span>
                        </summary>
                        <div className="mt-2 whitespace-pre-wrap rounded-lg bg-paper p-3 text-xs leading-relaxed text-ink/80">
                          {ex.context_before && (
                            <span className="text-muted">…{ex.context_before}</span>
                          )}
                          <mark className="rounded bg-amber-100 px-0.5">
                            {ex.excerpt}
                          </mark>
                          {ex.context_after && (
                            <span className="text-muted">{ex.context_after}…</span>
                          )}
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>
    );
  }

  const gf = getClause(clause.id);
  if (!gf || gf.source !== 'hand-authored') {
    return (
      <article className="rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-300">
        Missing gap-fill: <code>{clause.id}</code>
      </article>
    );
  }
  return (
    <details className={CARD}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
      <summary className={SUMMARY}>
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={TITLE}>{gf.category}</span>
        <ProvenancePill provenance="hand-authored" />
      </summary>
      <div className={BODY}>
        <p className="text-sm leading-relaxed text-muted">{gf.description}</p>
        <details className="group/sd">
          <summary className={INNER_DISCLOSURE + ' list-none'}>
            <ChevronRight className="h-3.5 w-3.5 transition group-open/sd:rotate-90" aria-hidden />
            <span className="group-open/sd:hidden">Sample drafting</span>
            <span className="hidden group-open/sd:inline">Hide sample</span>
          </summary>
          <blockquote className="mt-2 border-l-2 border-amber-200 pl-3 font-serif text-[15px] leading-relaxed text-ink/90">
            {gf.example_text}
          </blockquote>
        </details>
      </div>
    </details>
  );
}

function ProvenancePill({ provenance }: { provenance: 'cuad' | 'hand-authored' }) {
  const isCuad = provenance === 'cuad';
  return (
    <span
      className={
        PILL_BASE +
        ' ' +
        (isCuad ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800')
      }
      title={
        isCuad
          ? 'Excerpt drawn from the CUAD dataset (Atticus Project, CC BY 4.0).'
          : 'Hand-authored illustrative drafting — not legal advice.'
      }
    >
      {isCuad ? 'CUAD' : 'Hand'}
    </span>
  );
}
