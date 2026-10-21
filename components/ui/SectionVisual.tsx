import { ArrowRight, Clock } from 'lucide-react';

export interface VisualItem {
  label: string;
  value?: string;
  note?: string;
  // Lighter tint, e.g. buffers sitting on top of hard minimums.
  soft?: boolean;
}

export interface SectionVisualData {
  // layers: stacked bars narrowing with legal force (strongest first)
  // stack: equal bars, listed top to bottom
  // compare: side-by-side cards
  // steps: an escalation sequence
  // timeline: deadlines running from one event
  type: 'layers' | 'stack' | 'compare' | 'steps' | 'timeline';
  caption?: string;
  items: VisualItem[];
}

function Layers({ items }: { items: VisualItem[] }) {
  return (
    <ol className="space-y-1.5">
      {items.map((it, i) => (
        <li
          key={it.label}
          className="rounded-lg border border-phase/25 px-3.5 py-2.5"
          style={{
            width: `${100 - i * (36 / Math.max(1, items.length - 1))}%`,
            background: `rgb(var(--phase) / ${0.16 - i * 0.035})`,
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-semibold leading-snug">{it.label}</span>
            {it.value && <span className="font-mono text-[11.5px] text-phase">{it.value}</span>}
          </div>
          {it.note && <p className="mt-0.5 text-[13px] leading-snug text-ink/70">{it.note}</p>}
        </li>
      ))}
    </ol>
  );
}

function Stack({ items }: { items: VisualItem[] }) {
  return (
    <ol className="overflow-hidden rounded-lg border border-phase/30">
      {items.map((it) => (
        <li
          key={it.label}
          className={
            'flex flex-wrap items-baseline justify-between gap-x-3 border-b border-phase/15 px-3.5 py-2 last:border-b-0 ' +
            (it.soft ? 'bg-phase/[0.05]' : 'bg-phase/[0.16]')
          }
        >
          <span className="leading-snug">
            <span className={it.soft ? 'text-ink/80' : 'font-semibold'}>{it.label}</span>
            {it.note && <span className="block text-[12.5px] text-ink/65">{it.note}</span>}
          </span>
          {it.value && <span className="font-serif text-lg font-semibold text-phase">{it.value}</span>}
        </li>
      ))}
    </ol>
  );
}

function Compare({ items }: { items: VisualItem[] }) {
  const cols = items.length >= 5 ? 'sm:grid-cols-3 lg:grid-cols-5' : items.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <ul className={`grid gap-2.5 ${cols}`}>
      {items.map((it) => (
        <li key={it.label} className="rounded-lg border border-phase/25 bg-panel px-3.5 py-3 shadow-card">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-phase">{it.label}</p>
          {it.value && <p className="mt-1 font-serif text-xl font-semibold leading-tight">{it.value}</p>}
          {it.note && <p className="mt-1 text-[13px] leading-snug text-ink/70">{it.note}</p>}
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: VisualItem[] }) {
  return (
    <ol className="grid gap-2 sm:auto-cols-fr sm:grid-flow-col sm:gap-0">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-stretch gap-2 sm:flex-col sm:gap-0">
          <div className="flex items-center sm:pr-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-phase font-mono text-[11px] font-medium text-onaccent">
              {i + 1}
            </span>
            {i < items.length - 1 && (
              <span aria-hidden className="ml-2 hidden h-px flex-1 bg-phase/40 sm:block">
                <ArrowRight className="relative -top-[7px] ml-auto h-3.5 w-3.5 text-phase/60" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1 sm:pr-4 sm:pt-2">
            <p className="font-semibold leading-snug">{it.label}</p>
            {it.value && <p className="font-mono text-[11.5px] text-phase">{it.value}</p>}
            {it.note && <p className="mt-0.5 text-[13px] leading-snug text-ink/70">{it.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Timeline({ items }: { items: VisualItem[] }) {
  return (
    <ol className="relative grid gap-3 sm:auto-cols-fr sm:grid-flow-col sm:gap-3">
      <span aria-hidden className="absolute left-[13px] top-2 bottom-2 w-px bg-phase/30 sm:left-0 sm:right-0 sm:top-[13px] sm:bottom-auto sm:h-px sm:w-auto" />
      {items.map((it) => (
        <li key={`${it.value}-${it.label}`} className="relative flex gap-3 sm:block">
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-phase bg-panel text-phase">
            <Clock className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div className="min-w-0 sm:mt-2">
            <p className="font-serif text-xl font-semibold leading-tight text-phase">{it.value}</p>
            <p className="text-[13px] font-semibold leading-snug">{it.label}</p>
            {it.note && <p className="text-[12.5px] leading-snug text-ink/70">{it.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A small diagram drawn in the stage colour from facts in the section. */
export function SectionVisual({ visual }: { visual: SectionVisualData }) {
  const body =
    visual.type === 'layers' ? (
      <Layers items={visual.items} />
    ) : visual.type === 'stack' ? (
      <Stack items={visual.items} />
    ) : visual.type === 'compare' ? (
      <Compare items={visual.items} />
    ) : visual.type === 'steps' ? (
      <Steps items={visual.items} />
    ) : (
      <Timeline items={visual.items} />
    );
  return (
    <figure className="my-4 rounded-xl border border-line bg-paper/60 p-3.5 sm:p-4">
      {body}
      {visual.caption && <figcaption className="mt-3 text-[12.5px] leading-snug text-muted">{visual.caption}</figcaption>}
    </figure>
  );
}
