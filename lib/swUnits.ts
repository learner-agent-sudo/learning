// The blocks of a software IP stage that count as read, and the sentences in
// them a Desk answer can quote. scripts/check_desk.py mirrors swSources(), so a
// quote that no longer matches the stage text fails the build.

import { PLACES, SW_STAGES, type SwStage } from './softwareIp';
import { SW_HK as HK, SW_NOTE_CARDS as N, swHkPrefix, swIdBase } from './softwareIpOutline';
import { makeUnit, plainText, type SeenUnit } from './seen';

export const SW_MODULE = 'software-ip';

/** A provision card's anchor: instrument and reference, slugged. */
export function provisionUnitId(stageId: string, p: { instrument: string; ref: string }): string {
  const slug = `${p.instrument} ${p.ref}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${swIdBase(stageId)}-prov-${slug}`;
}

export const headUnitId = (stageId: string) => `${swIdBase(stageId)}-head`;
export const checklistUnitId = (stageId: string) => `${swIdBase(stageId)}-checklist`;

/** One sentence or bullet of a stage, with the block it belongs to. */
export interface SwSource {
  unit: string;
  raw: string;
  plain: string;
}

/** Every quotable string of a stage, in page order. */
export function swSources(stage: SwStage): SwSource[] {
  const b = swIdBase(stage.id);
  const out: SwSource[] = [];
  const add = (unit: string, raw?: string) => {
    if (raw) out.push({ unit, raw, plain: plainText(raw) });
  };
  add(headUnitId(stage.id), stage.oneLiner);
  stage.keyPoints.forEach((t) => add(`${b}-key`, t));
  stage.deepDive.forEach((d, i) => {
    const u = `${b}-s${i + 1}`;
    add(u, d.lede);
    d.points.forEach((t) => add(u, t));
    add(u, d.takeaway);
  });
  const hk = stage.hongKong;
  if (hk) {
    add(`${b}-${HK.key.key}`, hk.summary);
    hk.keyPoints.forEach((t) => add(`${b}-${HK.key.key}`, t));
    hk.sections.forEach((d, i) => {
      const u = `${swHkPrefix(stage.id)}-s${i + 1}`;
      add(u, d.lede);
      d.points.forEach((t) => add(u, t));
      add(u, d.takeaway);
    });
    hk.provisions.forEach((p) => {
      const u = provisionUnitId(stage.id, p);
      add(u, p.summary);
      add(u, p.counselNote);
    });
    hk.bankNotes.forEach((t) => add(`${b}-${HK.bank.key}`, t));
  }
  stage.itAngle.forEach((t) => add(`${b}-${N.eng.key}`, t));
  stage.virtualBankNotes.forEach((t) => add(`${b}-${N.bank.key}`, t));
  (stage.productNotes ?? []).forEach((t) => add(`${b}-${N.product.key}`, t));
  (stage.elsewhere ?? []).forEach((e) => e.points.forEach((t) => add(`${b}-${N.elsewhere.key}-${e.place.toLowerCase()}`, t)));
  stage.pitfalls.forEach((t) => add(`${b}-${N.pitfalls.key}`, t));
  stage.provisions.forEach((p) => {
    const u = provisionUnitId(stage.id, p);
    add(u, p.summary);
    add(u, p.counselNote);
  });
  stage.checklist.forEach((t) => add(checklistUnitId(stage.id), t));
  return out;
}

/** The blocks of a stage that the reading record tracks, with their tab. */
export function swUnits(stage: SwStage): SeenUnit[] {
  const b = swIdBase(stage.id);
  const s = stage.id;
  const units: SeenUnit[] = [
    makeUnit(headUnitId(s), s, 'essentials', 'Summary', [stage.oneLiner]),
    makeUnit(`${b}-key`, s, 'essentials', 'In 30 seconds', stage.keyPoints),
    ...stage.deepDive.map((d, i) =>
      makeUnit(`${b}-s${i + 1}`, s, 'essentials', `§${i + 1} ${d.heading}`, [d.heading, d.lede, ...d.points, d.takeaway])
    ),
  ];
  const hk = stage.hongKong;
  if (hk) {
    units.push(makeUnit(`${b}-${HK.key.key}`, s, 'hongkong', HK.key.label, [hk.summary, ...hk.keyPoints]));
    hk.sections.forEach((d, i) =>
      units.push(
        makeUnit(`${swHkPrefix(s)}-s${i + 1}`, s, 'hongkong', `Hong Kong §${i + 1} ${d.heading}`, [d.heading, d.lede, ...d.points, d.takeaway])
      )
    );
    for (const p of hk.provisions) {
      units.push(makeUnit(provisionUnitId(s, p), s, 'hongkong', `${p.title} (${p.ref})`, [p.title, p.summary, p.counselNote]));
    }
    if (hk.bankNotes.length) units.push(makeUnit(`${b}-${HK.bank.key}`, s, 'hongkong', HK.bank.label, hk.bankNotes));
  }
  if (stage.itAngle.length) units.push(makeUnit(`${b}-${N.eng.key}`, s, 'notes', N.eng.label, stage.itAngle));
  if (stage.virtualBankNotes.length) units.push(makeUnit(`${b}-${N.bank.key}`, s, 'notes', N.bank.label, stage.virtualBankNotes));
  if (stage.productNotes?.length) units.push(makeUnit(`${b}-${N.product.key}`, s, 'notes', N.product.label, stage.productNotes));
  for (const e of stage.elsewhere ?? []) {
    units.push(makeUnit(`${b}-${N.elsewhere.key}-${e.place.toLowerCase()}`, s, 'notes', `${N.elsewhere.label}: ${PLACES[e.place]}`, e.points));
  }
  if (stage.pitfalls.length) units.push(makeUnit(`${b}-${N.pitfalls.key}`, s, 'notes', N.pitfalls.label, stage.pitfalls));
  for (const p of stage.provisions) {
    units.push(makeUnit(provisionUnitId(s, p), s, 'provisions', `${p.title} (${p.ref})`, [p.title, p.summary, p.counselNote]));
  }
  if (stage.checklist.length) units.push(makeUnit(checklistUnitId(s), s, 'checklist', 'Checklist', stage.checklist));
  return units;
}

export const SW_UNITS: SeenUnit[] = SW_STAGES.flatMap(swUnits);
export const SW_UNIT_BY_ID: Record<string, SeenUnit> = Object.fromEntries(SW_UNITS.map((u) => [u.id, u]));
