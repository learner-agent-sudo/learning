'use client';

import { Fragment } from 'react';
import { abbrPattern, type AbbrDict } from '@/lib/abbreviations';
import { useAbbreviations } from './AbbrContext';
import { GlossaryTooltip } from './GlossaryTooltip';

interface Props {
  text: string;
}

// [[term]] or [[label|glossary-key]] become glossary tooltips; **text** is bold.
const MARKER = /\[\[([^\]]+)\]\]|\*\*([^*]+)\*\*/g;

interface Ctx {
  dict: AbbrDict | null;
  // Abbreviations already explained in this block of text.
  seen: Set<string>;
  key: number;
}

/**
 * Plain text, with the first use of each known abbreviation in the block
 * made tappable to show what it stands for. A block is read on its own, so
 * every bullet explains its own abbreviations; one spelled out in brackets
 * just before ("registered institution (RI)") needs no note.
 */
function plain(text: string, ctx: Ctx): React.ReactNode[] {
  if (!ctx.dict) return [text];
  const rx = abbrPattern(ctx.dict);
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  rx.lastIndex = 0;
  while ((m = rx.exec(text)) !== null) {
    const abbr = m[1];
    if (ctx.seen.has(abbr)) continue;
    ctx.seen.add(abbr);
    if (text[m.index - 1] === '(') continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <GlossaryTooltip key={ctx.key++} term={abbr} definition={ctx.dict[abbr]} quiet>
        {m[0]}
      </GlossaryTooltip>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parse(text: string, ctx: Ctx): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Own regex instance: parse recurses into bold text.
  const marker = new RegExp(MARKER.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text)) !== null) {
    if (m.index > last) out.push(...plain(text.slice(last, m.index), ctx));
    if (m[1] !== undefined) {
      const [label, key] = m[1].split('|');
      // The glossary pop-up already explains an abbreviation used as its label.
      if (ctx.dict?.[label]) ctx.seen.add(label);
      out.push(
        <GlossaryTooltip key={ctx.key++} term={key ?? label}>
          {label}
        </GlossaryTooltip>
      );
    } else {
      // A bold lead-in can hold a glossary term, e.g. **[[DeFi]]:**.
      out.push(
        <strong key={ctx.key++} className="font-semibold text-ink">
          {parse(m[2], ctx)}
        </strong>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...plain(text.slice(last), ctx));
  return out;
}

/**
 * Renders text with glossary markers wrapped in GlossaryTooltip, **bold**
 * lead-ins in <strong>, and notes on the page's abbreviations.
 */
export function RichText({ text }: Props) {
  const dict = useAbbreviations();
  const nodes = parse(text, { dict, seen: new Set(), key: 0 });
  return (
    <>
      {nodes.map((n, i) => (typeof n === 'string' ? <Fragment key={`t${i}`}>{n}</Fragment> : n))}
    </>
  );
}
