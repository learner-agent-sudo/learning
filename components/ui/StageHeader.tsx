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
      <div className="flex items-start gap-3.5 sm:gap-6">
        <span
          aria-hidden
          className="numeral-outline -mt-0.5 select-none font-serif text-[3rem] font-semibold leading-none text-phase sm:-mt-1 sm:text-[6rem]"
        >
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1 sm:pt-2">
          <p className="kicker">
            <span className="text-phase">{phaseLabel}</span>
            {/* The numeral and the stage strip already say this on phones. */}
            <span className="hidden sm:inline">
              <span className="mx-2 text-line">/</span>
              Stage {index} of {total}
            </span>
          </p>
          {/* Focus target after Previous / Next, so keyboard and screen-reader users land on the new stage. */}
          <h2
            id="stage-title"
            tabIndex={-1}
            className="mt-1 font-serif text-[1.7rem] font-semibold leading-[1.1] tracking-tight focus:outline-none sm:mt-1.5 sm:text-4xl"
          >
            {title}
          </h2>
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
