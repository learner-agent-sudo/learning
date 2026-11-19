'use client';

// What the reader has read, kept in this browser for the Desk. A unit is one
// block of a stage (the key points, one In-depth section, one notes card, one
// open provision card). It counts as read once it has been on screen long
// enough to skim; its text is hashed, so a unit that changes on the site counts
// as unread again. Nothing leaves the browser except in the reader's own backup.

import { load, save } from './useStudyState';

export interface SeenUnit {
  id: string;
  stage: string;
  // Tab of the stage view that shows the unit.
  tab: string;
  // Where the unit sits, for "Also covered in" and the reading record.
  label: string;
  text: string;
  hash: string;
  words: number;
}

// unit id -> [hash of its text when read, day it was read]
export type SeenRecord = Record<string, [string, number]>;

export interface DeskSettings {
  // Show a colleague's question above the section that answers it.
  reading: boolean;
  // Stop recording what is read.
  pause: boolean;
}

export const DEFAULT_SETTINGS: DeskSettings = { reading: false, pause: false };

export const seenKey = (module: string) => `learning:${module}:seen:v1`;
export const settingsKey = (module: string) => `learning:${module}:desk:v1`;
export const wordsKey = (module: string) => `learning:${module}:desk-words:v1`;
export const pinsKey = (module: string) => `learning:${module}:desk-pins:v1`;

// Same page, other components: the Desk and the stage view listen for this.
export const SEEN_EVENT = 'learning-seen';

const MAX_UNITS = 5000;
const EPOCH = Date.UTC(2026, 0, 1);

/** Whole days since 1 January 2026; no times are stored. */
export function dayNumber(at = Date.now()): number {
  return Math.max(0, Math.floor((at - EPOCH) / 86_400_000));
}

export function dayToDate(day: number): string {
  return new Date(EPOCH + day * 86_400_000).toISOString().slice(0, 10);
}

/** Stage text without bold markers or glossary markup, spaces collapsed. */
export function plainText(s: string): string {
  return s
    .replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** FNV-1a, 32 bits, as 8 hex characters: enough to notice a change. */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/** Seconds a unit must be on screen to count as read: a skim, at least four seconds. */
export function skimSeconds(words: number): number {
  return Math.max(4, Math.round(words / 10));
}

export function makeUnit(id: string, stage: string, tab: string, label: string, parts: (string | undefined)[]): SeenUnit {
  const text = plainText(parts.filter(Boolean).join(' '));
  return { id, stage, tab, label, text, hash: hashText(text), words: wordCount(text) };
}

export function loadSeen(module: string): SeenRecord {
  const v = load(seenKey(module));
  const out: SeenRecord = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [k, e] of Object.entries(v as Record<string, unknown>)) {
    if (
      typeof k === 'string' && k.length < 200 && Array.isArray(e) && e.length === 2 &&
      typeof e[0] === 'string' && /^[0-9a-f]{8}$/.test(e[0]) && typeof e[1] === 'number' && Number.isFinite(e[1])
    ) {
      out[k] = [e[0], e[1]];
    }
  }
  return out;
}

function store(module: string, rec: SeenRecord) {
  const entries = Object.entries(rec);
  // Keep the newest if the record ever grows past its cap.
  const kept = entries.length > MAX_UNITS ? entries.sort((a, b) => b[1][1] - a[1][1]).slice(0, MAX_UNITS) : entries;
  save(seenKey(module), Object.fromEntries(kept));
  try {
    window.dispatchEvent(new CustomEvent(SEEN_EVENT, { detail: module }));
  } catch {
    // no window (build) or a sandbox that blocks events
  }
}

/** Record units as read today, with their current text. */
export function markSeen(module: string, units: SeenUnit[]) {
  if (!units.length) return;
  const rec = loadSeen(module);
  const day = dayNumber();
  for (const u of units) rec[u.id] = [u.hash, day];
  store(module, rec);
}

/** Forget the units that match. */
export function forgetSeen(module: string, match: (unitId: string) => boolean) {
  const rec = loadSeen(module);
  for (const k of Object.keys(rec)) if (match(k)) delete rec[k];
  store(module, rec);
}

/** Merge a restored record: a unit read on either device counts, at its later day. */
export function mergeSeen(module: string, incoming: SeenRecord) {
  const rec = loadSeen(module);
  for (const [k, e] of Object.entries(incoming)) {
    if (!rec[k] || rec[k][0] !== e[0] || rec[k][1] < e[1]) rec[k] = e;
  }
  store(module, rec);
}

/** Read today, and its text has not changed on the site since. */
export function isSeen(rec: SeenRecord, u: SeenUnit): boolean {
  return rec[u.id]?.[0] === u.hash;
}

export function loadSettings(module: string): DeskSettings {
  const v = load(settingsKey(module)) as Partial<Record<keyof DeskSettings, unknown>> | null;
  return {
    reading: typeof v?.reading === 'boolean' ? v.reading : DEFAULT_SETTINGS.reading,
    pause: typeof v?.pause === 'boolean' ? v.pause : DEFAULT_SETTINGS.pause,
  };
}

export function saveSettings(module: string, s: DeskSettings) {
  save(settingsKey(module), s);
  try {
    window.dispatchEvent(new CustomEvent(SEEN_EVENT, { detail: module }));
  } catch {
    // as above
  }
}
