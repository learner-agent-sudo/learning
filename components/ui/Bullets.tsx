import { CornerDownRight } from 'lucide-react';
import { RichText } from '../RichText';
import { SectionVisual, type SectionVisualData } from './SectionVisual';

export interface PointSection {
  heading: string;
  // Opening sentence that frames the section, shown above the bullets.
  lede?: string;
  points: string[];
  // The section's conclusion or the action it calls for, shown after the bullets.
  takeaway?: string;
  visual?: SectionVisualData;
}

/** Bullets with a small diamond marker in the stage colour. */
export function BulletList({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <ul className={'space-y-2.5 ' + className}>
      {items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 24)}`} className="relative pl-5 leading-relaxed">
          <span aria-hidden className="absolute left-0.5 top-[0.6em] h-1.5 w-1.5 rotate-45 bg-phase/80" />
          <RichText text={t} />
        </li>
      ))}
    </ul>
  );
}

/** The short version of a stage: numbered points on a tinted card. */
export function KeyPoints({ title, points, id }: { title: string; points: string[]; id?: string }) {
  // No overflow clipping here: glossary pop-ups must be able to spill out.
  return (
    <section id={id} className="relative rounded-xl border border-phase/25 bg-phase/[0.06] px-5 py-5 sm:px-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-phase" />
      <h3 className="kicker text-phase">{title}</h3>
      <ol className="mt-3 space-y-3">
        {points.map((t, i) => (
          <li key={`${i}-${t.slice(0, 24)}`} className="flex gap-3.5 leading-relaxed">
            <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-phase font-mono text-[10.5px] font-medium text-onaccent">
              {i + 1}
            </span>
            <span className="min-w-0">
              <RichText text={t} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Section anchors for the "On this page" list: §1 is index 0.
export const sectionId = (prefix: string, i: number) => `${prefix}-s${i + 1}`;

/** Headed groups of bullets, numbered like the sections of a note. */
export function SectionedPoints({ sections, idPrefix }: { sections: PointSection[]; idPrefix?: string }) {
  return (
    <div className="space-y-9">
      {sections.map((s, i) => (
        <section key={s.heading} id={idPrefix && sectionId(idPrefix, i)} className="grid gap-x-5 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
          <span aria-hidden className="hidden pt-1 font-mono text-xs text-phase sm:block">
            §{i + 1}
          </span>
          <div className="min-w-0">
            <h4 className="font-serif text-[1.35rem] font-semibold leading-tight">{s.heading}</h4>
            {s.lede && (
              <p className="mt-1.5 font-serif text-[1.075rem] italic leading-snug text-ink/75">
                <RichText text={s.lede} />
              </p>
            )}
            {s.visual && <SectionVisual visual={s.visual} />}
            <BulletList items={s.points} className="mt-3" />
            {s.takeaway && (
              <div className="mt-4 flex gap-3 rounded-lg border-l-[3px] border-phase bg-phase/[0.07] px-3.5 py-2.5">
                <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-phase" aria-hidden />
                <p className="leading-relaxed">
                  <span className="mr-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-phase">
                    Bottom line
                  </span>
                  <RichText text={s.takeaway} />
                </p>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-2">
      <h3 className="kicker">{children}</h3>
      {aside}
    </div>
  );
}
