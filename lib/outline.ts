// A stage's sub-chapters: its tabs, and the headed sections inside each tab.
// The contents rail and the floating contents sheet both draw from this.

export interface OutlineSection {
  id: string;
  label: string;
  // Marker for numbered sections, e.g. "§2".
  mark?: string;
}

export interface OutlineTab {
  id: string;
  label: string;
  sections: OutlineSection[];
}

export const sectionId = (prefix: string, i: number) => `${prefix}-s${i + 1}`;

/** The Essentials tab: the short version, the concept map, then the numbered notes. */
export function essentialsSections(
  idBase: string,
  stage: { conceptMap?: unknown; deepDive: { heading: string }[] },
  extra: OutlineSection[] = []
): OutlineSection[] {
  return [
    { id: `${idBase}-key`, label: 'In 30 seconds' },
    ...(stage.conceptMap ? [{ id: `${idBase}-map`, label: 'How it fits together' }] : []),
    ...stage.deepDive.map((d, i) => ({ id: sectionId(idBase, i), label: d.heading, mark: `§${i + 1}` })),
    ...extra,
  ];
}

/** The Notes tab: one section per non-empty note card. */
export function noteSections(idBase: string, cards: { key: string; label: string; items: unknown[] }[]): OutlineSection[] {
  return cards.filter((c) => c.items.length > 0).map((c) => ({ id: `${idBase}-${c.key}`, label: c.label }));
}

export const tab = (id: string, label: string, sections: OutlineSection[] = []): OutlineTab => ({ id, label, sections });
