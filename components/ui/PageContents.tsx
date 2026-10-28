'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ListOrdered, X } from 'lucide-react';
import { scrollToElement } from '@/lib/useStudyState';

export interface PageSection {
  id: string;
  label: string;
  // Marker for numbered sections, e.g. "§2"; the button shows it as "§2 of 10".
  mark?: string;
}

interface Props {
  // Headings of the open tab, in page order; empty for tabs without sections.
  sections: PageSection[];
  // Where "Top" returns to: the tab bar's resting place.
  topId: string;
}

const BUTTON =
  'chrome-fab fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-panel/95 px-4 text-sm font-medium text-ink shadow-lift backdrop-blur transition-[opacity,transform] duration-[250ms] focus-visible:outline-offset-2';

/**
 * Floating "where am I" control for long tabs. With sections it shows the
 * current one (e.g. "§3 of 10") and opens a list to jump between them;
 * without, it is a plain back-to-top button. It appears once the reader is a
 * screen and a bit into the page, and steps aside at the foot of the page so
 * it never sits on the stage navigation. On phones it also slides away with
 * the top bars while the reader scrolls down (globals.css).
 */
export function PageContents({ sections, topId }: Props) {
  const [shown, setShown] = useState(false);
  const [current, setCurrent] = useState(-1);
  const dialog = useRef<HTMLDialogElement>(null);
  const latest = useRef(sections);
  latest.current = sections;
  const key = sections.map((s) => s.id).join('|');
  const numbered = sections.filter((s) => s.mark).length;
  const at = sections[current];

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const end = document.documentElement.scrollHeight - window.innerHeight - 240;
      setShown(y > window.innerHeight * 1.2 && y < end);
      let at = -1;
      latest.current.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) at = i;
      });
      setCurrent(at);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [key]);

  const go = (id: string) => {
    dialog.current?.close();
    const el = document.getElementById(id);
    if (!el) return;
    scrollToElement(el);
    // Headings take focus so keyboard and screen reader users land there too.
    const heading = el.querySelector<HTMLElement>('h3, h4') ?? el;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };

  if (sections.length === 0) {
    return (
      <button
        type="button"
        onClick={() => go(topId)}
        aria-label="Back to the top of the stage"
        className={`${BUTTON} ${shown ? '' : 'pointer-events-none opacity-0'}`}
        tabIndex={shown ? 0 : -1}
      >
        <ArrowUp className="h-4 w-4" aria-hidden />
        Top
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={at ? `On this page, now reading: ${at.label}` : 'On this page'}
        className={`${BUTTON} ${shown ? '' : 'pointer-events-none opacity-0'}`}
        tabIndex={shown ? 0 : -1}
      >
        <ListOrdered className="h-4 w-4 text-phase" aria-hidden />
        <span className="font-mono text-xs tabular-nums">{at?.mark ? `${at.mark} of ${numbered}` : 'Contents'}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="page-contents-title"
        // A tap on the backdrop lands on the dialog itself and closes it.
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-panel p-0 text-ink shadow-lift backdrop:bg-ink/30 sm:bottom-6 sm:rounded-2xl"
      >
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="page-contents-title" className="kicker">
              On this page
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <ol className="mt-1 space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => go(topId)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-muted hover:bg-ink/[0.04] hover:text-ink"
              >
                <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
                Top of the stage and its tabs
              </button>
            </li>
            {sections.map((s, i) => {
              const on = i === current;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={on ? 'location' : undefined}
                    className={
                      'flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left leading-snug hover:bg-ink/[0.04] ' +
                      (on ? 'bg-phase/[0.08] font-semibold text-ink' : 'text-ink/85')
                    }
                  >
                    <span className={'w-6 shrink-0 font-mono text-xs ' + (on ? 'text-phase' : 'text-muted')}>
                      {s.mark}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </dialog>
    </>
  );
}
