'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import type { DeskQuestion } from '@/lib/desk';

/**
 * A colleague's question, shown just above the section that answers it while
 * "questions while reading" is on. It asks nothing of the reader: "Read on"
 * folds it away.
 */
export function ReadingAsk({ q, deskHref }: { q: DeskQuestion; deskHref: string }) {
  const [open, setOpen] = useState(true);
  if (!q.colleague) return null;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <MessageSquareText className="h-3.5 w-3.5" aria-hidden /> {q.colleague.role}&rsquo;s question
      </button>
    );
  }
  return (
    <aside
      aria-label={`${q.colleague.role} asks`}
      className="mb-4 rounded-lg border border-dashed border-phase/40 bg-phase/[0.04] px-3.5 py-3 text-[14.5px] leading-relaxed"
    >
      <p className="flex gap-2.5">
        <MessageSquareText className="mt-1 h-4 w-4 shrink-0 text-phase" aria-hidden />
        <span>
          <span className="font-medium">{q.colleague.role} asks:</span> &ldquo;{q.colleague.text}&rdquo;
        </span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-[1.625rem] text-xs text-muted">
        <button type="button" onClick={() => setOpen(false)} className="min-h-9 underline-offset-4 hover:text-ink hover:underline">
          Read on
        </button>
        <Link href={`${deskHref}#${q.id}`} className="min-h-9 py-2.5 underline-offset-4 hover:text-ink hover:underline">
          On the Desk, once you have read the answer
        </Link>
      </p>
    </aside>
  );
}
