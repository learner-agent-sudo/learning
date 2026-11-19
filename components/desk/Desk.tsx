'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Search, Upload } from 'lucide-react';
import { defineSwTerm, SW_STAGES } from '@/lib/softwareIp';
import { SW_ABBR } from '@/lib/abbreviations';
import { DESK_QUESTIONS, isReady, readDay, resolveLines, type DeskQuestion } from '@/lib/desk';
import {
  dayToDate,
  forgetSeen,
  isSeen,
  loadSeen,
  loadSettings,
  markSeen,
  mergeSeen,
  pinsKey,
  plainText,
  saveSettings,
  SEEN_EVENT,
  wordsKey,
  type DeskSettings,
  type SeenRecord,
} from '@/lib/seen';
import { SW_MODULE, SW_UNITS, swUnits } from '@/lib/swUnits';
import { load, save } from '@/lib/useStudyState';
import { download } from '@/lib/vendorExport';
import { TONES, toneVars } from '@/lib/theme';
import { AbbrProvider } from '../AbbrContext';
import { GlossaryProvider } from '../GlossaryContext';
import { ThemeToggle } from '../ThemeToggle';
import { QuestionCard, unitHref } from './QuestionCard';

type Words = Record<string, { text: string; at: number }>;
type Order = 'stage' | 'recent' | 'oldest';

const BTN =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-[13px] text-ink transition-colors hover:border-ink/30 focus-visible:outline-offset-1';
const STAGE_INDEX = Object.fromEntries(SW_STAGES.map((s) => [s.id, s.index]));
const today = () => new Date().toISOString().slice(0, 10);

function loadWords(): Words {
  const v = load(wordsKey(SW_MODULE));
  const out: Words = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, e] of Object.entries(v as Record<string, unknown>)) {
      const x = e as { text?: unknown; at?: unknown };
      if (typeof x?.text === 'string' && typeof x.at === 'number') out[k] = { text: x.text.slice(0, 1200), at: x.at };
    }
  }
  return out;
}

function loadPins(): string[] {
  const v = load(pinsKey(SW_MODULE));
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 500) : [];
}

function snippet(text: string, needle: string): string {
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return text.slice(0, 180) + (text.length > 180 ? ' …' : '');
  const start = Math.max(0, i - 70);
  return (start > 0 ? '… ' : '') + text.slice(start, i + 130) + (i + 130 < text.length ? ' …' : '');
}

function markdown(questions: DeskQuestion[], rec: SeenRecord, words: Words): string {
  const out = [
    '# The Desk: Open source & software IP',
    '',
    `Exported ${today()}. The site's own sentences, from the sections read in this browser, with your words. Lines from stages marked "Fact-check pending" carry that note: check them against the source before relying on them.`,
    '',
  ];
  for (const q of questions) {
    out.push(`## ${q.ask}`, '');
    for (const l of resolveLines(q.lines).filter((x) => isSeen(rec, x.unit))) {
      const pending = l.stage.review === 'draft' ? ', fact-check pending' : '';
      out.push(`- ${plainText(l.raw)} *(${l.stage.index}. ${l.stage.title}, ${l.unit.label}${pending})*`);
    }
    const w = words[q.id]?.text.trim();
    if (w) out.push('', `**How I would say it:** ${w}`);
    out.push('');
  }
  out.push('Study material, not legal advice.', '');
  return out.join('\n');
}

interface Backup {
  kind: 'learning-desk-backup';
  module: string;
  version: 1;
  exported: string;
  seen: SeenRecord;
  words: Words;
  pins: string[];
  settings: DeskSettings;
}

export function Desk() {
  const [rec, setRec] = useState<SeenRecord>({});
  const [settings, setSettings] = useState<DeskSettings>({ reading: false, pause: false });
  const [words, setWords] = useState<Words>({});
  const [pins, setPins] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order>('stage');
  const [stage, setStage] = useState('all');
  const [hashId, setHashId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setRec(loadSeen(SW_MODULE));
    setSettings(loadSettings(SW_MODULE));
  }, []);

  useEffect(() => {
    refresh();
    setWords(loadWords());
    setPins(loadPins());
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) setHashId(id);
    window.addEventListener(SEEN_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SEEN_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (hashId) requestAnimationFrame(() => document.getElementById(hashId)?.scrollIntoView({ block: 'start' }));
  }, [hashId, rec]);

  const ready = useMemo(() => {
    const qs = DESK_QUESTIONS.filter((q) => isReady(q, rec) && (stage === 'all' || q.stage === stage));
    const byStage = (a: DeskQuestion, b: DeskQuestion) => (STAGE_INDEX[a.stage] ?? 0) - (STAGE_INDEX[b.stage] ?? 0);
    if (order === 'recent') return [...qs].sort((a, b) => readDay(b, rec) - readDay(a, rec) || byStage(a, b));
    if (order === 'oldest') return [...qs].sort((a, b) => readDay(a, rec) - readDay(b, rec) || byStage(a, b));
    return [...qs].sort(byStage);
  }, [rec, order, stage]);

  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  const found = useMemo(() => {
    if (!tokens.length) return null;
    const has = (t: string) => tokens.every((k) => t.toLowerCase().includes(k));
    return {
      units: SW_UNITS.filter((u) => isSeen(rec, u) && has(u.text)).slice(0, 12),
      questions: DESK_QUESTIONS.filter((q) => isReady(q, rec) && (has(q.ask) || has(words[q.id]?.text ?? ''))).slice(0, 8),
    };
    // tokens is derived from query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, rec, words]);

  const setWord = (id: string, text: string) => {
    const next = { ...words, [id]: { text, at: Date.now() } };
    if (!text.trim()) delete next[id];
    setWords(next);
    save(wordsKey(SW_MODULE), next);
  };
  const togglePin = (id: string) => {
    const next = pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id];
    setPins(next);
    save(pinsKey(SW_MODULE), next);
  };
  const setSetting = (patch: Partial<DeskSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(SW_MODULE, next);
  };

  const exportPinned = (all: boolean) => {
    const qs = all ? ready : ready.filter((q) => pins.includes(q.id));
    download(`desk-software-ip-${today()}.md`, markdown(qs, rec, words), 'text/markdown;charset=utf-8');
  };
  const backup = () => {
    const b: Backup = { kind: 'learning-desk-backup', module: SW_MODULE, version: 1, exported: today(), seen: loadSeen(SW_MODULE), words, pins, settings };
    download(`desk-backup-software-ip-${today()}.json`, JSON.stringify(b), 'application/json');
  };
  const restore = async (file: File) => {
    try {
      const b = JSON.parse(await file.text()) as Partial<Backup>;
      if (b.kind !== 'learning-desk-backup' || b.module !== SW_MODULE || b.version !== 1) throw new Error('not a Desk backup');
      // mergeSeen shape-checks through loadSeen on the next read; keep only well-formed entries here.
      const seen: SeenRecord = {};
      for (const [k, e] of Object.entries(b.seen ?? {})) {
        if (Array.isArray(e) && typeof e[0] === 'string' && /^[0-9a-f]{8}$/.test(e[0]) && typeof e[1] === 'number') seen[k] = [e[0], e[1]];
      }
      mergeSeen(SW_MODULE, seen);
      const nextWords = { ...words };
      for (const [k, w] of Object.entries(b.words ?? {})) {
        if (typeof w?.text === 'string' && typeof w.at === 'number' && (!nextWords[k] || nextWords[k].at < w.at)) {
          nextWords[k] = { text: w.text.slice(0, 1200), at: w.at };
        }
      }
      setWords(nextWords);
      save(wordsKey(SW_MODULE), nextWords);
      const nextPins = Array.from(new Set([...pins, ...(b.pins ?? []).filter((p) => typeof p === 'string')]));
      setPins(nextPins);
      save(pinsKey(SW_MODULE), nextPins);
      refresh();
      setMessage(`Restored the backup from ${b.exported ?? 'an earlier date'}.`);
    } catch {
      setMessage('That file is not a Desk backup for this volume, so nothing was changed.');
    }
  };

  const readByStage = SW_STAGES.map((s) => ({ stage: s, read: swUnits(s).filter((u) => isSeen(rec, u)) }));
  const anyRead = readByStage.some((r) => r.read.length > 0);
  const lastDay = Math.max(0, ...Object.values(rec).map((e) => e[1]));

  return (
    <GlossaryProvider value={defineSwTerm}>
      <AbbrProvider value={SW_ABBR}>
        <div style={toneVars('--module', TONES.amber)}>
          <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/software-ip/" className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Open source &amp; software IP
              </Link>
              <ThemeToggle />
            </div>
            <p className="kicker mt-10 text-module">Open source &amp; software IP</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">The Desk</h1>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/80">
              Questions an interview panel might put to counsel at a bank or fintech, answered in the site&apos;s own
              sentences, from what you have read. A question appears once you have read the sections that answer it.
              Nothing is scored, timed or due.
            </p>
            <p className="mt-3 rounded-lg bg-amber-50/80 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-950 ring-1 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-100 dark:ring-amber-300/20">
              This volume&apos;s stages are still marked <em>Fact-check pending</em>. Before you rely on a point in an
              interview, open it with &ldquo;Show me in the text&rdquo; and check its source.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="relative block">
                <span className="sr-only">Find where I read it</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find where I read it, e.g. patent grant"
                  className="min-h-11 w-full rounded-full border border-line bg-panel pl-9 pr-4 text-[14.5px]"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                <span className="sr-only sm:not-sr-only">Order</span>
                <select value={order} onChange={(e) => setOrder(e.target.value as Order)} className="min-h-11 rounded-full border border-line bg-panel px-3 text-[13.5px] text-ink">
                  <option value="stage">In stage order</option>
                  <option value="recent">Read most recently first</option>
                  <option value="oldest">Read longest ago first</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                <span className="sr-only">Stage</span>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className="min-h-11 max-w-full rounded-full border border-line bg-panel px-3 text-[13.5px] text-ink">
                  <option value="all">All stages</option>
                  {SW_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {String(s.index).padStart(2, '0')} {s.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {found && (
              <section aria-label="Where you read it" className="mt-6 rounded-xl border border-line bg-panel px-4 py-4 sm:px-5">
                <h2 className="kicker">Where you read it</h2>
                {found.units.length === 0 && found.questions.length === 0 && (
                  <p className="mt-2 text-[14px] text-muted">Nothing you have read matches. Only what you have read is searched.</p>
                )}
                <ul className="mt-2 divide-y divide-line">
                  {found.questions.map((q) => (
                    <li key={q.id} className="py-2.5">
                      <a href={`#${q.id}`} onClick={() => setHashId(q.id)} className="font-medium underline-offset-4 hover:underline">
                        {q.ask}
                      </a>
                      <span className="ml-2 text-[12px] text-muted">question</span>
                    </li>
                  ))}
                  {found.units.map((u) => {
                    const s = SW_STAGES.find((x) => x.id === u.stage)!;
                    return (
                      <li key={u.id} className="py-2.5">
                        <Link href={unitHref(u)} className="font-medium underline-offset-4 hover:underline">
                          {String(s.index).padStart(2, '0')} {s.title} · {u.label}
                        </Link>
                        <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/75">{snippet(u.text, tokens[0])}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section aria-label="Questions" className="mt-8">
              {ready.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line px-5 py-6 text-[14.5px] leading-relaxed text-ink/80">
                  <p>
                    The Desk fills as you read. A question appears once you have read the sections that answer it, on
                    this device. If you have already read this volume, or read it on another device, say so under{' '}
                    <a href="#read" className="underline underline-offset-2">What you have read</a>, or restore a backup.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {ready.map((q) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      rec={rec}
                      words={words[q.id]?.text ?? ''}
                      onWords={(t) => setWord(q.id, t)}
                      pinned={pins.includes(q.id)}
                      onPin={() => togglePin(q.id)}
                      defaultOpen={hashId === q.id}
                    />
                  ))}
                </div>
              )}
            </section>

            {ready.length > 0 && (
              <section aria-label="Download" className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={() => exportPinned(false)} disabled={!pins.some((p) => ready.some((q) => q.id === p))} className={`${BTN} disabled:opacity-50`}>
                  <Download className="h-3.5 w-3.5" aria-hidden /> Pinned answers (Markdown)
                </button>
                <button type="button" onClick={() => exportPinned(true)} className={BTN}>
                  <Download className="h-3.5 w-3.5" aria-hidden /> All questions shown (Markdown)
                </button>
              </section>
            )}

            <section id="read" aria-labelledby="read-title" className="mt-12 scroll-mt-6 border-t border-line pt-6">
              <h2 id="read-title" className="font-serif text-2xl font-semibold">What you have read</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/80">
                This browser notes a section once it has been on screen long enough to skim, and a provision once its
                card has been open. The Desk uses only these. A section that changes on the site counts as unread
                again. {anyRead && `Last noted ${dayToDate(lastDay)}.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={BTN}
                  onClick={() => {
                    if (window.confirm('Count every stage of this volume as read? The Desk may then use anything in it.')) {
                      markSeen(SW_MODULE, SW_UNITS);
                    }
                  }}
                >
                  Count this volume as read
                </button>
                <button
                  type="button"
                  className={BTN}
                  onClick={() => {
                    if (window.confirm('Forget everything this browser has noted as read in this volume? Your words and pins stay.')) {
                      forgetSeen(SW_MODULE, () => true);
                    }
                  }}
                >
                  Forget everything
                </button>
                <label className={`${BTN} cursor-pointer`}>
                  <input type="checkbox" checked={settings.pause} onChange={(e) => setSetting({ pause: e.target.checked })} className="h-4 w-4" />
                  Pause noting
                </label>
              </div>
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
                {readByStage.map(({ stage: s, read }) => (
                  <li key={s.id} className="px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/software-ip/#${s.id}`} className="font-medium underline-offset-4 hover:underline">
                        {String(s.index).padStart(2, '0')} {s.title}
                      </Link>
                      <span className="flex gap-3 text-[12.5px]">
                        <button type="button" onClick={() => markSeen(SW_MODULE, swUnits(s))} className="min-h-8 text-muted underline-offset-4 hover:text-ink hover:underline">
                          Count as read
                        </button>
                        {read.length > 0 && (
                          <button type="button" onClick={() => forgetSeen(SW_MODULE, (k) => k.startsWith(`sw-${s.id}-`))} className="min-h-8 text-muted underline-offset-4 hover:text-ink hover:underline">
                            Forget
                          </button>
                        )}
                      </span>
                    </div>
                    {read.length > 0 && (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{read.map((u) => u.label).join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="settings-title" className="mt-10 border-t border-line pt-6">
              <h2 id="settings-title" className="font-serif text-2xl font-semibold">While you read</h2>
              <label className="mt-3 flex items-start gap-3 text-[14.5px] leading-relaxed">
                <input type="checkbox" checked={settings.reading} onChange={(e) => setSetting({ reading: e.target.checked })} className="mt-1 h-4 w-4" />
                <span>
                  Show a colleague&apos;s question just above the section that answers it. It asks nothing of you, and
                  &ldquo;Read on&rdquo; folds it away.
                </span>
              </label>
            </section>

            <section aria-labelledby="backup-title" className="mt-10 border-t border-line pt-6">
              <h2 id="backup-title" className="font-serif text-2xl font-semibold">Phone and desktop</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/80">
                What you have read, your words and your pins stay in this browser. To move them to another device,
                download a backup here and restore it there; the two are merged. Safari can clear a site&apos;s stored
                data after seven days without a visit, so keep the file, or add the site to your home screen.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={backup} className={BTN}>
                  <Download className="h-3.5 w-3.5" aria-hidden /> Download a backup
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className={BTN}>
                  <Upload className="h-3.5 w-3.5" aria-hidden /> Restore a backup
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void restore(f);
                    e.target.value = '';
                  }}
                />
              </div>
              <p role="status" className="mt-2 text-[13px] text-muted">
                {message}
              </p>
            </section>

            <footer className="mt-14 border-t border-line pt-5 text-xs text-muted">
              Study material, not legal advice. Every answer line is a sentence from the stages; the site writes no model
              answers.
            </footer>
          </main>
        </div>
      </AbbrProvider>
    </GlossaryProvider>
  );
}
