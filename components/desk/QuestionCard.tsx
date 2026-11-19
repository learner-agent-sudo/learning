'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, MessageSquareText, Pin, PinOff } from 'lucide-react';
import {
  BEAT_LABEL,
  citesOf,
  cueOf,
  LENGTH_LABEL,
  linesFor,
  resolveLines,
  resolvePin,
  spokenSeconds,
  type DeskQuestion,
  type Length,
  type ResolvedLine,
} from '@/lib/desk';
import { isSeen, type SeenRecord, type SeenUnit } from '@/lib/seen';
import { RichText } from '../RichText';

export const STAGE_HREF = '/software-ip/';

/** Link to a block in its stage: #stage/tab/block. */
export function unitHref(u: SeenUnit): string {
  return `${STAGE_HREF}#${encodeURIComponent(u.stage)}/${u.tab}/${encodeURIComponent(u.id)}`;
}

const BTN =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors focus-visible:outline-offset-1';
const OFF = 'border-line bg-panel text-ink hover:border-ink/30';
const ON = 'border-ink bg-ink text-paper';

type Show = 'question' | 'cues' | 'lines' | 'all';

function Seconds({ raws }: { raws: string[] }) {
  if (!raws.length) return null;
  return <span className="text-xs text-muted">About {spokenSeconds(raws)} seconds aloud</span>;
}

function Source({ line }: { line: ResolvedLine }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted">
      <span>
        {String(line.stage.index).padStart(2, '0')} {line.stage.title} · {line.unit.label}
        {line.stage.review === 'draft' && <span className="ml-1.5 text-amber-800 dark:text-amber-300">· fact-check pending</span>}
      </span>
      <Link href={unitHref(line.unit)} className="inline-flex min-h-8 items-center gap-0.5 underline-offset-4 hover:text-ink hover:underline">
        Show me in the text <ArrowUpRight className="h-3 w-3" aria-hidden />
      </Link>
    </p>
  );
}

function Lines({ lines, show, upTo }: { lines: ResolvedLine[]; show: Show; upTo: number }) {
  const shown = show === 'lines' ? lines.slice(0, upTo) : lines;
  return (
    <ol className="mt-3 space-y-3">
      {shown.map((l, i) => (
        <li key={i} className="rounded-lg border border-line bg-paper/60 px-3.5 py-2.5">
          <p className="kicker text-module">{BEAT_LABEL[l.beat]}</p>
          {show === 'cues' ? (
            <p className="mt-1 leading-relaxed">
              {cueOf(l.raw)}
              {citesOf(l.raw).length > 0 && <span className="ml-2 font-mono text-[12px] text-muted">{citesOf(l.raw).join(' · ')}</span>}
            </p>
          ) : (
            <>
              <p className="mt-1 leading-relaxed">
                <RichText text={l.raw} />
              </p>
              <Source line={l} />
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Lines the reader has not read yet: named, never shown. */
function AlsoCovered({ lines, rec }: { lines: ResolvedLine[]; rec: SeenRecord }) {
  const unseen = lines.filter((l) => !isSeen(rec, l.unit));
  const units = Array.from(new Map(unseen.map((l) => [l.unit.id, l])).values());
  if (!units.length) return null;
  return (
    <p className="mt-3 text-[12.5px] text-muted">
      Also covered in:{' '}
      {units.map((l, i) => (
        <span key={l.unit.id}>
          {i > 0 && '; '}
          <Link href={unitHref(l.unit)} className="underline underline-offset-2 hover:text-ink">
            {String(l.stage.index).padStart(2, '0')} {l.stage.title}, {l.unit.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

interface Props {
  q: DeskQuestion;
  rec: SeenRecord;
  words: string;
  onWords: (text: string) => void;
  pinned: boolean;
  onPin: () => void;
  defaultOpen?: boolean;
}

export function QuestionCard({ q, rec, words, onWords, pinned, onPin, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [length, setLength] = useState<Length>('brief');
  const [show, setShow] = useState<Show>('question');
  const [upTo, setUpTo] = useState(1);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [choicesOpen, setChoicesOpen] = useState(false);
  const [follow, setFollow] = useState(0);
  const [followShown, setFollowShown] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState(words);

  useEffect(() => setDraft(words), [words]);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const all = useMemo(() => resolveLines(q.lines), [q.lines]);
  const lines = linesFor(all, length, rec);
  const revealed = show !== 'question';
  const answered = show === 'all' || (show === 'lines' && upTo >= lines.length);
  const stageOf = all[0]?.stage;

  const pick = (i: number) =>
    setPicked((prev) => {
      const next = new Set(q.choices?.multi ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <article id={q.id} className="scroll-mt-24 rounded-xl border border-line bg-panel shadow-card">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-start gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <MessageSquareText className="mt-1 h-4 w-4 shrink-0 text-module" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-[1.1rem] font-semibold leading-snug">{q.ask}</span>
            {stageOf && (
              <span className="mt-1 block text-[12px] text-muted">
                {String(stageOf.index).padStart(2, '0')} {stageOf.title}
                {pinned && ' · pinned'}
              </span>
            )}
          </span>
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </h3>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="How long an answer">
            {(Object.keys(LENGTH_LABEL) as Length[]).map((k) => (
              <button key={k} type="button" aria-pressed={length === k} onClick={() => setLength(k)} className={`${BTN} ${length === k ? ON : OFF}`}>
                {LENGTH_LABEL[k]}
              </button>
            ))}
            <span className="ml-1">
              <Seconds raws={lines.map((l) => l.raw)} />
            </span>
          </div>

          <p className="mt-3 text-[13px] text-muted">Answer it in your head or out loud, then look.</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="How much to show">
            {q.choices && (
              <button type="button" aria-pressed={choicesOpen} onClick={() => setChoicesOpen((c) => !c)} className={`${BTN} ${choicesOpen ? ON : OFF}`}>
                Choices
              </button>
            )}
            <button type="button" aria-pressed={show === 'cues'} onClick={() => setShow('cues')} className={`${BTN} ${show === 'cues' ? ON : OFF}`}>
              Cues
            </button>
            <button
              type="button"
              aria-pressed={show === 'lines'}
              onClick={() => {
                if (show === 'lines') setUpTo((n) => Math.min(lines.length, n + 1));
                else {
                  setShow('lines');
                  setUpTo(1);
                }
              }}
              className={`${BTN} ${show === 'lines' ? ON : OFF}`}
            >
              {show === 'lines' && upTo < lines.length ? 'Next line' : 'Line by line'}
            </button>
            <button type="button" aria-pressed={show === 'all'} onClick={() => setShow('all')} className={`${BTN} ${show === 'all' ? ON : OFF}`}>
              Whole answer
            </button>
            {revealed && (
              <button type="button" onClick={() => setShow('question')} className={`${BTN} ${OFF}`}>
                Hide
              </button>
            )}
          </div>

          {q.choices && choicesOpen && (
            <fieldset className="mt-4 rounded-lg border border-dashed border-line px-3.5 py-3">
              <legend className="px-1 text-[13px] font-medium">{q.choices.prompt}</legend>
              <div className="mt-1 grid gap-2">
                {q.choices.options.map((o, i) => {
                  const r = o.pin ? resolvePin(o.pin) : null;
                  return (
                    <div key={i}>
                      <button
                        type="button"
                        aria-pressed={picked.has(i)}
                        onClick={() => pick(i)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-[14px] transition-colors ${picked.has(i) ? 'border-ink bg-ink/[0.06]' : 'border-line hover:border-ink/30'}`}
                      >
                        {o.label}
                      </button>
                      {answered && (
                        <div className="mt-1 pl-3 text-[13px] leading-relaxed text-ink/80">
                          <span className="font-medium">{o.in ? 'Part of the answer.' : 'Not the pick.'}</span>{' '}
                          {r && isSeen(rec, r.unit) ? (
                            <RichText text={r.raw} />
                          ) : r ? (
                            <Link href={unitHref(r.unit)} className="text-muted underline underline-offset-2">
                              Covered in {r.stage.title}, {r.unit.label}
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!answered && <p className="mt-2 text-[12px] text-muted">Pick, then open the whole answer to see why.</p>}
            </fieldset>
          )}

          {revealed && <Lines lines={lines} show={show} upTo={upTo} />}
          {answered && <AlsoCovered lines={all} rec={rec} />}

          {answered && (q.followUps?.length ?? 0) > 0 && (
            <div className="mt-5 border-t border-dashed border-line pt-4">
              {q.followUps!.slice(0, follow).map((f, i) => {
                const fl = resolveLines(f.lines);
                const seen = fl.filter((l) => isSeen(rec, l.unit));
                return (
                  <div key={i} className="mb-4">
                    <p className="flex gap-2 font-medium">
                      <MessageSquareText className="mt-1 h-4 w-4 shrink-0 text-module" aria-hidden /> {f.ask}
                    </p>
                    {followShown.has(i) ? (
                      <>
                        {seen.length > 0 && <Lines lines={seen} show="all" upTo={seen.length} />}
                        <AlsoCovered lines={fl} rec={rec} />
                      </>
                    ) : (
                      <button type="button" onClick={() => setFollowShown((s) => new Set(s).add(i))} className={`${BTN} ${OFF} mt-2`}>
                        Look
                      </button>
                    )}
                  </div>
                );
              })}
              {follow < q.followUps!.length && (
                <button type="button" onClick={() => setFollow((n) => n + 1)} className={`${BTN} ${OFF}`}>
                  {follow === 0 ? 'The panel follows up' : 'Another follow-up'}
                </button>
              )}
            </div>
          )}

          <div className="mt-5">
            <label htmlFor={`${q.id}-words`} className="text-[13px] font-medium">
              How I would say it
            </label>
            <textarea
              id={`${q.id}-words`}
              value={draft}
              maxLength={1200}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => draft !== words && onWords(draft)}
              rows={3}
              placeholder="Your own words: kept in this browser, in your backup and in your downloads."
              className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14.5px] leading-relaxed focus:border-ink/40"
            />
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <Seconds raws={draft.trim() ? [draft] : []} />
              <button type="button" onClick={onPin} aria-pressed={pinned} className={`${BTN} ${pinned ? ON : OFF}`}>
                {pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
                {pinned ? 'Unpin' : 'Pin for the interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
