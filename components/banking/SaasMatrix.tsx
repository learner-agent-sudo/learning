'use client';

import { ArrowDownRight, ChevronRight, ShieldAlert } from 'lucide-react';
import type { SaasMatrix as Matrix } from '@/lib/banking';
import { plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { BulletList } from '../ui/Bullets';
import { Bracketed, CopyButton } from './Wording';

// The stage reads its stage and tab from the URL hash, so a link to a card
// would navigate away; open the card and scroll to it instead.
function openClause(id: string) {
  const el = document.getElementById(`term-${id}`);
  if (!(el instanceof HTMLDetailsElement)) return;
  el.open = true;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
}

const CELL = 'align-top px-3 py-3 max-md:block max-md:w-auto max-md:px-0 max-md:py-1.5';
// On phones each row becomes a card and each cell is labelled.
const LABELLED = `${CELL} max-md:before:kicker max-md:before:mb-1 max-md:before:block max-md:before:content-[attr(data-label)]`;

/** Standard SaaS terms mapped to SA-2 and TM-G-1, with where to land in negotiation. */
export function SaasMatrix({ matrix, titles }: { matrix: Matrix; titles: Record<string, string> }) {
  return (
    <div>
      <BulletList items={matrix.intro} className="mb-4" />
      <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-card max-md:border-0 max-md:bg-transparent max-md:shadow-none">
        <table className="w-full border-collapse text-left text-sm leading-relaxed max-md:block">
          <caption className="sr-only">Standard SaaS terms against SA-2 and TM-G-1, with compromise wording</caption>
          <thead className="bg-paper/60 max-md:hidden">
            <tr className="border-b border-line">
              {['SaaS term', 'Their standard paper', 'What SA-2 / TM-G-1 need', 'Where to land'].map((h) => (
                <th key={h} scope="col" className="kicker px-3 py-2.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-md:block max-md:space-y-3">
            {matrix.rows.map((r) => (
              <tr
                key={r.term}
                className="border-b border-line/70 last:border-b-0 max-md:block max-md:rounded-xl max-md:border max-md:border-line max-md:bg-panel max-md:px-4 max-md:py-3 max-md:shadow-card"
              >
                <th scope="row" className={`${CELL} w-[17%] font-serif text-[15px] font-semibold leading-snug`}>
                  {r.saasTerm}
                  <button
                    type="button"
                    onClick={() => openClause(r.term)}
                    className="mt-1 flex items-center gap-1 text-left font-sans text-xs font-medium text-accent underline underline-offset-2"
                  >
                    <ArrowDownRight className="h-3 w-3 shrink-0" aria-hidden />
                    {titles[r.term] ?? 'Full clause'}
                  </button>
                </th>
                <td data-label="Their standard paper" className={`${LABELLED} w-[24%] text-ink/80`}>
                  <RichText text={r.standard} />
                </td>
                <td data-label="What SA-2 / TM-G-1 need" className={`${LABELLED} w-[27%]`}>
                  <RichText text={r.ask} />
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {r.refs.map((ref) => (
                      <span key={ref} className="rounded-full bg-ink/[0.06] px-2 py-px font-mono text-[10.5px] text-muted">
                        {ref}
                      </span>
                    ))}
                  </span>
                </td>
                <td data-label="Where to land" className={LABELLED}>
                  <p className="flex gap-1.5 text-[13px] leading-snug">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-300" aria-hidden />
                    <span>
                      <span className="font-semibold">Hold the line: </span>
                      <RichText text={r.holdLine} />
                    </span>
                  </p>
                  <details className="group/c mt-2">
                    <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 text-xs font-medium text-ink/80 underline decoration-ink/30 underline-offset-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/c:rotate-90" aria-hidden />
                      Compromise wording
                    </summary>
                    <div className="mt-2 space-y-1.5 rounded-lg bg-paper/70 px-3 py-2.5 font-serif text-[14.5px] leading-relaxed ring-1 ring-line">
                      {r.compromise.map((c) => (
                        <p key={c.slice(0, 16)}>
                          <Bracketed text={c} />
                        </p>
                      ))}
                    </div>
                    <div className="mt-2">
                      <CopyButton text={r.compromise.map(plain).join('\n\n')} label="Copy wording" />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
