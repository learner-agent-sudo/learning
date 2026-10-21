'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Browser storage is a per-viewer convenience: every read and write is
// guarded, and the pages work the same when storage is unavailable.
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or blocked storage: keep in memory only
  }
}

/**
 * Selected stage, mirrored in the URL hash so a stage can be linked to and
 * survives a reload.
 */
export function useStageHash(ids: string[], fallback: string) {
  const [selected, setSelected] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (ids.includes(id)) setSelected(id);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [ids]);

  const select = useCallback((id: string) => {
    setSelected(id);
    try {
      history.replaceState(null, '', `#${encodeURIComponent(id)}`);
    } catch {
      // sandboxed frames may refuse history writes
    }
  }, []);

  return [selected, select] as const;
}

/** Stages this browser has opened, for the "visited" marks in the rail. */
export function useVisited(module: string, current: string) {
  const key = `learning:${module}:visited`;
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setVisited(new Set(load<string[]>(key, [])));
  }, [key]);

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(current)) return prev;
      const next = new Set(prev).add(current);
      save(key, Array.from(next));
      return next;
    });
  }, [key, current]);

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
    for (const [id, size] of Object.entries(sizesRef.current)) {
      const saved = load<boolean[] | null>(`${prefix}:${id}`, null);
      loaded[id] = Array.from({ length: size }, (_, i) => !!saved?.[i]);
    }
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
 * Scrolls the element back into view when the key changes, but only if the
 * reader has scrolled past its top (so clicking in the rail near the top of
 * the page does not jump).
 */
export function useScrollTopOnChange(key: string) {
  const ref = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [key]);
  return ref;
}
