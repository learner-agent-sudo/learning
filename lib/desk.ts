// The Desk: interview questions answered in the site's own words, from what
// the reader has read. Every answer line is a whole sentence or bullet of a
// stage, found by a quote (scripts/check_desk.py fails the build when a quote
// no longer matches exactly one place). The site writes no model answers.

import deskJson from '@/data/software-ip/desk.json';
import { SW_STAGES, type SwStage } from './softwareIp';
import { swSources, SW_UNIT_BY_ID } from './swUnits';
import { isSeen, plainText, type SeenRecord, type SeenUnit } from './seen';

// What a line does in a spoken answer, in the order a panel hears it.
export type Beat = 'answer' | 'rule' | 'options' | 'bank' | 'pressed';

export const BEAT_LABEL: Record<Beat, string> = {
  answer: 'The answer',
  rule: 'Rule and source',
  options: 'The options',
  bank: 'What the bank does',
  pressed: 'If pressed',
};

export interface Pin {
  stage: string;
  quote: string;
}

export interface DeskLine {
  beat: Beat;
  pin: Pin;
  // Lines the question needs; it reaches the Desk once these are read.
  core?: boolean;
}

export interface DeskChoice {
  label: string;
  // Part of the answer, or a plausible option that is not.
  in: boolean;
  pin?: Pin;
}

export interface DeskQuestion {
  id: string;
  stage: string;
  ask: string;
  // The same question as a colleague would put it, shown above the section
  // that answers it when "questions while reading" is on.
  colleague?: { role: string; text: string };
  primes?: string;
  lines: DeskLine[];
  choices?: { prompt: string; multi: boolean; options: DeskChoice[] };
  followUps?: { ask: string; lines: DeskLine[] }[];
}

export const DESK_QUESTIONS = (deskJson as { questions: DeskQuestion[] }).questions;

const STAGE_BY_ID: Record<string, SwStage> = Object.fromEntries(SW_STAGES.map((s) => [s.id, s]));
const SOURCES: Record<string, ReturnType<typeof swSources>> = Object.fromEntries(SW_STAGES.map((s) => [s.id, swSources(s)]));

export interface ResolvedLine {
  beat: Beat;
  core: boolean;
  raw: string;
  unit: SeenUnit;
  stage: SwStage;
}

/** The sentence a pin quotes, whole, with the block it sits in. */
export function resolvePin(pin: Pin): { raw: string; unit: SeenUnit; stage: SwStage } | null {
  const stage = STAGE_BY_ID[pin.stage];
  const q = plainText(pin.quote);
  const hits = (SOURCES[pin.stage] ?? []).filter((s) => s.plain.includes(q));
  if (!stage || hits.length !== 1) return null;
  const unit = SW_UNIT_BY_ID[hits[0].unit];
  return unit ? { raw: hits[0].raw, unit, stage } : null;
}

export function resolveLines(lines: DeskLine[]): ResolvedLine[] {
  return lines.flatMap((l) => {
    const r = resolvePin(l.pin);
    return r ? [{ beat: l.beat, core: !!l.core, ...r }] : [];
  });
}

/** A question is on the Desk once every line it needs has been read. */
export function isReady(q: DeskQuestion, rec: SeenRecord): boolean {
  const core = resolveLines(q.lines).filter((l) => l.core);
  return core.length > 0 && core.every((l) => isSeen(rec, l.unit));
}

/** When the reader last read the blocks a question needs (a day number). */
export function readDay(q: DeskQuestion, rec: SeenRecord): number {
  return Math.max(0, ...resolveLines(q.lines).filter((l) => l.core).map((l) => rec[l.unit.id]?.[1] ?? 0));
}

// Spoken length: citations take longer to say than to read, so a reference
// such as s.114(2)(b) or § 204(a) counts each number and letter in it.
function spokenWords(text: string): number {
  return plainText(text)
    .split(/\s+/)
    .filter(Boolean)
    .reduce((n, w) => {
      if (/\d/.test(w) && /[().§]/.test(w)) return n + Math.max(1, (w.match(/[0-9]+|[a-z]+/gi) ?? []).length);
      if (w === '§' || w === '§§') return n + 1;
      return n + 1;
    }, 0);
}

/** About how long the lines take to say, at 150 words a minute. */
export function spokenSeconds(raws: string[]): number {
  const words = raws.reduce((n, r) => n + spokenWords(r), 0);
  return Math.max(5, Math.round((words / 150) * 60 / 5) * 5);
}

export type Length = 'sentence' | 'brief' | 'full';

export const LENGTH_LABEL: Record<Length, string> = {
  sentence: 'In a sentence',
  brief: 'Briefly',
  full: 'Walk us through it',
};

const MAX_FULL = 6;

/** The lines for a length, from the lines the reader has read. */
export function linesFor(all: ResolvedLine[], length: Length, rec: SeenRecord): ResolvedLine[] {
  const seen = all.filter((l) => isSeen(rec, l.unit));
  if (length === 'sentence') {
    const first = seen.find((l) => l.beat === 'answer') ?? seen.find((l) => l.core) ?? seen[0];
    return first ? [first] : [];
  }
  if (length === 'brief') return seen.filter((l) => l.core);
  return seen.slice(0, MAX_FULL);
}

/** The first words or the bold label of a line, as a cue. */
export function cueOf(raw: string): string {
  const label = raw.match(/^\*\*([^*]+?):?\*\*/);
  if (label) return label[1];
  const words = plainText(raw).split(' ');
  return words.slice(0, 6).join(' ') + (words.length > 6 ? ' …' : '');
}

/** Section citations in a line, for the cue view. */
export function citesOf(raw: string): string[] {
  const text = plainText(raw);
  const found = text.match(/(?:§§?\s?[\d.]+(?:\([a-z0-9]+\))*|s{1,2}\.\s?[\d.]+[A-Z]?(?:\([a-z0-9]+\))*|[A-Z][\w.-]*-\d\.\d(?:-only)?\s(?:s\.|section)\s?\d+)/g);
  return Array.from(new Set(found ?? [])).slice(0, 4);
}
