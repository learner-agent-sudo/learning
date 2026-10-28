import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface Stat {
  value: string | number;
  label: string;
}

interface Props {
  kicker: string;
  title: string;
  standfirst: React.ReactNode;
  // Large typographic mark beside the title on wide screens (e.g. "Cap. 155").
  watermark: string;
  stats: Stat[];
  aboutHref: string;
  controls?: React.ReactNode;
  progress?: { done: number; total: number; label: string };
}

const NAV_LINK = 'inline-flex min-h-10 items-center gap-1.5 text-muted transition-colors hover:text-ink';

export function ModuleMasthead({ kicker, title, standfirst, watermark, stats, aboutHref, controls, progress }: Props) {
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <header className="border-b border-line pb-5 pt-2 sm:pb-9 sm:pt-4">
      <nav className="flex items-center justify-between gap-4 text-sm">
        <Link href="/" className={NAV_LINK}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Library
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href={aboutHref} className={`${NAV_LINK} underline-offset-4 hover:underline`}>
            {/* Phones: one word, so the bar stays on one line at 320px. */}
            <span className="sm:hidden">Sources</span>
            <span className="hidden sm:inline">Sources &amp; method</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="mt-3 flex items-start justify-between gap-10 sm:mt-5">
        <div className="max-w-3xl animate-rise">
          <p className="kicker text-module">{kicker}</p>
          <h1 className="mt-2 font-serif text-[2.2rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
          <div className="mt-3 hidden max-w-2xl font-serif text-lg leading-snug text-ink/75 sm:block sm:text-xl">{standfirst}</div>
        </div>
        {/* Its own column, so it can never run behind the title. */}
        <span
          aria-hidden
          className="numeral-outline pointer-events-none -mt-2 hidden select-none whitespace-nowrap font-serif text-[8rem] font-medium leading-none text-module/25 xl:block"
        >
          {watermark}
        </span>
      </div>

      {/* Phones: one compact line instead of the stat block. */}
      <div className="mt-3 sm:hidden">
        <p className="font-mono text-[11.5px] text-muted">
          {stats.map((s) => `${s.value} ${s.label}`).join(' · ')}
          {progress && ` · ${progress.done}/${progress.total} ticked`}
        </p>
        {progress && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <span className="block h-full rounded-full bg-module transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
        {controls && <div className="mt-3">{controls}</div>}
      </div>

      <div className="mt-6 hidden flex-wrap items-end justify-between gap-x-8 gap-y-5 sm:flex">
        <dl className="flex flex-wrap gap-x-7 gap-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-3xl font-semibold leading-none text-ink">{s.value}</dd>
              <dd className="mt-1 text-xs text-muted">{s.label}</dd>
            </div>
          ))}
          {progress && (
            <div className="min-w-[10rem]">
              <dt className="sr-only">{progress.label}</dt>
              <dd className="font-serif text-3xl font-semibold leading-none text-module">{pct}%</dd>
              <dd className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-module transition-all duration-500" style={{ width: `${pct}%` }} />
              </dd>
              <dd className="mt-1 text-xs text-muted">
                {progress.label} · {progress.done}/{progress.total}
              </dd>
            </div>
          )}
        </dl>
        {controls && <div className="flex flex-wrap items-center gap-3">{controls}</div>}
      </div>
    </header>
  );
}
