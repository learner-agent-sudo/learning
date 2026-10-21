import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Stat {
  value: string | number;
  label: string;
}

interface Props {
  kicker: string;
  title: string;
  standfirst: React.ReactNode;
  // Large typographic mark behind the title (e.g. "Cap. 155").
  watermark: string;
  stats: Stat[];
  aboutHref: string;
  controls?: React.ReactNode;
  progress?: { done: number; total: number; label: string };
}

export function ModuleMasthead({ kicker, title, standfirst, watermark, stats, aboutHref, controls, progress }: Props) {
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <header className="relative overflow-hidden border-b border-line pb-7 pt-5 sm:pb-9 sm:pt-7">
      <span
        aria-hidden
        className="numeral-outline pointer-events-none absolute right-0 top-14 hidden select-none whitespace-nowrap font-serif text-[8rem] font-medium leading-none text-module/25 sm:block lg:text-[9.5rem]"
      >
        {watermark}
      </span>

      <nav className="relative flex items-center justify-between gap-4 text-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Library
        </Link>
        <Link href={aboutHref} className="text-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
          Sources &amp; method
        </Link>
      </nav>

      <div className="relative mt-6 max-w-3xl animate-rise">
        <p className="kicker text-module">{kicker}</p>
        <h1 className="mt-2 font-serif text-[2.4rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
        <div className="mt-3 max-w-2xl font-serif text-lg leading-snug text-ink/75 sm:text-xl">{standfirst}</div>
      </div>

      <div
        className="relative mt-6 flex animate-rise flex-wrap items-end justify-between gap-x-8 gap-y-5"
        style={{ animationDelay: '120ms' }}
      >
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
