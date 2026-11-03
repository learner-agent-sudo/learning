'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { OutlineTab } from '@/lib/outline';
import { prefersReducedMotion, useActiveSection, useAutoHideChrome } from '@/lib/useStudyState';
import { toneVars, type Tone } from '@/lib/theme';

export interface RailGroup {
  id: string;
  label: string;
  tone: Tone;
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
  // Contents tree: each stage's tabs and their sections, the open tab, and
  // how to move to a tab or section. Without it the rail lists stages only.
  outlines?: Record<string, OutlineTab[]>;
  tab?: string;
  onJump?: (stage: string, tab: string, section?: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Marker({ stage, active, seen, tone }: { stage: RailStage; active: boolean; seen: boolean; tone: Tone }) {
  const complete = stage.progress === 1;
  return (
    <span
      style={toneVars('--phase', tone)}
      className={
        'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-medium transition-colors ' +
        (active
          ? 'border-phase bg-phase text-onaccent shadow-[0_0_0_4px_rgb(var(--phase)/0.15)]'
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

function Toggle({ open, onClick, controls, label, small }: { open: boolean; onClick: () => void; controls: string; label: string; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={label}
      className={
        'flex shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink focus-visible:outline-offset-[-2px] ' +
        (small ? 'h-6 w-6' : 'h-8 w-7')
      }
    >
      <ChevronRight className={`${small ? 'h-3 w-3' : 'h-3.5 w-3.5'} transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden />
    </button>
  );
}

/** A stage's tabs, and under each its sections: the sub-chapters. */
function StageTree({
  stage, tabs, here, tab, active, onJump,
}: {
  stage: RailStage;
  tabs: OutlineTab[];
  here: boolean;
  tab?: string;
  active: number;
  onJump: (stage: string, tab: string, section?: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <ul id={`rail-${stage.id}`} className="mb-2 ml-[42px] mt-0.5 space-y-px border-l border-line pl-1.5" aria-label={`Parts of ${stage.title}`}>
      {tabs.map((t) => {
        const current = here && t.id === tab;
        const shown = open[t.id] ?? current;
        const listId = `rail-${stage.id}-${t.id}`;
        return (
          <li key={t.id}>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onJump(stage.id, t.id)}
                aria-current={current ? 'true' : undefined}
                data-here={current && active < 0 ? 'true' : undefined}
                className={
                  'min-w-0 flex-1 rounded-md px-2 py-1 text-left text-[12.5px] leading-snug transition-colors focus-visible:outline-offset-[-2px] ' +
                  (current ? 'font-semibold text-phase' : 'text-ink/75 hover:bg-panel/70 hover:text-ink')
                }
              >
                {t.label}
                {t.sections.length > 0 && !shown && (
                  <>
                    <span aria-hidden className="ml-1.5 font-mono text-[10px] font-normal text-muted">
                      {t.sections.length}
                    </span>
                    <span className="sr-only">{` (${t.sections.length} ${t.sections.length === 1 ? 'section' : 'sections'})`}</span>
                  </>
                )}
              </button>
              {t.sections.length > 0 && (
                <Toggle
                  small
                  open={shown}
                  controls={listId}
                  label={`${shown ? 'Hide' : 'Show'} the sections of ${t.label}`}
                  onClick={() => setOpen((o) => ({ ...o, [t.id]: !shown }))}
                />
              )}
            </div>
            {t.sections.length > 0 && shown && (
              <ol id={listId} className="mb-1 ml-2 space-y-px border-l border-line/70 pl-1.5">
                {t.sections.map((x, i) => {
                  const on = current && i === active;
                  return (
                    <li key={x.id}>
                      <button
                        type="button"
                        onClick={() => onJump(stage.id, t.id, x.id)}
                        aria-current={on ? 'location' : undefined}
                        data-here={on ? 'true' : undefined}
                        className={
                          'flex w-full gap-1.5 rounded-md px-1.5 py-[3px] text-left text-[12px] leading-snug transition-colors focus-visible:outline-offset-[-2px] ' +
                          (on ? 'bg-phase/[0.09] font-medium text-ink' : 'text-muted hover:bg-panel/70 hover:text-ink')
                        }
                      >
                        {x.mark && <span className="w-5 shrink-0 pt-px font-mono text-[10px] text-phase/80">{x.mark}</span>}
                        <span className="min-w-0">{x.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Table-of-contents rail for wide screens: stages, and with an outline their tabs and sections. */
export function StageRail({ groups, stages, selectedId, visited, onSelect, label, outlines, tab, onJump }: Props) {
  const nav = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const currentIds = (outlines?.[selectedId]?.find((t) => t.id === tab)?.sections ?? []).map((x) => x.id);
  const activeIdx = useActiveSection(currentIds);

  // Keep the reader's place in view inside the rail.
  useEffect(() => {
    const box = nav.current;
    const el = box?.querySelector<HTMLElement>('[data-here="true"]');
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < b.top + 8 || r.bottom > b.bottom - 8) box.scrollTop += r.top - b.top - b.height / 3;
  }, [selectedId, tab, activeIdx]);

  return (
    <nav ref={nav} aria-label={label} className="no-scrollbar sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pb-6 pr-1">
      <p className="kicker mb-3 pl-1">Contents</p>
      {groups.map((g) => {
        const items = stages.filter((s) => s.group === g.id);
        if (items.length === 0) return null;
        return (
          <div key={g.id} className="mb-4">
            <div className="mb-1.5 flex items-center gap-2 pl-1" style={toneVars('--phase', g.tone)}>
              <span className="h-1.5 w-4 rounded-full bg-phase" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-phase">{g.label}</span>
            </div>
            <ol className="relative">
              <span aria-hidden className="absolute bottom-3 left-[17px] top-3 w-px bg-line" />
              {items.map((s) => {
                const active = s.id === selectedId;
                const tabs = outlines?.[s.id];
                const open = !!tabs && (expanded[s.id] ?? active);
                return (
                  <li key={s.id}>
                    <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      aria-current={active ? 'step' : undefined}
                      className={
                        'group flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1.5 pl-1 pr-2 text-left transition-colors focus-visible:outline-offset-[-2px] ' +
                        (active ? 'bg-panel shadow-card' : 'hover:bg-panel/70')
                      }
                      data-here={active && !open ? 'true' : undefined}
                    >
                      <Marker stage={s} active={active} seen={visited.has(s.id)} tone={g.tone} />
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
                    {tabs && (
                      <Toggle
                        open={open}
                        controls={`rail-${s.id}`}
                        label={`${open ? 'Hide' : 'Show'} the parts of ${s.title}`}
                        onClick={() => setExpanded((e) => ({ ...e, [s.id]: !open }))}
                      />
                    )}
                    </div>
                    {tabs && open && onJump && (
                      <div style={toneVars('--phase', g.tone)}>
                        <StageTree stage={s} tabs={tabs} here={active} tab={tab} active={active ? activeIdx : -1} onJump={onJump} />
                      </div>
                    )}
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

/** Horizontal, sticky stage picker for narrow screens; it slides away while reading. */
export function StageStrip({ groups, stages, selectedId, visited, onSelect, label }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const toneOf = Object.fromEntries(groups.map((g) => [g.id, g.tone]));
  useAutoHideChrome();

  useEffect(() => {
    const box = scroller.current;
    const pill = box?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`);
    if (box && pill) {
      box.scrollTo({
        left: pill.offsetLeft - box.clientWidth / 2 + pill.clientWidth / 2,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  }, [selectedId]);

  return (
    <nav
      aria-label={label}
      className="chrome-strip sticky top-0 z-20 -mx-4 h-[57px] border-b border-line bg-paper/[0.97] backdrop-blur sm:-mx-6 lg:hidden"
    >
      {/* 57px tall: the stage tab bar sticks just below it. */}
      <div ref={scroller} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2 sm:px-6">
        {stages.map((s) => {
          const active = s.id === selectedId;
          const tone = toneOf[s.group];
          return (
            <button
              key={s.id}
              data-id={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={active ? 'step' : undefined}
              style={toneVars('--phase', tone)}
              className={
                'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors focus-visible:outline-offset-[-3px] ' +
                (active
                  ? 'border-phase bg-phase font-medium text-onaccent'
                  : visited.has(s.id)
                  ? 'border-phase/40 bg-panel text-ink'
                  : 'border-line bg-panel text-muted')
              }
            >
              <span className={'font-mono text-[11px] ' + (active ? 'text-onaccent' : 'text-phase')}>{pad(s.index)}</span>
              {s.title}
              {s.progress === 1 && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-label="checklist done" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
