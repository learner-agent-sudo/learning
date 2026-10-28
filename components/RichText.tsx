import { Fragment } from 'react';
import { GlossaryTooltip } from './GlossaryTooltip';

interface Props {
  text: string;
}

// [[term]] or [[label|glossary-key]] become glossary tooltips; **text** is bold.
const MARKER = /\[\[([^\]]+)\]\]|\*\*([^*]+)\*\*/g;

/**
 * Renders text with glossary markers wrapped in GlossaryTooltip and **bold**
 * lead-ins in <strong>. Plain text segments are passed through unchanged.
 */
export function RichText({ text }: Props) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  MARKER.lastIndex = 0;
  while ((m = MARKER.exec(text)) !== null) {
    if (m.index > last) {
      out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    }
    if (m[1] !== undefined) {
      const [label, key] = m[1].split('|');
      out.push(
        <GlossaryTooltip key={i++} term={key ?? label}>
          {label}
        </GlossaryTooltip>
      );
    } else {
      // A bold lead-in can hold a glossary term, e.g. **[[DeFi]]:**.
      out.push(
        <strong key={i++} className="font-semibold text-ink">
          <RichText text={m[2]} />
        </strong>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  }
  return <>{out}</>;
}
