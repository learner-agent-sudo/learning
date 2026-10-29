import data from '@/data/abbreviations.json';

/** Abbreviation → what it stands for (plus a few words of context). */
export type AbbrDict = Record<string, string>;

export const REGULATION_ABBR: AbbrDict = data.regulation;
export const MNA_ABBR: AbbrDict = data.mna;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = new WeakMap<AbbrDict, RegExp>();

/**
 * Matches whole abbreviations, with an optional plural "s" ("AIs"). Longest
 * first, so "AML/CFT" wins over "AML". Codes such as SA-2 or TM-G-1 are left
 * alone, as are letters inside longer words.
 */
export function abbrPattern(dict: AbbrDict): RegExp {
  let rx = patterns.get(dict);
  if (!rx) {
    const keys = Object.keys(dict).sort((a, b) => b.length - a.length).map(escape);
    rx = new RegExp(`(?<![\\w.&-])(${keys.join('|')})s?(?![\\w&-])`, 'g');
    patterns.set(dict, rx);
  }
  return rx;
}

// Fields that hold identifiers, links or codes rather than reading text.
const SKIP = new Set(['id', 'url', 'cap', 'section', 'kind', 'confidence', 'phase', 'review', 'type', 'dir', 'regime', 'group']);

/** Every reading string in a stage object, for the stage's abbreviation key. */
export function stageStrings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => stageStrings(n, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) if (!SKIP.has(k)) stageStrings(v, out);
  }
  return out;
}

/** Abbreviations used in the texts, in order of first appearance. */
export function abbreviationsIn(dict: AbbrDict, texts: string[]): string[] {
  const rx = abbrPattern(dict);
  const found = new Set<string>();
  for (const t of texts) {
    rx.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(t)) !== null) found.add(m[1]);
  }
  return [...found];
}
