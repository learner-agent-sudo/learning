import { Check } from 'lucide-react';
import { RichText } from '../RichText';

interface Props {
  items: string[];
  ticks: boolean[];
  onToggle: (i: number) => void;
}

/** A stage's to-do list with a progress bar; ticks are kept by the caller. */
export function Checklist({ items, ticks, onToggle }: Props) {
  const done = ticks.filter(Boolean).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return (
    <>
      <div className="mb-5 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-phase transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs text-muted">
          {done}/{items.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const on = ticks[i] ?? false;
          return (
            <li key={`${i}-${item.slice(0, 24)}`}>
              <label
                className={
                  'flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3 leading-relaxed transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-phase ' +
                  (on ? 'border-phase/30 bg-phase/[0.05] text-ink/70' : 'border-line bg-panel shadow-card hover:border-ink/25')
                }
              >
                <input type="checkbox" checked={on} onChange={() => onToggle(i)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ' +
                    (on ? 'border-phase bg-phase text-onaccent' : 'border-ink/60 bg-panel')
                  }
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span>
                  <RichText text={item} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Ticks are saved in this browser only.</p>
    </>
  );
}
