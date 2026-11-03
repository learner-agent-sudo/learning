import type { Stage } from './workflow';
import { tab, type OutlineTab } from './outline';

export const mnaIdBase = (stageId: string) => `mna-${stageId}`;

/** Tabs and sections of a deal stage, in page order. */
export function mnaOutline(stage: Stage): OutlineTab[] {
  const idBase = mnaIdBase(stage.id);
  const cuad = stage.clauses.some((c) => c.provenance === 'cuad');
  const apa = stage.clauses.some((c) => c.provenance === 'hand-authored');
  return [
    tab('essentials', 'Essentials', [
      { id: `${idBase}-plain`, label: 'In plain terms' },
      { id: `${idBase}-practice`, label: "Practitioner's view" },
      ...(stage.clauses.length ? [{ id: `${idBase}-know`, label: 'Clauses to know at this stage' }] : []),
    ]),
    tab('documents', 'Documents'),
    tab('clauses', 'Clauses', [
      ...(cuad ? [{ id: `${idBase}-cuad`, label: 'From real contracts (CUAD)' }] : []),
      ...(apa ? [{ id: `${idBase}-apa`, label: 'APA-specific drafting' }] : []),
    ]),
    tab('glossary', 'Glossary'),
  ];
}
