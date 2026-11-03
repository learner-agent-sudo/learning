'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronRight, ListOrdered, X } from 'lucide-react';
import type { OutlineSection, OutlineTab } from '@/lib/outline';
import { jumpTo, useActiveSection } from '@/lib/useStudyState';

// The button shows a numbered section's mark as "§2 of 10".
export type PageSection = OutlineSection;

interface Props {
  // Headings of the open tab, in page order; empty for tabs without sections.
  sections: PageSection[];
  // Where "Top" returns to: the tab bar's resting place.
  topId: string;
  // The whole stage as a tree (its tabs and their sections), shown in the
  // sheet so the reader can move to another part of the stage.
  outline?: { tabs: OutlineTab[]; current: string; onJump: (tab: string, section?: string) => void };
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
export function PageContents({ sections, topId, outline }: Props) {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const current = useActiveSection(sections.map((s) => s.id));
  const numbered = sections.filter((s) => s.mark).length;
  const at = sections[current];

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const end = document.documentElement.scrollHeight - window.innerHeight - 240;
      setShown(y > window.innerHeight * 1.2 && y < end);
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
  }, []);

  const go = (id: string) => {
    dialog.current?.close();
    jumpTo(id, id !== topId);
  };
  const elsewhere = (tab: string, section?: string) => {
    dialog.current?.close();
    outline?.onJump(tab, section);
  };

  const sectionList = (list: PageSection[], onPick: (id: string) => void, here: boolean) => (
    <ol className={outline ? 'mb-1 ml-3 space-y-0.5 border-l border-line pl-1.5' : 'mt-1 space-y-0.5'}>
      {list.map((s, i) => {
        const on = here && i === current;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onPick(s.id)}
              aria-current={on ? 'location' : undefined}
              className={
                'flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left leading-snug hover:bg-ink/[0.04] ' +
                (on ? 'bg-phase/[0.08] font-semibold text-ink' : 'text-ink/85')
              }
            >
              {(s.mark || !outline) && (
                <span className={'w-6 shrink-0 font-mono text-xs ' + (on ? 'text-phase' : 'text-muted')}>{s.mark}</span>
              )}
              {s.label}
            </button>
          </li>
        );
      })}
    </ol>
  );

  if (sections.length === 0 && !outline) {
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
              {outline ? 'Contents of this stage' : 'On this page'}
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
          <ol className="mt-1">
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
          </ol>
          {outline ? (
            <ul className="mt-1 space-y-0.5">
              {outline.tabs.map((t) => {
                const here = t.id === outline.current;
                const expanded = open[t.id] ?? here;
                return (
                  <li key={t.id}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => (here ? go(topId) : elsewhere(t.id))}
                        aria-current={here ? 'true' : undefined}
                        className={
                          'flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-[15px] leading-snug hover:bg-ink/[0.04] ' +
                          (here ? 'font-semibold text-phase' : 'text-ink')
                        }
                      >
                        {t.label}
                        {here && <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-muted">open</span>}
                      </button>
                      {t.sections.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOpen((o) => ({ ...o, [t.id]: !expanded }))}
                          aria-expanded={expanded}
                          aria-label={`${expanded ? 'Hide' : 'Show'} the sections of ${t.label}`}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink"
                        >
                          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden />
                        </button>
                      )}
                    </div>
                    {expanded &&
                      t.sections.length > 0 &&
                      sectionList(here ? sections : t.sections, here ? go : (id) => elsewhere(t.id, id), here)}
                  </li>
                );
              })}
            </ul>
          ) : (
            sectionList(sections, go, true)
          )}
        </div>
      </dialog>
    </>
  );
}
