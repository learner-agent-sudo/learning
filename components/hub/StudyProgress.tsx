'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookMarked } from 'lucide-react';
import { loadLast, loadVisited } from '@/lib/useStudyState';
import { toneVars, type Tone } from '@/lib/theme';

export interface ModuleInfo {
  module: string;
  title: string;
  href: string;
  tone: Tone;
  stages: { id: string; index: number; title: string }[];
}

/** "Continue where you left off": the most recently read stage, if any. */
export function ContinueReading({ modules }: { modules: ModuleInfo[] }) {
  const [last, setLast] = useState<{ info: ModuleInfo; stage: ModuleInfo['stages'][number]; tab: string } | null>(null);

  useEffect(() => {
    let best: typeof last = null;
    let bestAt = -1;
    for (const info of modules) {
      const l = loadLast(info.module);
      const stage = l && info.stages.find((s) => s.id === l.stage);
      if (l && stage && l.at > bestAt) {
        best = { info, stage, tab: l.tab };
        bestAt = l.at;
      }
    }
    setLast(best);
  }, [modules]);

  if (!last) return null;
  const hash = `#${encodeURIComponent(last.stage.id)}${last.tab && last.tab !== 'essentials' ? `/${encodeURIComponent(last.tab)}` : ''}`;
  return (
    <Link
      href={`${last.info.href}${hash}`}
      style={toneVars('--vol', last.info.tone)}
      className="group mt-8 flex max-w-xl animate-rise items-center gap-4 rounded-2xl border border-line bg-panel px-5 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vol text-onaccent">
        <BookMarked className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="kicker block">Continue where you left off</span>
        <span className="line-clamp-2 font-serif text-lg font-semibold leading-snug sm:block sm:truncate">
          {last.info.title} · {String(last.stage.index).padStart(2, '0')} {last.stage.title}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-vol transition group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

/** Thin bar of stages opened in this browser, shown on a volume card. */
export function VolumeProgress({ module, ids }: { module: string; ids: string[] }) {
  const [opened, setOpened] = useState(0);
  useEffect(() => {
    const seen = new Set(loadVisited(module));
    setOpened(ids.filter((id) => seen.has(id)).length);
  }, [module, ids]);
  if (opened === 0) return null;
  const pct = Math.round((opened / ids.length) * 100);
  return (
    <div className="mt-4">
      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <span className="block h-full rounded-full bg-vol" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11.5px] text-muted">
        {opened} of {ids.length} stages opened
      </p>
    </div>
  );
}
