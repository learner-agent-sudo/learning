'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useDefine } from './GlossaryContext';

interface Props {
  term: string;
  children?: React.ReactNode;
}

const MARGIN = 12;

/**
 * Definition pop-up for a glossary term. Mouse: opens on hover, and stays
 * open while the pointer is over the pop-up. Touch: a tap toggles it.
 * Keyboard: opens on focus, Escape closes. The pop-up is shifted (and if
 * need be flipped above the term) so it stays inside the viewport.
 */
export function GlossaryTooltip({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ left: 0, above: false });
  const hovering = useRef(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const id = useId();
  const definition = useDefine()(term);

  useLayoutEffect(() => {
    if (!open || !wrap.current || !tip.current) return;
    const anchor = wrap.current.getBoundingClientRect();
    const box = tip.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let left = Math.min(0, vw - MARGIN - (anchor.left + box.width));
    left = Math.max(left, MARGIN - anchor.left);
    const above = anchor.bottom + box.height + MARGIN > window.innerHeight && anchor.top > box.height + MARGIN;
    setPlace({ left, above });
  }, [open]);

  if (!definition) return <>{children ?? term}</>;

  return (
    <span
      ref={wrap}
      className="relative inline"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        hovering.current = true;
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        hovering.current = false;
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => (hovering.current ? true : !o))}
        onFocus={(e) => {
          if (e.currentTarget.matches(':focus-visible')) setOpen(true);
        }}
        onBlur={() => !hovering.current && setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        className="text-left font-medium text-ink underline decoration-module/50 decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-module"
      >
        {children ?? term}
      </button>
      {open && (
        // Padding, not margin, bridges the gap so the pointer can cross onto the pop-up.
        <span
          ref={tip}
          role="tooltip"
          id={id}
          style={{ left: place.left }}
          className={
            'absolute z-30 block w-72 max-w-[calc(100vw-1.5rem)] animate-fade ' +
            (place.above ? 'bottom-full pb-1.5' : 'top-full pt-1.5')
          }
        >
          <span className="block rounded-lg border border-line bg-panel p-3 text-[13px] font-normal leading-snug text-ink shadow-lift">
            <span className="block font-serif text-base font-semibold leading-tight">{term}</span>
            <span className="mt-1 block text-muted">{definition}</span>
          </span>
        </span>
      )}
    </span>
  );
}
