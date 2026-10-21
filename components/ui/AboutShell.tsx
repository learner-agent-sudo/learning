import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toneVars, type Tone } from '@/lib/theme';
import { ThemeToggle } from '../ThemeToggle';

interface Props {
  backHref: string;
  backLabel: string;
  kicker: string;
  title: string;
  tone: Tone;
  children: React.ReactNode;
}

// Typography for the plain markup inside about pages.
const PROSE =
  'mt-8 space-y-4 leading-relaxed text-ink/85 [&_a]:font-medium [&_a]:text-accent hover:[&_a]:underline ' +
  '[&_h2]:!mt-10 [&_h2]:border-b [&_h2]:border-line [&_h2]:pb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink ' +
  '[&_ul]:space-y-2.5 [&_ul]:pl-1 [&_li]:relative [&_li]:pl-5 ' +
  "[&_li]:before:absolute [&_li]:before:left-0.5 [&_li]:before:top-[0.65em] [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rotate-45 [&_li]:before:bg-module/70 [&_li]:before:content-[''] " +
  '[&_code]:rounded [&_code]:bg-ink/5 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px]';

export function AboutShell({ backHref, backLabel, kicker, title, tone, children }: Props) {
  return (
    <div style={toneVars('--module', tone)}>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div className="flex items-center justify-between gap-4">
          <Link href={backHref} className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
          <ThemeToggle />
        </div>
        <p className="kicker mt-10 text-module">{kicker}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        <div className={PROSE}>{children}</div>
      </main>
    </div>
  );
}
