'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDefine } from './GlossaryContext';

interface Props {
  term: string;
  children?: React.ReactNode;
}

const MARGIN = 12;
// Phones show the definition as a sheet along the bottom of the screen.
const PHONE = '(max-width: 639.98px)';

/**
 * Definition pop-up for a glossary term. Mouse: opens on hover, and stays
 * open while the pointer is over the pop-up. Touch: a tap toggles it.
 * Keyboard: opens on focus, Escape closes. The pop-up is shifted (and if
 * need be flipped above the term) so it stays inside the viewport; on phones
 * it is a full-width sheet at the foot of the screen instead, in larger
 * type, which closes on a tap elsewhere or once the reader scrolls on.
 */
export function GlossaryTooltip({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ left: 0, above: false, sheet: false });
  const hovering = useRef(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const id = useId();
  const definition = useDefine()(term);

  useLayoutEffect(() => {
    if (!open) return;
    const sheet = window.matchMedia(PHONE).matches;
    if (sheet !== place.sheet) {
      setPlace({ left: 0, above: false, sheet });
      return;
    }
    if (sheet || !wrap.current || !tip.current) return;
    const anchor = wrap.current.getBoundingClientRect();
    const box = tip.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let left = Math.min(0, vw - MARGIN - (anchor.left + box.width));
    left = Math.max(left, MARGIN - anchor.left);
    const above = anchor.bottom + box.height + MARGIN > window.innerHeight && anchor.top > box.height + MARGIN;
    setPlace({ left, above, sheet: false });
  }, [open, place.sheet]);

  // The sheet does not travel with the term, so it goes once the reader scrolls on.
  useEffect(() => {
    if (!open || !place.sheet) return;
    const start = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - start) > 80 && setOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open, place.sheet]);

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
        className="text-left font-medium text-ink underline [strong_&]:font-semibold decoration-module/50 decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-module"
      >
        {children ?? term}
      </button>
      {open &&
        place.sheet &&
        // On <body>, so no stacking context in the page can put anything over it.
        createPortal(
          <span
            role="tooltip"
            id={id}
            className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 block animate-fade"
          >
            <span className="block rounded-xl border border-line bg-panel px-4 pb-3 pt-3.5 text-[15px] font-normal leading-relaxed text-ink shadow-lift">
              <span className="block font-serif text-lg font-semibold leading-tight">{term}</span>
              <span className="mt-1.5 block text-ink/80">{definition}</span>
              <span className="mt-2 block text-xs text-muted">Tap anywhere to close</span>
            </span>
          </span>,
          document.body
        )}
      {open && !place.sheet && (
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
