'use client';

import { useEffect, useRef } from 'react';
import { loadSettings, markSeen, SEEN_EVENT, skimSeconds, type SeenUnit } from '@/lib/seen';

/**
 * Notes which blocks of the open tab the reader has read. A block counts once
 * at least half of it, or half the screen's height of it, has been in view for
 * long enough to skim it (about ten words a second, at least four seconds),
 * while the page is visible. A closed card counts for nothing, and scrolling
 * past counts for nothing. Renders nothing and announces nothing.
 */
export function SeenTracker({ module, units }: { module: string; units: SeenUnit[] }) {
  const latest = useRef(units);
  latest.current = units;

  useEffect(() => {
    let paused = loadSettings(module).pause;
    const onChange = () => {
      paused = loadSettings(module).pause;
    };
    window.addEventListener(SEEN_EVENT, onChange);
    const dwell = new Map<string, number>();
    const counted = new Set<string>();
    const tick = () => {
      if (paused || document.hidden) return;
      const vh = window.innerHeight;
      const read: SeenUnit[] = [];
      for (const u of latest.current) {
        if (counted.has(u.id)) continue;
        const el = document.getElementById(u.id);
        if (!el || (el instanceof HTMLDetailsElement && !el.open)) continue;
        const r = el.getBoundingClientRect();
        if (r.height <= 0) continue;
        const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        if (visible < r.height * 0.5 && visible < vh * 0.5) continue;
        const t = (dwell.get(u.id) ?? 0) + 1;
        dwell.set(u.id, t);
        if (t >= skimSeconds(u.words)) {
          counted.add(u.id);
          read.push(u);
        }
      }
      if (read.length) markSeen(module, read);
    };
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(SEEN_EVENT, onChange);
    };
  }, [module]);

  return null;
}
