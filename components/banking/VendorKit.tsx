'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Check, ChevronRight, CircleCheck, Cloud, Copy, Download, ExternalLink, FileSpreadsheet,
  Flag, Handshake, Minus, PenLine, RotateCcw, Signature, TriangleAlert, Undo2,
} from 'lucide-react';
import type { ClausePlaybook, ContractTerm, KitPlaybook, Stance, Strength, VendorKit as Kit } from '@/lib/banking';
import { load, save } from '@/lib/useStudyState';
import { REVIEW_STATUSES, useVendorReview, type ReviewStatus } from '@/lib/useVendorReview';
import {
  STANCE_LABEL, STATUS_LABEL, download, exportName, modelText, plain, playbookMarkdown, reviewCsv,
} from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { BODY, CARD, CHEVRON, EDGE, INNER_DISCLOSURE, PILL_BASE, SUMMARY, TITLE } from '../cardStyles';
import { BulletList, SectionedPoints, SectionTitle } from '../ui/Bullets';
import { SectionVisual } from '../ui/SectionVisual';

// Legal force of a source, strongest first.
export const STRENGTH: Record<Strength, { label: string; pill: string; bar: string; title: string }> = {
  statute: {
    label: 'Statute',
    pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200',
    bar: 'bg-indigo-500',
    title: 'Legislation: binding, with legal consequences for breach',
  },
  'statutory-guideline': {
    label: 'Statutory guideline',
    pill: 'bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200',
    bar: 'bg-violet-500',
    title: 'Guideline issued under statute: s.7(3) or s.16(10) of the Banking Ordinance, or s.7 of the AMLO',
  },
  'hkma-guidance': {
    label: 'HKMA guidance',
    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
    bar: 'bg-sky-500',
    title: 'Non-statutory HKMA expectation, assessed against the Seventh Schedule criteria',
  },
  'industry-code': {
    label: 'Industry code',
    pill: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    bar: 'bg-amber-500',
    title: 'Code of Banking Practice: non-statutory, but the HKMA monitors compliance',
  },
  'good-practice': {
    label: 'Good practice',
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-200',
    bar: 'bg-slate-400',
    title: 'Not required by a source; what experienced counsel would add',
  },
};

const ORDER: Strength[] = ['statute', 'statutory-guideline', 'hkma-guidance', 'industry-code', 'good-practice'];

// How hard to hold the line in negotiation.
export const STANCE: Record<Stance, { chip: string; dot: string; title: string }> = {
  'must-have': {
    chip: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-300/25',
    dot: 'bg-rose-500',
    title: 'Required by statute, a statutory guideline or an HKMA "must": do not sign without it',
  },
  expected: {
    chip: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-400/15 dark:text-orange-200 dark:ring-orange-300/25',
    dot: 'bg-orange-500',
    title: 'Expected by HKMA guidance or the Code: a deviation needs a recorded reason and sign-off',
  },
  negotiable: {
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/25',
    dot: 'bg-emerald-500',
    title: 'Good practice: trade it commercially',
  },
};

const STANCES: Stance[] = ['must-have', 'expected', 'negotiable'];

const STATUS: Record<ReviewStatus, { icon: typeof Check; on: string; pill: string }> = {
  meets: {
    icon: CircleCheck,
    on: 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-paper',
    pill: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
  },
  fallback: {
    icon: Handshake,
    on: 'border-sky-700 bg-sky-700 text-white dark:border-sky-300 dark:bg-sky-300 dark:text-paper',
    pill: 'bg-sky-50 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
  },
  gap: {
    icon: TriangleAlert,
    on: 'border-rose-700 bg-rose-700 text-white dark:border-rose-300 dark:bg-rose-300 dark:text-paper',
    pill: 'bg-rose-50 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
  },
  na: {
    icon: Minus,
    on: 'border-slate-600 bg-slate-600 text-white dark:border-slate-300 dark:bg-slate-300 dark:text-paper',
    pill: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200',
  },
};

const STATUS_HINT: Record<ReviewStatus, string> = {
  meets: 'The draft meets the preferred position, or is better',
  fallback: 'Accepted on a fallback position',
  gap: 'Missing or below a red line: mark up or escalate',
  na: 'Does not apply to this contract',
};

export const APPLIES: Record<string, string> = {
  all: 'Every outsourcing',
  material: 'Material outsourcing',
  'personal-data': 'Personal data',
  offshore: 'Offshore or cloud',
  critical: 'Critical operations',
  intragroup: 'Intragroup',
  aml: 'AML & KYC',
  agents: 'Agents & partners',
};

type View = 'require' | 'playbook' | 'sources';
const VIEW_KEY = 'hk-banking:vendor-view';
const VIEWS: { id: View; label: string }[] = [
  { id: 'require', label: 'Requirements' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'sources', label: 'Sources' },
];

// The badge shows the clause's main source, which is listed first.
function primary(t: ContractTerm): Strength {
  return t.sources[0]?.strength ?? 'good-practice';
}

const today = () => new Date().toISOString().slice(0, 10);

/** Model wording with each outermost [choice] highlighted. */
function Bracketed({ text }: { text: string }) {
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

function CopyButton({ text, label }: { text: string; label: string }) {
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

function Block({ title, icon, children, tone = '' }: { title: string; icon?: ReactNode; children: ReactNode; tone?: string }) {
  return (
    <div>
      <h4 className={`kicker mb-2 flex items-center gap-1.5 ${tone}`}>
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function Positions({ pb }: { pb: ClausePlaybook }) {
  const rows: { label: string; items: string[]; tone: string }[] = [
    { label: 'Preferred', items: pb.preferred, tone: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Fallback', items: pb.fallback, tone: 'text-sky-700 dark:text-sky-300' },
    { label: 'Red line', items: pb.redLines, tone: 'text-rose-700 dark:text-rose-300' },
  ];
  return (
    <div className="divide-y divide-line/80 rounded-lg border border-line">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-x-4 gap-y-1.5 px-3.5 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
          <h5 className={`pt-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] ${r.tone}`}>{r.label}</h5>
          <BulletList items={r.items} />
        </div>
      ))}
    </div>
  );
}

function PlaybookView({ term, pb }: { term: ContractTerm; pb: ClausePlaybook }) {
  const st = STANCE[pb.stance];
  return (
    <div className="space-y-5">
      <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ring-1 ${st.chip}`}>
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">{STANCE_LABEL[pb.stance]}</span>
        <span className="text-ink/85">
          <RichText text={pb.why} />
        </span>
      </p>
      <Positions pb={pb} />
      <div className="rounded-lg bg-paper px-4 py-3.5 ring-1 ring-line">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h4 className="kicker flex items-center gap-1.5">
            <Signature className="h-3.5 w-3.5" aria-hidden /> Model clause
          </h4>
          <CopyButton text={modelText(term)} label="Copy clause" />
        </div>
        <div className="space-y-2.5 font-serif text-[1.02rem] leading-relaxed">
          {pb.model.map((m, i) => (
            <p key={i}>
              <Bracketed text={m} />
            </p>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted">
          Bracketed text marks a choice or an illustrative figure. Defined terms are listed above the clauses.
        </p>
      </div>
      <Block title="Watch for in the vendor's draft" icon={<TriangleAlert className="h-3.5 w-3.5" aria-hidden />}>
        <BulletList items={pb.watchFor} />
      </Block>
      <Block title="If the vendor pushes back" icon={<Undo2 className="h-3.5 w-3.5" aria-hidden />}>
        <dl className="space-y-3">
          {pb.pushback.map((p) => (
            <div key={p.says} className="rounded-lg border border-line px-3.5 py-2.5">
              <dt className="text-sm italic text-ink/80">
                <span className="mr-1.5 font-mono text-[10.5px] not-italic uppercase tracking-[0.12em] text-muted">Vendor</span>
                <RichText text={p.says} />
              </dt>
              <dd className="mt-1.5 leading-relaxed">
                <span className="mr-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-phase">Reply</span>
                <RichText text={p.reply} />
              </dd>
            </div>
          ))}
        </dl>
      </Block>
      {term.drafting && term.drafting.length > 0 && (
        <div className="rounded-lg bg-phase/[0.06] px-3.5 py-3 ring-1 ring-phase/15">
          <h4 className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-phase">
            <PenLine className="h-3.5 w-3.5" aria-hidden /> More drafting notes
          </h4>
          <BulletList items={term.drafting} />
        </div>
      )}
      <p className="flex gap-2.5 text-sm leading-relaxed">
        <Flag className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span>
          <span className="font-semibold">Escalate: </span>
          <RichText text={pb.escalate} />
        </span>
      </p>
    </div>
  );
}

function RequireView({ term }: { term: ContractTerm }) {
  return (
    <div className="space-y-4">
      <p className="leading-relaxed">
        <RichText text={term.summary} />
      </p>
      <Block title="The contract should">
        <BulletList items={term.require} />
      </Block>
      {!term.playbook && term.drafting && term.drafting.length > 0 && (
        <div className="rounded-lg bg-phase/[0.06] px-3.5 py-3 ring-1 ring-phase/15">
          <h4 className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-phase">
            <PenLine className="h-3.5 w-3.5" aria-hidden /> Drafting and negotiation
          </h4>
          <BulletList items={term.drafting} />
        </div>
      )}
      {term.cloud && (
        <p className="flex gap-2.5 rounded-lg bg-sky-50/70 px-3.5 py-2.5 text-sm leading-relaxed ring-1 ring-sky-200/60 dark:bg-sky-400/10 dark:ring-sky-300/20">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
          <span>
            <span className="font-semibold">Cloud and SaaS: </span>
            <RichText text={term.cloud} />
          </span>
        </p>
      )}
    </div>
  );
}

function SourcesView({ term }: { term: ContractTerm }) {
  return (
    <ul className="space-y-2.5">
      {term.sources.map((s) => {
        const st = STRENGTH[s.strength];
        return (
          <li key={`${s.label}-${s.ref}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
            <span className={`${PILL_BASE} ${st.pill}`} title={st.title}>
              {st.label}
            </span>
            <span className="font-medium">{s.label}</span>
            <span className="font-mono text-[12px] text-muted">{s.ref}</span>
            {s.note && <span className="w-full text-[13px] text-ink/70">{s.note}</span>}
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-2"
              >
                Source <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ReviewBar({
  term, status, note, onStatus, onNote,
}: {
  term: ContractTerm;
  status?: ReviewStatus;
  note?: string;
  onStatus: (s: ReviewStatus | undefined) => void;
  onNote: (n: string) => void;
}) {
  return (
    <div className="mt-5 space-y-2.5 border-t border-line/80 pt-4">
      <fieldset>
        <legend className="kicker mb-2">This contract</legend>
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_STATUSES.map((s) => {
            const Icon = STATUS[s].icon;
            const on = status === s;
            return (
              <label key={s} title={STATUS_HINT[s]} className="cursor-pointer">
                <input
                  type="radio"
                  name={`status-${term.id}`}
                  value={s}
                  checked={on}
                  onChange={() => onStatus(s)}
                  onClick={() => on && onStatus(undefined)}
                  className="peer sr-only"
                />
                <span
                  className={
                    'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-phase peer-focus-visible:ring-offset-1 ' +
                    (on ? STATUS[s].on : 'border-line bg-panel text-muted hover:text-ink')
                  }
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {STATUS_LABEL[s]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="block">
        <span className="sr-only">Notes on {term.title} for this contract</span>
        <textarea
          value={note ?? ''}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          placeholder="Notes: clause number in the draft, markup sent, who approved a deviation…"
          className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm leading-relaxed placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
        />
      </label>
    </div>
  );
}

function ViewTabs({ id, view, views, onView }: { id: string; view: View; views: typeof VIEWS; onView: (v: View) => void }) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = views.findIndex((v) => v.id === view);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = views[(i + step + views.length) % views.length].id;
    onView(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  return (
    <div role="tablist" aria-label="Clause view" className="mb-4 inline-flex rounded-full border border-line bg-paper p-0.5">
      {views.map((v) => {
        const on = v.id === view;
        return (
          <button
            key={v.id}
            id={`${id}-tab-${v.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`${id}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onView(v.id)}
            onKeyDown={onKey}
            className={
              'min-h-8 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-offset-1 ' +
              (on ? 'bg-ink text-paper' : 'text-muted hover:text-ink')
            }
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

function TermCard({
  term, view, onView, status, note, onStatus, onNote,
}: {
  term: ContractTerm;
  view: View;
  onView: (v: View) => void;
  status?: ReviewStatus;
  note?: string;
  onStatus: (s: ReviewStatus | undefined) => void;
  onNote: (n: string) => void;
}) {
  const top = STRENGTH[primary(term)];
  const pb = term.playbook;
  const views = pb ? VIEWS : VIEWS.filter((v) => v.id !== 'playbook');
  const shown = views.some((v) => v.id === view) ? view : 'require';
  const tabId = `term-${term.id}`;
  const StatusIcon = status ? STATUS[status].icon : null;
  return (
    <details id={tabId} className={`${CARD} min-w-0`}>
      <summary className={SUMMARY}>
        <span aria-hidden className={`${EDGE} ${top.bar}`} />
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={`${TITLE} min-w-0`}>
          {term.title}
          <span className="mt-1 line-clamp-2 text-[13px] font-normal leading-snug text-ink/65 group-open:hidden">
            {term.summary}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1">
            {pb && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-px text-[10.5px] font-medium ring-1 ${STANCE[pb.stance].chip}`}
                title={STANCE[pb.stance].title}
              >
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STANCE[pb.stance].dot}`} />
                {STANCE_LABEL[pb.stance]}
              </span>
            )}
            {term.appliesTo.map((a) => (
              <span key={a} className="rounded-full bg-ink/[0.06] px-2 py-px text-[10.5px] font-normal text-muted">
                {APPLIES[a] ?? a}
              </span>
            ))}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`${PILL_BASE} ${top.pill}`} title={top.title}>
            {top.label}
          </span>
          {status && StatusIcon && (
            <span className={`${PILL_BASE} inline-flex items-center gap-1 ${STATUS[status].pill}`} title={STATUS_HINT[status]}>
              <StatusIcon className="h-3 w-3" aria-hidden />
              {STATUS_LABEL[status]}
            </span>
          )}
        </span>
      </summary>
      <div className={`${BODY} break-words`}>
        <ViewTabs id={tabId} view={shown} views={views} onView={onView} />
        <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-tab-${shown}`}>
          {shown === 'require' && <RequireView term={term} />}
          {shown === 'playbook' && pb && <PlaybookView term={term} pb={pb} />}
          {shown === 'sources' && <SourcesView term={term} />}
        </div>
        <ReviewBar term={term} status={status} note={note} onStatus={onStatus} onNote={onNote} />
      </div>
    </details>
  );
}

function PlaybookGuide({ kit }: { kit: KitPlaybook }) {
  return (
    <div className="mb-5 rounded-xl border border-phase/25 bg-phase/[0.05] px-4 py-4 sm:px-5">
      <h3 className="kicker text-phase">Using the playbook</h3>
      <BulletList items={kit.intro} className="mt-3" />
      <ul className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Stances">
        {STANCES.map((s) => (
          <li key={s} className={`rounded-lg px-3 py-2 text-[13px] leading-snug ring-1 ${STANCE[s].chip}`}>
            <span className="mb-0.5 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STANCE[s].dot}`} />
              {STANCE_LABEL[s]}
            </span>
            {STANCE[s].title}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <details className="group/d w-full">
          <summary className={INNER_DISCLOSURE}>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/d:rotate-90" aria-hidden />
            Who approves a deviation
          </summary>
          <BulletList items={kit.escalation} className="mt-3" />
        </details>
        <details className="group/e w-full">
          <summary className={INNER_DISCLOSURE}>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/e:rotate-90" aria-hidden />
            Defined terms used in the model clauses
          </summary>
          <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
            {kit.definitions.map((d) => (
              <div key={d.term} className="contents">
                <dt className="font-serif font-semibold">&lsquo;{d.term}&rsquo;</dt>
                <dd className="leading-relaxed text-ink/85">
                  <RichText text={d.meaning} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3">
            <CopyButton text={kit.definitions.map((d) => `"${d.term}" ${plain(d.meaning)}`).join('\n\n')} label="Copy definitions" />
          </div>
        </details>
      </div>
    </div>
  );
}

const chipClass = (on: boolean) =>
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors focus-visible:outline-offset-1 ' +
  (on ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-muted hover:text-ink');

/** Vendor-contract toolkit: lifecycle, clauses with sources and playbook, and a review tracker. */
export function VendorKit({ kit }: { kit: Kit }) {
  const [filter, setFilter] = useState('all-terms');
  const [stance, setStance] = useState<Stance | 'any'>('any');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'open' | 'any'>('any');
  const [view, setView] = useState<View>('require');
  const { review, setStatus, setNote, setContract, reset } = useVendorReview();

  useEffect(() => {
    const v = load(VIEW_KEY);
    if (v === 'require' || v === 'playbook' || v === 'sources') setView(v);
  }, []);
  const changeView = (v: View) => {
    setView(v);
    save(VIEW_KEY, v);
  };

  const tags = Array.from(new Set(kit.terms.flatMap((t) => t.appliesTo)));
  const statusOf = (t: ContractTerm) => review.items[t.id]?.status;
  const shown = kit.terms.filter(
    (t) =>
      (filter === 'all-terms' || t.appliesTo.includes(filter)) &&
      (stance === 'any' || t.playbook?.stance === stance) &&
      (statusFilter === 'any' || (statusFilter === 'open' ? !statusOf(t) : statusOf(t) === statusFilter))
  );
  const count = (s: ReviewStatus | 'open') =>
    kit.terms.filter((t) => (s === 'open' ? !statusOf(t) : statusOf(t) === s)).length;
  const reviewed = kit.terms.length - count('open');
  const hasPlaybook = kit.terms.some((t) => t.playbook);
  const started = reviewed > 0 || Object.values(review.items).some((r) => r.note) || review.contract !== '';

  const exportCsv = () => {
    const d = today();
    download(exportName(review.contract, 'csv', d), reviewCsv(kit.terms, review, (a) => APPLIES[a] ?? a), 'text/csv;charset=utf-8');
  };
  const exportMd = () => {
    const d = today();
    download(exportName(review.contract, 'md', d), playbookMarkdown(kit.terms, kit.playbook, review, d), 'text/markdown;charset=utf-8');
  };
  const clear = () => {
    if (window.confirm('Clear the status and notes for every clause, and the contract name?')) reset();
  };

  const statusChip = (s: ReviewStatus | 'open', label: string) => (
    <button
      key={s}
      type="button"
      onClick={() => setStatusFilter(statusFilter === s ? 'any' : s)}
      aria-pressed={statusFilter === s}
      title={s === 'open' ? 'Clauses not yet reviewed' : STATUS_HINT[s]}
      className={chipClass(statusFilter === s)}
    >
      {label}
      <span className="font-mono tabular-nums">{count(s)}</span>
    </button>
  );

  return (
    <div className="space-y-10">
      <section>
        <BulletList items={kit.intro} />
        <SectionVisual visual={kit.lifecycle} />
      </section>

      <section>
        <SectionTitle
          aside={
            <span className="font-mono text-xs text-muted">
              {reviewed}/{kit.terms.length} reviewed
            </span>
          }
        >
          Clauses the contract needs
        </SectionTitle>
        {kit.playbook && <PlaybookGuide kit={kit.playbook} />}
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Each card has three views: what the sources require, the negotiation playbook with model wording, and the
          sources with their legal force. Mark each clause against the contract you are reviewing; the status and notes
          stay in this browser and go into the downloads.
        </p>

        <div className="mb-4 rounded-xl border border-line bg-panel px-4 py-3.5 shadow-card">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[14rem] flex-1">
              <span className="kicker mb-1.5 block">Contract under review</span>
              <input
                type="text"
                value={review.contract}
                onChange={(e) => setContract(e.target.value)}
                placeholder="e.g. Cloud hosting MSA, Supplier draft v3"
                className="block min-h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-paper hover:bg-ink/90"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden /> Spreadsheet (.csv)
              </button>
              {hasPlaybook && (
                <button
                  type="button"
                  onClick={exportMd}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs font-medium text-ink hover:border-ink/30"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> Playbook (.md)
                </button>
              )}
              {started && (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-xs text-ink hover:border-ink/30"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear review
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Show clauses with review status">
            {statusChip('open', 'Not reviewed')}
            {REVIEW_STATUSES.map((s) => statusChip(s, STATUS_LABEL[s]))}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Show clauses that apply to">
          {[{ id: 'all-terms', label: `All ${kit.terms.length}` }, ...tags.map((t) => ({ id: t, label: APPLIES[t] ?? t }))].map(
            (c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                aria-pressed={filter === c.id}
                className={chipClass(filter === c.id)}
              >
                {c.label}
              </button>
            )
          )}
        </div>
        {hasPlaybook && (
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Show clauses with stance">
            {STANCES.map((s) => {
              const n = kit.terms.filter((t) => t.playbook?.stance === s).length;
              return n === 0 ? null : (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStance(stance === s ? 'any' : s)}
                  aria-pressed={stance === s}
                  title={STANCE[s].title}
                  className={chipClass(stance === s)}
                >
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STANCE[s].dot}`} />
                  {STANCE_LABEL[s]}
                  <span className="font-mono tabular-nums">{n}</span>
                </button>
              );
            })}
          </div>
        )}
        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted" aria-label="Source strength">
          {ORDER.map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5" title={STRENGTH[s].title}>
              <span className={`h-2 w-2 rounded-full ${STRENGTH[s].bar}`} aria-hidden />
              {STRENGTH[s].label}
            </li>
          ))}
        </ul>

        <div className="grid gap-3">
          {shown.map((t) => (
            <TermCard
              key={t.id}
              term={t}
              view={view}
              onView={changeView}
              status={review.items[t.id]?.status}
              note={review.items[t.id]?.note}
              onStatus={(s) => setStatus(t.id, s)}
              onNote={(n) => setNote(t.id, n)}
            />
          ))}
          {shown.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No clause matches these filters.
            </p>
          )}
        </div>
      </section>

      {kit.process.length > 0 && (
        <section>
          <SectionTitle>Around the contract</SectionTitle>
          <SectionedPoints sections={kit.process} />
        </section>
      )}

      {kit.caveat && (
        <p className="rounded-lg border border-line px-4 py-3 text-xs leading-relaxed text-muted">
          <RichText text={kit.caveat} />
        </p>
      )}
    </div>
  );
}
