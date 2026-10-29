'use client';

import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { abbreviationsIn, stageStrings } from '@/lib/abbreviations';
import { useAbbreviations } from '../AbbrContext';

const PREVIEW = 4;

/**
 * Collapsed list of the abbreviations a stage uses, for readers who land
 * mid-volume. Covers text the inline notes cannot reach, such as diagram
 * labels.
 */
export function AbbrKey({ stage, className = '' }: { stage: unknown; className?: string }) {
  const dict = useAbbreviations();
  const found = useMemo(() => (dict ? abbreviationsIn(dict, stageStrings(stage)) : []), [dict, stage]);
  if (!dict || !found.length) return null;
  const sorted = [...found].sort((a, b) => a.localeCompare(b));
  const more = found.length - PREVIEW;

  return (
    <details className={'group text-sm ' + className}>
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
        <span>
          Abbreviations used here
          <span className="ml-1.5 font-mono text-[12px] text-ink/70">
            {found.slice(0, PREVIEW).join(', ')}
            {more > 0 && ` +${more}`}
          </span>
        </span>
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-xl border border-line bg-panel px-4 py-3 text-[14px] leading-snug shadow-card">
        {sorted.map((a) => (
          <div key={a} className="contents">
            <dt className="font-mono text-[13px] font-semibold text-ink">{a}</dt>
            <dd className="text-ink/75">{dict[a]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
