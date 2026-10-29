import type { SectionVisualData, VisualItem } from './SectionVisual';

// Concept maps: boxes joined by arrows that name the relationship. Drawn with
// plain CSS so they print, need no script and follow the theme. The drawing is
// hidden from screen readers, which get the same links as a list of sentences.

const LINE = 'bg-phase/50';

function HeadDown() {
  return <span className="block h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-phase/80" />;
}

function HeadRight({ className = '' }: { className?: string }) {
  return (
    <span className={'block h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-phase/80 ' + className} />
  );
}

/** The relationship, written on its arrow. */
function Rel({ text }: { text: string }) {
  return (
    <span className="relative z-10 inline-block rounded-md border border-phase/25 bg-panel px-1.5 py-0.5 text-center text-[11.5px] font-medium leading-snug text-phase">
      {text}
    </span>
  );
}

function Box({ item, centre, left, className = '' }: { item: VisualItem; centre?: boolean; left?: boolean; className?: string }) {
  const tone = centre
    ? 'border-phase bg-phase text-onaccent shadow-card'
    : item.soft
      ? 'border-dashed border-phase/50 bg-paper'
      : 'border-phase/35 bg-panel shadow-card';
  return (
    <div className={`min-w-0 rounded-lg border px-2.5 py-2 leading-snug sm:px-3 ${tone} ${left ? 'text-left' : 'text-center'} ${className}`}>
      <p className="hyphens-auto text-[14px] font-semibold [overflow-wrap:break-word]">{item.label}</p>
      {item.value && <p className={'mt-0.5 font-mono text-[11px] ' + (centre ? 'text-onaccent' : 'text-phase')}>{item.value}</p>}
      {item.note && <p className={'mt-0.5 text-[12.5px] ' + (centre ? 'text-onaccent' : 'text-ink/70')}>{item.note}</p>}
    </div>
  );
}

// One relationship label for a whole row is written once, on the trunk.
function sharedRel(items: VisualItem[]): string | undefined {
  const r = items[0]?.rel;
  return items.length > 1 && r && items.every((it) => it.rel === r) ? r : undefined;
}

/** A vertical link with the relationship on it. */
function Trunk({ rel, head }: { rel?: string; head?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`h-3 w-px ${LINE}`} />
      {rel && (
        <>
          <Rel text={rel} />
          <span className={`h-2 w-px ${LINE}`} />
        </>
      )}
      {head && <HeadDown />}
    </div>
  );
}

// Grid columns for an org-chart row; the horizontal bus runs between the
// centres of the first and last cells.
const busPart = (i: number, n: number) => (i === 0 ? 'left-1/2 right-0' : i === n - 1 ? 'left-0 right-1/2' : 'left-0 right-0');

/** Boxes that point into the centre, side by side above it. */
function InRow({ items, shared }: { items: VisualItem[]; shared?: string }) {
  const n = items.length;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  return (
    <div className={'grid ' + (n === 1 ? 'mx-auto max-w-sm' : '')} style={cols}>
      {items.map((it, i) => (
        <div key={it.label} className="flex px-1 sm:px-1.5" style={{ gridColumn: i + 1, gridRow: 1 }}>
          <Box item={it} className="w-full" />
        </div>
      ))}
      {items.map((it, i) => (
        <div key={`${it.label}-link`} className="relative flex flex-col items-center px-1 sm:px-1.5" style={{ gridColumn: i + 1, gridRow: 2 }}>
          <span className={`h-2.5 w-px ${LINE}`} />
          {!shared && it.rel && <Rel text={it.rel} />}
          <span className={`min-h-2.5 w-px flex-1 ${LINE}`} />
          {n > 1 && <span className={`absolute bottom-0 h-px ${busPart(i, n)} ${LINE}`} />}
        </div>
      ))}
    </div>
  );
}

/** Boxes the centre points to, side by side below it. */
function OutRow({ items, shared, className = '' }: { items: VisualItem[]; shared?: string; className?: string }) {
  const n = items.length;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  return (
    <div className={'grid ' + (n === 1 ? 'mx-auto max-w-sm ' : '') + className} style={cols}>
      {items.map((it, i) => (
        <div key={`${it.label}-link`} className="relative flex flex-col items-center px-1 sm:px-1.5" style={{ gridColumn: i + 1, gridRow: 1 }}>
          {n > 1 && <span className={`absolute top-0 h-px ${busPart(i, n)} ${LINE}`} />}
          <span className={`min-h-2.5 w-px flex-1 ${LINE}`} />
          {!shared && it.rel && (
            <>
              <Rel text={it.rel} />
              <span className={`h-2 w-px ${LINE}`} />
            </>
          )}
          <HeadDown />
        </div>
      ))}
      {items.map((it, i) => (
        <div key={it.label} className="flex px-1 sm:px-1.5" style={{ gridColumn: i + 1, gridRow: 2 }}>
          <Box item={it} className="w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Boxes the centre points to, hanging off a line down its left side. On a
 * phone each relationship sits above its box; on wider screens beside it.
 */
function OutList({ items, shared, className = '' }: { items: VisualItem[]; shared?: string; className?: string }) {
  const n = items.length;
  return (
    <ul className={'ml-4 ' + className}>
      {items.map((it, i) => {
        const rel = shared ? undefined : it.rel;
        // The stub meets the relationship's first line, or the box's.
        const at = rel ? 'top-5' : 'top-[30px]';
        return (
          <li
            key={it.label}
            className={`relative pl-5 pt-3 sm:grid sm:items-center sm:py-1.5 sm:pl-0 ${rel ? 'sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]' : 'sm:grid-cols-[2.5rem_minmax(0,1fr)]'}`}
          >
            <span className={`absolute left-0 top-0 w-px ${LINE} ${i === n - 1 ? (rel ? 'h-5' : 'h-[30px]') + ' sm:bottom-1/2 sm:h-auto' : 'bottom-0'}`} />
            {/* Phone: stub and arrowhead pointing at the relationship */}
            <span className={`absolute left-0 h-px w-3 sm:hidden ${at} ${LINE}`} />
            <HeadRight className={`absolute left-3 -translate-y-1/2 sm:hidden ${at}`} />
            {/* Wider: one line from the spine through the relationship to the box */}
            <span className="relative hidden h-full min-h-8 items-center sm:flex">
              <span className={`absolute left-0 right-[7px] top-1/2 h-px ${LINE}`} />
              <HeadRight className="absolute right-0 top-1/2 -translate-y-1/2" />
              {rel && <span className="relative ml-4 mr-4"><Rel text={rel} /></span>}
            </span>
            {rel && <p className="mb-1 text-[11.5px] font-medium leading-snug text-phase sm:hidden">{rel}</p>}
            <Box item={it} left />
          </li>
        );
      })}
    </ul>
  );
}

function linkText(it: VisualItem) {
  const extra = [it.value, it.note].filter(Boolean).join('; ');
  return extra ? `${it.label} (${extra})` : it.label;
}

/** A centre box, with what points into it above and what it points to below. */
export function HubMap({ visual }: { visual: SectionVisualData }) {
  const centre = visual.centre!;
  const ins = visual.items.filter((it) => it.dir === 'in');
  const outs = visual.items.filter((it) => it.dir !== 'in');
  const inShared = sharedRel(ins);
  const outShared = sharedRel(outs);
  // Rows of up to four fit side by side on wider screens and up to two on a
  // phone; longer rows become a list hanging off the centre.
  const list = outs.length >= 5 ? 'all' : outs.length >= 3 ? 'phone' : 'none';
  const centreWidth = list === 'all' ? '' : list === 'phone' ? 'sm:mx-auto sm:max-w-sm' : 'mx-auto max-w-sm';
  return (
    <>
      <ul className="sr-only">
        {ins.map((it) => (
          <li key={it.label}>
            {linkText(it)} {inShared ?? it.rel ?? 'links to'} {centre.label}.
          </li>
        ))}
        {outs.map((it) => (
          <li key={it.label}>
            {centre.label} {outShared ?? it.rel ?? 'links to'} {linkText(it)}.
          </li>
        ))}
      </ul>
      <div aria-hidden>
        {ins.length > 0 && (
          <>
            <InRow items={ins} shared={inShared} />
            <Trunk rel={inShared} head />
          </>
        )}
        <Box item={centre} centre className={centreWidth} />
        {outs.length > 0 &&
          (list === 'all' ? (
            <>
              {outShared && <OutTrunkNote rel={outShared} />}
              <OutList items={outs} shared={outShared} />
            </>
          ) : (
            <>
              {list === 'phone' && (
                <div className="sm:hidden">
                  {outShared && <OutTrunkNote rel={outShared} />}
                  <OutList items={outs} shared={outShared} />
                </div>
              )}
              <div className={list === 'phone' ? 'hidden sm:block' : ''}>
                <Trunk rel={outShared} />
                <OutRow items={outs} shared={outShared} />
              </div>
            </>
          ))}
      </div>
    </>
  );
}

/** A relationship shared by every box in a list, written at the top of its spine. */
function OutTrunkNote({ rel }: { rel: string }) {
  return (
    <div className="relative ml-4 pl-5 pt-2">
      <span className={`absolute bottom-0 left-0 top-0 w-px ${LINE}`} />
      <p className="text-[11.5px] font-medium leading-snug text-phase">{rel}</p>
    </div>
  );
}

/** Boxes in a chain; each arrow names how one leads to the next. */
export function FlowMap({ visual }: { visual: SectionVisualData }) {
  const items = visual.items;
  const n = items.length;
  // Up to three boxes sit side by side from `md`, where each keeps about 150px;
  // longer chains run top to bottom.
  const row = n <= 3;
  const wrap = row ? 'md:flex-row md:items-center' : '';
  const box = row ? 'md:flex-1' : '';
  const vOnly = row ? 'md:hidden' : '';
  const hOnly = row ? 'hidden md:flex' : 'hidden';
  const gap = row ? 'md:w-24 md:flex-none' : '';
  return (
    <>
      <ol className="sr-only">
        {items.map((it, i) => (
          <li key={it.label}>
            {i > 0 && it.rel ? `Then, ${it.rel}: ` : ''}
            {linkText(it)}.
          </li>
        ))}
      </ol>
      <div aria-hidden className={`flex flex-col items-stretch ${wrap}`}>
        {items.map((it, i) => (
          <div key={it.label} className="contents">
            {i > 0 && (
              <div className={`flex flex-col items-center ${gap}`}>
                <div className={`flex flex-col items-center ${vOnly}`}>
                  <Trunk rel={it.rel} head />
                </div>
                <div className={`w-full flex-col items-stretch px-1 ${hOnly}`}>
                  {it.rel && <p className="mb-1 text-center text-[11.5px] font-medium leading-snug text-phase">{it.rel}</p>}
                  <div className="flex items-center">
                    <span className={`h-px flex-1 ${LINE}`} />
                    <HeadRight />
                  </div>
                </div>
              </div>
            )}
            <Box item={it} className={`mx-auto w-full max-w-md ${box}`} />
          </div>
        ))}
      </div>
    </>
  );
}
