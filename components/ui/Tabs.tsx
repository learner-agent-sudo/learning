'use client';

import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

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

/**
 * Tab bar with arrow-key support (WAI-ARIA tabs pattern). Below md the tabs
 * are equal tiles (icon over a short label) so all of them stay visible; the
 * bar sticks under the phone stage strip, and to the top on wide screens.
 */
export function Tabs({ idBase, tabs, active, onChange, className = '' }: Props) {
  const list = useRef<HTMLDivElement>(null);

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
    <div
      className={`sticky top-[57px] z-10 -mx-4 bg-paper/[0.97] px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0 ${className}`}
    >
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
              className={
                'relative -mb-px flex min-w-0 flex-col items-center gap-1 whitespace-nowrap border-b-2 px-1 pb-2 pt-2.5 text-[11.5px] transition-colors focus-visible:outline-offset-[-3px] md:shrink-0 md:flex-row md:gap-2 md:px-2.5 md:py-2.5 md:text-sm xl:px-2 ' +
                (on ? 'border-phase font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')
              }
            >
              <Icon className={'h-[18px] w-[18px] shrink-0 md:h-4 md:w-4 ' + (on ? 'text-phase' : '')} aria-hidden />
              <span className="max-w-full truncate md:hidden">{t.short ?? t.label}</span>
              <span className="hidden md:inline">{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={
                    'absolute right-1 top-1 rounded-full px-1 font-mono text-[9.5px] leading-4 md:hidden xl:static xl:block xl:px-1.5 xl:py-px xl:text-[10.5px] ' +
                    (on ? 'bg-phase/10 text-phase' : 'bg-ink/5 text-muted')
                  }
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
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
