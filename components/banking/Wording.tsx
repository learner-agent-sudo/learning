'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { RichText } from '../RichText';

/** Model wording with each outermost [choice] highlighted. */
export function Bracketed({ text }: { text: string }) {
  const parts: { s: string; b: boolean }[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of text) {
    if (ch === '[' && depth++ === 0) {
      if (buf) parts.push({ s: buf, b: false });
      buf = ch;
    } else if (ch === ']' && depth > 0 && --depth === 0) {
      parts.push({ s: buf + ch, b: true });
      buf = '';
    } else buf += ch;
  }
  if (buf) parts.push({ s: buf, b: depth > 0 });
  return (
    <>
      {parts.map((p, i) =>
        p.b ? (
          <mark key={i} className="rounded bg-amber-100 px-0.5 text-ink dark:bg-amber-300/20">
            {p.s}
          </mark>
        ) : (
          <RichText key={i} text={p.s} />
        )
      )}
    </>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // clipboard blocked: the text stays selectable on the page
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-xs font-medium text-ink transition-colors hover:border-ink/30"
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? 'Copied' : label}
      <span className="sr-only" aria-live="polite">
        {done ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
