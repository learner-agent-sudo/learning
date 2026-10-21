// Shared look for collapsible cards (clause cards, provision cards).
export const CARD =
  'group relative overflow-hidden rounded-xl border border-line bg-panel shadow-card transition-shadow open:shadow-lift';
// The focus ring is inset because the card clips anything outside it.
export const SUMMARY =
  'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-ink/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-module [&::-webkit-details-marker]:hidden';
export const CHEVRON =
  'h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-90';
export const TITLE = 'flex-1 text-[15px] font-medium leading-snug';
export const PILL_BASE =
  'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider';
export const BODY = 'border-t border-line/80 px-4 pb-4 pt-3';
export const INNER_DISCLOSURE =
  'mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1 text-xs font-medium text-ink transition-colors hover:border-ink/30 focus-visible:outline-offset-1 [&::-webkit-details-marker]:hidden';
// Coloured edge marking a card's type; it sits inside <summary> so it shows
// while the card is closed.
export const EDGE = 'pointer-events-none absolute inset-y-0 left-0 w-1';
