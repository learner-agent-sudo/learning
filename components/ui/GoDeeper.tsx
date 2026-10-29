import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionTitle } from './Bullets';

export interface DeeperLink {
  href: string;
  title: string;
  // Where the link goes, e.g. "Stage 7" or "Banking volume".
  where: string;
  why: string;
}

/** Links from an overview stage to the stages that cover each point in depth. */
export function GoDeeper({ links, id }: { links: DeeperLink[]; id?: string }) {
  if (!links.length) return null;
  return (
    <section id={id} className="mt-12">
      <SectionTitle>Go deeper</SectionTitle>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => {
          // A hash link stays on this page; the hashchange event selects the stage.
          const Anchor = l.href.startsWith('#') ? 'a' : Link;
          return (
            <li key={l.href}>
              <Anchor
                href={l.href}
                className="group flex h-full flex-col rounded-xl border border-line bg-panel px-4 py-3 shadow-card transition-colors hover:border-phase/50"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-phase">{l.where}</span>
                <span className="mt-0.5 flex items-start justify-between gap-2 font-semibold leading-snug">
                  {l.title}
                  <ArrowRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-phase"
                    aria-hidden
                  />
                </span>
                <span className="mt-1 text-[14px] leading-snug text-ink/75">{l.why}</span>
              </Anchor>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
