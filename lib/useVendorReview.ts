'use client';

import { useCallback, useEffect, useState } from 'react';
import { load, save } from './useStudyState';

export type ReviewStatus = 'meets' | 'fallback' | 'gap' | 'na';

export const REVIEW_STATUSES: ReviewStatus[] = ['meets', 'fallback', 'gap', 'na'];

export interface ClauseReview {
  status?: ReviewStatus;
  note?: string;
}

export interface VendorReview {
  contract: string;
  items: Record<string, ClauseReview>;
}

const KEY = 'hk-banking:vendor-review:v2';
// Version 1 stored one "found" tick per clause, by position in this order.
const V1_KEY = 'hk-banking:vendor-review';
const V1_ORDER = [
  'scope-service-levels', 'hkma-access', 'audit-assessment', 'records-hk', 'confidentiality', 'pdpo-processor',
  'segregation-access', 'subcontracting', 'continuity-resilience', 'incidents', 'cap653', 'reporting-monitoring',
  'overseas-authorities', 'location', 'governing-law', 'termination-exit', 'intragroup', 'aml-vendors',
  'aml-intermediary', 'debt-collection', 'marketing-partners',
];

const EMPTY: VendorReview = { contract: '', items: {} };

function parse(v: unknown): VendorReview | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as { contract?: unknown; items?: unknown };
  const items: Record<string, ClauseReview> = {};
  if (o.items && typeof o.items === 'object') {
    for (const [id, raw] of Object.entries(o.items as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as { status?: unknown; note?: unknown };
      const entry: ClauseReview = {};
      if (REVIEW_STATUSES.includes(r.status as ReviewStatus)) entry.status = r.status as ReviewStatus;
      if (typeof r.note === 'string' && r.note) entry.note = r.note;
      if (entry.status || entry.note) items[id] = entry;
    }
  }
  return { contract: typeof o.contract === 'string' ? o.contract : '', items };
}

function migrate(): VendorReview | null {
  const old = load(V1_KEY);
  if (!Array.isArray(old) || !old.some((v) => v === true)) return null;
  const items: Record<string, ClauseReview> = {};
  old.forEach((v, i) => {
    if (v === true && V1_ORDER[i]) items[V1_ORDER[i]] = { status: 'meets' };
  });
  return { contract: '', items };
}

/** The review of one contract against the kit, kept in this browser. */
export function useVendorReview() {
  const [review, setReview] = useState<VendorReview>(EMPTY);

  useEffect(() => {
    const current = parse(load(KEY));
    if (current) {
      setReview(current);
      return;
    }
    const moved = migrate();
    if (moved) {
      save(KEY, moved);
      setReview(moved);
    }
  }, []);

  const update = useCallback((fn: (r: VendorReview) => VendorReview) => {
    setReview((prev) => {
      const next = fn(prev);
      save(KEY, next);
      return next;
    });
  }, []);

  const setItem = useCallback(
    (id: string, patch: ClauseReview) =>
      update((r) => {
        const merged = { ...r.items[id], ...patch };
        const items = { ...r.items };
        if (merged.status || merged.note) items[id] = merged;
        else delete items[id];
        return { ...r, items };
      }),
    [update]
  );

  return {
    review,
    setStatus: (id: string, status: ReviewStatus | undefined) => setItem(id, { status }),
    setNote: (id: string, note: string) => setItem(id, { note: note || undefined }),
    setContract: (contract: string) => update((r) => ({ ...r, contract })),
    reset: () => update(() => EMPTY),
  };
}
