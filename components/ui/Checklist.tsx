'use client';

import { useEffect, useState } from 'react';
import { Check, Download, FileSpreadsheet, StickyNote } from 'lucide-react';
import { load, save } from '@/lib/useStudyState';
import { download, plain } from '@/lib/vendorExport';
import { RichText } from '../RichText';
import { chipClass } from '../cardStyles';

interface Props {
  items: string[];
  ticks: boolean[];
  onToggle: (i: number) => void;
  // Where this list's notes are kept in the browser; without it, no notes.
  notesKey?: string;
  // What the list is for, used in the downloads (e.g. "HK banking: 6. Technology & outsourcing").
  title?: string;
}

type Filter = 'all' | 'open' | 'done';

const today = () => new Date().toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'checklist';
const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function checklistMarkdown(title: string, items: string[], ticks: boolean[], notes: string[], date: string): string {
  const done = ticks.filter(Boolean).length;
  const lines = [`# Checklist: ${title}`, '', `Exported ${date}. ${done} of ${items.length} done.`, ''];
  items.forEach((item, i) => {
    lines.push(`- [${ticks[i] ? 'x' : ' '}] ${plain(item)}`);
    const note = notes[i]?.trim();
    if (note) lines.push(...note.split('\n').map((l, j) => `  ${j === 0 ? '*Note:* ' : ''}${l}`));
  });
  lines.push('', 'Study material, not legal advice.', '');
  return lines.join('\n');
}

function checklistCsv(items: string[], ticks: boolean[], notes: string[]): string {
  const rows = [['#', 'Item', 'Done', 'Note'], ...items.map((item, i) => [String(i + 1), plain(item), ticks[i] ? 'yes' : 'no', notes[i] ?? ''])];
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

/**
 * A stage's to-do list with a progress bar, a filter for open and done items,
 * a note per item (who owns it, where the evidence is) and downloads for the
 * file. Ticks are kept by the caller; notes are kept here under notesKey.
 */
export function Checklist({ items, ticks, onToggle, notesKey, title = 'Checklist' }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [notes, setNotes] = useState<string[]>([]);
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    if (!notesKey) return;
    const v = load(notesKey);
    setNotes(Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : '')) : []);
  }, [notesKey]);

  const setNote = (i: number, text: string) => {
    setNotes((prev) => {
      const next = Array.from({ length: Math.max(prev.length, items.length) }, (_, j) => prev[j] ?? '');
      next[i] = text;
      if (notesKey) save(notesKey, next);
      return next;
    });
  };

  const done = ticks.filter(Boolean).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const shown = items.map((item, i) => ({ item, i })).filter(({ i }) => filter === 'all' || (filter === 'done') === !!ticks[i]);
  const counts: Record<Filter, number> = { all: items.length, open: items.length - done, done };
  const exportMd = () => download(`checklist-${slug(title)}-${today()}.md`, checklistMarkdown(title, items, ticks, notes, today()), 'text/markdown;charset=utf-8');
  const exportCsv = () => download(`checklist-${slug(title)}-${today()}.csv`, checklistCsv(items, ticks, notes), 'text/csv;charset=utf-8');

  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-phase transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs text-muted">
          {done}/{items.length} done
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show items">
          {(['all', 'open', 'done'] as Filter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={chipClass(filter === f)}>
              {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Done'}
              <span className="font-mono tabular-nums">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={exportMd}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-xs font-medium text-ink hover:border-ink/30"
          >
            <Download className="h-3.5 w-3.5" aria-hidden /> Markdown
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-xs font-medium text-ink hover:border-ink/30"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden /> Spreadsheet
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {shown.map(({ item, i }) => {
          const on = ticks[i] ?? false;
          const note = notes[i] ?? '';
          const open = editing === i;
          const noteId = `${notesKey ?? 'checklist'}-note-${i}`;
          return (
            <li
              key={`${i}-${item.slice(0, 24)}`}
              className={
                'rounded-xl border transition-colors ' +
                (on ? 'border-phase/30 bg-phase/[0.05]' : 'border-line bg-panel shadow-card hover:border-ink/25')
              }
            >
              <div className="flex items-start">
                <label
                  className={
                    'flex min-w-0 flex-1 cursor-pointer items-start gap-3.5 rounded-xl px-4 py-3 leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-phase ' +
                    (on ? 'text-ink/70' : '')
                  }
                >
                  <input type="checkbox" checked={on} onChange={() => onToggle(i)} className="peer sr-only" />
                  <span
                    aria-hidden
                    className={
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ' +
                      (on ? 'border-phase bg-phase text-onaccent' : 'border-ink/60 bg-panel')
                    }
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span>
                    <RichText text={item} />
                  </span>
                </label>
                {notesKey && (
                  <button
                    type="button"
                    onClick={() => setEditing(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={noteId}
                    title={note ? 'Edit the note' : 'Add a note: owner, evidence, date'}
                    className={
                      'mr-1.5 mt-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-ink/[0.06] ' +
                      (note || open ? 'text-phase' : 'text-muted')
                    }
                  >
                    <StickyNote className="h-4 w-4" aria-hidden />
                    <span className="sr-only">{note ? 'Edit note' : 'Add note'}</span>
                  </button>
                )}
              </div>
              {notesKey && open && (
                <div id={noteId} className="px-4 pb-3">
                  <label className="block">
                    <span className="sr-only">Note on item {i + 1}</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(i, e.target.value)}
                      rows={2}
                      autoFocus
                      placeholder="Owner, evidence, date, open points…"
                      className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-base leading-relaxed placeholder:text-muted/80 focus:border-phase focus:outline-none focus:ring-1 focus:ring-phase"
                    />
                  </label>
                </div>
              )}
              {notesKey && !open && note.trim() && (
                <p id={noteId} className="whitespace-pre-wrap px-4 pb-3 pl-[3.25rem] text-[13px] leading-snug text-ink/70">
                  {note}
                </p>
              )}
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            {filter === 'done' ? 'Nothing ticked yet.' : 'Everything here is done.'}
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Ticks{notesKey ? ' and notes' : ''} are saved in this browser only; the downloads take them with you.
      </p>
    </>
  );
}
