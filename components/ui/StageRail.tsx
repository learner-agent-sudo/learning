'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

export interface RailGroup {
  id: string;
  label: string;
  // RGB channels, e.g. "59 91 140".
  color: string;
}

export interface RailStage {
  id: string;
  index: number;
  title: string;
  group: string;
  note?: string;
  // 0..1 share of the stage's checklist ticked, when it has one.
  progress?: number;
}

interface Props {
  groups: RailGroup[];
  stages: RailStage[];
  selectedId: string;
  visited: Set<string>;
  onSelect: (id: string) => void;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Marker({ stage, active, seen, color }: { stage: RailStage; active: boolean; seen: boolean; color: string }) {
  const complete = stage.progress === 1;
  return (
    <span
      style={{ '--phase': color } as React.CSSProperties}
      className={
        'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-medium transition-colors ' +
        (active
          ? 'border-phase bg-phase text-white shadow-[0_0_0_4px_rgb(var(--phase)/0.15)]'
          : complete
          ? 'border-phase bg-phase/15 text-phase'
          : seen
          ? 'border-phase/60 bg-panel text-phase'
          : 'border-line bg-panel text-muted')
      }
    >
      {complete && !active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : pad(stage.index)}
    </span>
  );
}

/** Table-of-contents rail for wide screens. */
export function StageRail({ groups, stages, selectedId, visited, onSelect, label }: Props) {
  return (
    <nav aria-label={label} className="no-scrollbar sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pb-6 pr-1">
      <p className="kicker mb-3 pl-1">Contents</p>
      {groups.map((g) => {
        const items = stages.filter((s) => s.group === g.id);
        if (items.length === 0) return null;
        return (
          <div key={g.id} className="mb-4">
            <div className="mb-1.5 flex items-center gap-2 pl-1">
              <span className="h-1.5 w-4 rounded-full" style={{ background: `rgb(${g.color})` }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: `rgb(${g.color})` }}>
                {g.label}
              </span>
            </div>
            <ol className="relative">
              <span aria-hidden className="absolute bottom-3 left-[17px] top-3 w-px bg-line" />
              {items.map((s) => {
                const active = s.id === selectedId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      aria-current={active ? 'step' : undefined}
                      className={
                        'group flex w-full items-center gap-3 rounded-lg py-1.5 pl-1 pr-2 text-left transition-colors ' +
                        (active ? 'bg-panel shadow-card' : 'hover:bg-panel/70')
                      }
                    >
                      <Marker stage={s} active={active} seen={visited.has(s.id)} color={g.color} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={
                            'block text-[13.5px] leading-snug ' +
                            (active ? 'font-semibold text-ink' : 'text-ink/80 group-hover:text-ink')
                          }
                        >
                          {s.title}
                        </span>
                        {s.note && <span className="block text-[11px] text-muted">{s.note}</span>}
                      </span>
                      {s.progress !== undefined && s.progress > 0 && s.progress < 1 && (
                        <span className="font-mono text-[10px] text-muted" title="Checklist progress">
                          {Math.round(s.progress * 100)}%
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </nav>
  );
}

/** Horizontal, sticky stage picker for narrow screens. */
export function StageStrip({ groups, stages, selectedId, visited, onSelect, label }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const colorOf = Object.fromEntries(groups.map((g) => [g.id, g.color]));

  useEffect(() => {
    const box = scroller.current;
    const pill = box?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`);
    if (box && pill) {
      box.scrollTo({ left: pill.offsetLeft - box.clientWidth / 2 + pill.clientWidth / 2, behavior: 'smooth' });
    }
  }, [selectedId]);

  return (
    <nav
      aria-label={label}
      className="sticky top-0 z-20 -mx-4 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75 sm:-mx-6 lg:hidden"
    >
      <div ref={scroller} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
        {stages.map((s) => {
          const active = s.id === selectedId;
          const color = colorOf[s.group];
          return (
            <button
              key={s.id}
              data-id={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={active ? 'step' : undefined}
              style={{ '--phase': color } as React.CSSProperties}
              className={
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors ' +
                (active
                  ? 'border-phase bg-phase font-medium text-white'
                  : visited.has(s.id)
                  ? 'border-phase/40 bg-panel text-ink'
                  : 'border-line bg-panel text-muted')
              }
            >
              <span className={'font-mono text-[11px] ' + (active ? 'text-white/80' : 'text-phase')}>{pad(s.index)}</span>
              {s.title}
              {s.progress === 1 && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-label="checklist done" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
