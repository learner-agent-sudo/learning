'use client';

import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: string | number;
}

interface Props {
  idBase: string;
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export const tabId = (base: string, id: string) => `${base}-tab-${id}`;
export const panelId = (base: string, id: string) => `${base}-panel-${id}`;

/** Underlined tab bar with arrow-key support (WAI-ARIA tabs pattern). */
export function Tabs({ idBase, tabs, active, onChange }: Props) {
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
      ref={list}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKey}
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0"
    >
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
              'relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors ' +
              (on ? 'border-phase font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')
            }
          >
            <Icon className={'h-4 w-4 ' + (on ? 'text-phase' : '')} aria-hidden />
            {t.label}
            {t.count !== undefined && (
              <span
                className={
                  'rounded-full px-1.5 py-px font-mono text-[10.5px] ' +
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
  );
}

export function TabPanel({ idBase, id, children }: { idBase: string; id: string; children: React.ReactNode }) {
  return (
    <div
      id={panelId(idBase, id)}
      role="tabpanel"
      aria-labelledby={tabId(idBase, id)}
      tabIndex={0}
      className="animate-fade pt-6 focus-visible:outline-none"
    >
      {children}
    </div>
  );
}
