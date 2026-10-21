interface Props {
  index: number;
  total: number;
  phaseLabel: string;
  title: string;
  standfirst?: string;
  badges?: React.ReactNode;
}

/** Stage title block: big outlined numeral, phase kicker, serif title. */
export function StageHeader({ index, total, phaseLabel, title, standfirst, badges }: Props) {
  return (
    <header className="relative animate-rise">
      <div className="flex items-start gap-4 sm:gap-6">
        <span
          aria-hidden
          className="numeral-outline -mt-1 select-none font-serif text-[3.75rem] font-semibold leading-none text-phase sm:text-[6rem]"
        >
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1 pt-1 sm:pt-2">
          <p className="kicker">
            <span className="text-phase">{phaseLabel}</span>
            <span className="mx-2 text-line">/</span>
            <span className="whitespace-nowrap">
              Stage {index} of {total}
            </span>
          </p>
          <h2 className="mt-1.5 font-serif text-[1.85rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl">{title}</h2>
          {badges && <div className="mt-2.5 flex flex-wrap gap-1.5">{badges}</div>}
        </div>
      </div>
      {standfirst && (
        <p className="mt-4 border-l-[3px] border-phase/70 pl-4 font-serif text-lg italic leading-snug text-ink/80 sm:text-xl">
          {standfirst}
        </p>
      )}
    </header>
  );
}

export function Badge({ children, tone = 'neutral', title }: { children: React.ReactNode; tone?: 'neutral' | 'warn'; title?: string }) {
  return (
    <span
      title={title}
      className={
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ' +
        (tone === 'warn' ? 'bg-amber-100 text-amber-900' : 'bg-phase/10 text-phase')
      }
    >
      {children}
    </span>
  );
}
