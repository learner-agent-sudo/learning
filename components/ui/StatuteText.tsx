import { ScrollText } from 'lucide-react';
import type { StatuteExtract } from '@/lib/statute';
import { INNER_DISCLOSURE } from '../cardStyles';

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * The official wording of a cited provision, closed until the reader asks for
 * it, so notes stay short and the text is one tap away when it needs checking.
 */
export function StatuteText({ extract, open = 'Read the statute text' }: { extract: StatuteExtract; open?: string }) {
  if (!extract.text) return null;
  return (
    <details className="group/st">
      <summary className={INNER_DISCLOSURE + ' list-none'}>
        <ScrollText className="h-3.5 w-3.5" aria-hidden />
        <span className="group-open/st:hidden">{open}</span>
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
          As at {formatDate(extract.versionDate)} · Hong Kong e-Legislation (DoJ) via DATA.GOV.HK · not a verified copy
          ·{' '}
          <a href={extract.hkelUrl} target="_blank" rel="noreferrer" className="inline-block py-1 text-accent underline underline-offset-2">
            Official text ↗
          </a>
        </div>
      </div>
    </details>
  );
}
