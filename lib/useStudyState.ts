'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Browser storage is a per-viewer convenience: every read and write is
// guarded, values are shape-checked (other sites on the same github.io
// origin share storage), and the pages work the same without it.
function load(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or blocked storage: keep in memory only
  }
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export const visitedKey = (module: string) => `learning:${module}:visited`;
export const lastKey = (module: string) => `learning:${module}:last`;

export function loadVisited(module: string): string[] {
  return strings(load(visitedKey(module)));
}

export function loadLast(module: string): { stage: string; tab: string; at: number } | null {
  const v = load(lastKey(module)) as { stage?: unknown; tab?: unknown; at?: unknown } | null;
  return v && typeof v.stage === 'string'
    ? { stage: v.stage, tab: typeof v.tab === 'string' ? v.tab : '', at: typeof v.at === 'number' ? v.at : 0 }
    : null;
}

export function loadTicks(key: string, size: number): boolean[] {
  const v = load(key);
  const row = Array.isArray(v) ? v : [];
  return Array.from({ length: size }, (_, i) => row[i] === true);
}

function decode(part: string): string | null {
  try {
    return decodeURIComponent(part);
  } catch {
    return null;
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Selected stage and tab, mirrored in the URL hash as `#stage` or
 * `#stage/tab` so either can be linked to and survives a reload. `ready`
 * turns true once the hash has been read, so callers can ignore the
 * fallback stage shown by the static HTML.
 */
export function useStageHash(module: string, ids: string[], tabs: string[]) {
  const [state, setState] = useState({ stage: ids[0], tab: tabs[0], ready: false });

  useEffect(() => {
    const read = () => {
      const [rawStage = '', rawTab = ''] = window.location.hash.slice(1).split('/');
      const stage = decode(rawStage);
      const tab = decode(rawTab);
      setState((prev) => ({
        stage: stage && ids.includes(stage) ? stage : prev.stage,
        tab: tab && tabs.includes(tab) ? tab : stage && ids.includes(stage) ? tabs[0] : prev.tab,
        ready: true,
      }));
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [ids, tabs]);

  const current = useRef(state);
  current.current = state;

  // Moving between stages keeps the open tab, so a reader can work through
  // every checklist (or every provisions list) in turn.
  const go = useCallback(
    (stage: string, tab?: string) => {
      const next = { stage, tab: tab && tabs.includes(tab) ? tab : current.current.tab, ready: true };
      setState(next);
      const hash = `#${encodeURIComponent(next.stage)}${next.tab === tabs[0] ? '' : `/${encodeURIComponent(next.tab)}`}`;
      try {
        history.replaceState(null, '', hash);
      } catch {
        // sandboxed frames may refuse history writes
      }
    },
    [tabs]
  );

  // Remembered for the hub's "continue" link.
  useEffect(() => {
    if (state.ready) save(lastKey(module), { stage: state.stage, tab: state.tab, at: Date.now() });
  }, [module, state.stage, state.tab, state.ready]);

  return { ...state, go };
}

/** Stages this browser has opened, for the "visited" marks. */
export function useVisited(module: string, current: string | null) {
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setVisited(new Set(loadVisited(module)));
  }, [module]);

  useEffect(() => {
    if (!current) return;
    setVisited((prev) => {
      if (prev.has(current)) return prev;
      const next = new Set(prev).add(current);
      save(visitedKey(module), Array.from(next));
      return next;
    });
  }, [module, current]);

  return visited;
}

/**
 * Checklist ticks for every stage of a module. Keys match the format used
 * before the redesign (`<prefix>:<stageId>`) so saved ticks carry over.
 */
export function useChecklists(prefix: string, sizes: Record<string, number>) {
  const [ticks, setTicks] = useState<Record<string, boolean[]>>({});
  const sizesRef = useRef(sizes);

  useEffect(() => {
    const loaded: Record<string, boolean[]> = {};
    for (const [id, size] of Object.entries(sizesRef.current)) loaded[id] = loadTicks(`${prefix}:${id}`, size);
    setTicks(loaded);
  }, [prefix]);

  const toggle = useCallback(
    (id: string, i: number) => {
      setTicks((prev) => {
        const size = sizesRef.current[id] ?? 0;
        const row = prev[id] ?? Array(size).fill(false);
        const nextRow = row.map((v, j) => (j === i ? !v : v));
        save(`${prefix}:${id}`, nextRow);
        return { ...prev, [id]: nextRow };
      });
    },
    [prefix]
  );

  return [ticks, toggle] as const;
}

/**
 * Brings the stage back into view when the reader moves to another stage
 * from further down the page. The first stage shown after the hash is read
 * is not a move, so a reload keeps its scroll position. On narrow screens
 * the sticky stage strip covers the top of the viewport, so the stage must
 * land below it.
 */
export function useScrollTopOnChange(key: string, ready: boolean) {
  const ref = useRef<HTMLElement>(null);
  const armed = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!armed.current) {
      armed.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const offset = window.matchMedia('(min-width: 1024px)').matches ? 24 : 72;
    const top = el.getBoundingClientRect().top;
    if (top < offset) {
      window.scrollTo({ top: top + window.scrollY - offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, [key, ready]);
  return ref;
}

/** Moves focus to the stage title after the stage subtree remounts. */
export function focusStageTitle() {
  requestAnimationFrame(() => document.getElementById('stage-title')?.focus({ preventScroll: true }));
}
