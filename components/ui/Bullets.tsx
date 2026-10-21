import { RichText } from '../RichText';

/** Bullets with a small diamond marker in the stage colour. */
export function BulletList({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <ul className={'space-y-2.5 ' + className}>
      {items.map((t) => (
        <li key={t} className="relative pl-5 leading-relaxed">
          <span aria-hidden className="absolute left-0.5 top-[0.6em] h-1.5 w-1.5 rotate-45 bg-phase/80" />
          <RichText text={t} />
        </li>
      ))}
    </ul>
  );
}

/** The short version of a stage: numbered points on a tinted card. */
export function KeyPoints({ title, points }: { title: string; points: string[] }) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-phase/25 bg-phase/[0.06] px-5 py-5 sm:px-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-phase" />
      <h3 className="kicker text-phase">{title}</h3>
      <ol className="mt-3 space-y-3">
        {points.map((t, i) => (
          <li key={t} className="flex gap-3.5 leading-relaxed">
            <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-phase font-mono text-[10.5px] font-medium text-white">
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

/** Headed groups of bullets, numbered like the sections of a note. */
export function SectionedPoints({ sections }: { sections: { heading: string; points: string[] }[] }) {
  return (
    <div className="space-y-7">
      {sections.map((s, i) => (
        <section key={s.heading} className="grid gap-x-5 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
          <span aria-hidden className="hidden pt-0.5 font-mono text-xs text-phase sm:block">
            §{i + 1}
          </span>
          <div className="min-w-0">
            <h4 className="font-serif text-xl font-semibold leading-tight">{s.heading}</h4>
            <BulletList items={s.points} className="mt-3" />
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
