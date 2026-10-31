'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { stripHeight } from '@/lib/useStudyState';

export interface TabDef {
  id: string;
  label: string;
  // Label for phone widths, where every tab must fit on one row.
  short?: string;
  icon: LucideIcon;
  count?: string | number;
}

interface Props {
  idBase: string;
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  // Render directly inside the stage container (not in a wrapper) so the
  // sticky bar can travel the whole stage.
  className?: string;
}

export const tabId = (base: string, id: string) => `${base}-tab-${id}`;
export const panelId = (base: string, id: string) => `${base}-panel-${id}`;
// Marks where the tab bar sits before it sticks; "back to top" returns here.
export const tabsTopId = (base: string) => `${base}-tabs`;

/**
 * Tab bar with arrow-key support (WAI-ARIA tabs pattern). Below md the tabs
 * are equal tiles (icon over a short label) so all of them stay visible; the
 * bar sticks under the phone stage strip, and to the top on wide screens.
 * Opening a tab from far down the page brings the reader to its start.
 */
export function Tabs({ idBase, tabs, active, onChange, className = '' }: Props) {
  const list = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = anchor.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - stripHeight();
    if (window.scrollY > top) window.scrollTo({ top });
  }, [active]);

  // More than seven tabs do not fit beside the rail: use the short labels at
  // every width, with the full name on hover, and drop the counts.
  const compact = tabs.length > 7;

  const onKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(tabs[j].id);
    list.current?.querySelector<HTMLElement>(`#${tabId(idBase, tabs[j].id)}`)?.focus();
  };

  return (
    <>
      <div ref={anchor} id={tabsTopId(idBase)} aria-hidden className={className} />
      {/* Phones: the bar runs nearly edge to edge so labels like "Checklist" fit at 320px. */}
      <div className="chrome-tabs sticky top-[57px] z-10 -mx-4 bg-paper/[0.97] px-1 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0">
        <div
          ref={list}
          role="tablist"
          aria-orientation="horizontal"
          onKeyDown={onKey}
          className="no-scrollbar grid auto-cols-fr grid-flow-col border-b border-line md:flex md:gap-0.5 md:overflow-x-auto"
        >
          {/* Counts are hidden from md to xl, where six tabs would not fit beside the rail. */}
          {tabs.map((t) => {
            const on = t.id === active;
            const Icon = t.icon;
            const countTone = on ? 'bg-phase/10 text-phase' : 'bg-ink/5 text-muted';
            return (
              <button
                key={t.id}
                id={tabId(idBase, t.id)}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={panelId(idBase, t.id)}
                tabIndex={on ? 0 : -1}
                onClick={() => onChange(t.id)}
                title={compact && t.short ? t.label : undefined}
                className={
                  'relative -mb-px flex min-w-0 flex-col items-center gap-1 whitespace-nowrap border-b-2 px-0.5 pb-2 pt-2.5 text-[11.5px] transition-colors focus-visible:outline-offset-[-3px] md:shrink-0 md:flex-row md:gap-2 md:px-2.5 md:py-2.5 md:text-sm xl:px-2 ' +
                  (on ? 'border-phase font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')
                }
              >
                <span className="relative">
                  <Icon className={'h-[18px] w-[18px] shrink-0 md:h-4 md:w-4 ' + (on ? 'text-phase' : '')} aria-hidden />
                  {/* Phones: the count rides beside the icon, clear of it. */}
                  {t.count !== undefined && (
                    <span
                      className={`absolute left-full top-[-7px] rounded-full px-1 font-mono text-[10px] font-normal leading-4 md:hidden ${countTone}`}
                    >
                      {t.count}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate md:hidden">{t.short ?? t.label}</span>
                <span className="hidden md:inline">{compact ? (t.short ?? t.label) : t.label}</span>
                {t.count !== undefined && !compact && (
                  <span className={`hidden rounded-full px-1.5 py-px font-mono text-[10.5px] leading-4 xl:block ${countTone}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function TabPanel({ idBase, id, children }: { idBase: string; id: string; children: React.ReactNode }) {
  return (
    <div
      id={panelId(idBase, id)}
      role="tabpanel"
      aria-labelledby={tabId(idBase, id)}
      tabIndex={0}
      className="animate-fade rounded-lg pt-6 focus-visible:outline-offset-4"
    >
      {children}
    </div>
  );
}

/**
 * "Next in this stage" at the foot of a tab, so a reader who has scrolled to
 * the end can carry on without going back to the tab bar.
 */
export function NextTab({ idBase, tabs, active, onChange }: Omit<Props, 'className'>) {
  const i = tabs.findIndex((t) => t.id === active);
  const next = i >= 0 ? tabs[i + 1] : undefined;
  if (!next) return null;
  const Icon = next.icon;
  return (
    <button
      type="button"
      onClick={() => {
        onChange(next.id);
        requestAnimationFrame(() => document.getElementById(panelId(idBase, next.id))?.focus({ preventScroll: true }));
      }}
      className="group mt-12 flex w-full items-center gap-3 rounded-xl border border-dashed border-phase/40 px-4 py-3 text-left transition-colors hover:border-phase hover:bg-phase/[0.04]"
    >
      <Icon className="h-5 w-5 shrink-0 text-phase" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="kicker block">Next in this stage</span>
        <span className="block font-medium">
          {next.label}
          {next.count !== undefined && <span className="ml-2 font-mono text-xs font-normal text-muted">{next.count}</span>}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-phase transition group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}
