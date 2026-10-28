'use client';

import type { KeyboardEvent } from 'react';

interface Props<V extends string> {
  // Prefix for the tab and panel ids; the panel is `${id}-panel`.
  id: string;
  label: string;
  view: V;
  views: { id: V; label: string }[];
  onView: (v: V) => void;
}

/** Small pill-style tabs that switch between views of one card (WAI-ARIA tabs). */
export function ViewTabs<V extends string>({ id, label, view, views, onView }: Props<V>) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = views.findIndex((v) => v.id === view);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = views[(i + step + views.length) % views.length].id;
    onView(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="mb-4 inline-flex rounded-full border border-line bg-paper p-0.5">
      {views.map((v) => {
        const on = v.id === view;
        return (
          <button
            key={v.id}
            id={`${id}-tab-${v.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`${id}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onView(v.id)}
            onKeyDown={onKey}
            className={
              'min-h-10 rounded-full px-3.5 text-xs font-medium sm:min-h-8 sm:px-3 transition-colors focus-visible:outline-offset-1 ' +
              (on ? 'bg-ink text-paper' : 'text-muted hover:text-ink')
            }
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
