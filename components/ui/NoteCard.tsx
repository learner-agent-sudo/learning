import type { LucideIcon } from 'lucide-react';
import { RichText } from '../RichText';

const TONES = {
  sky: {
    ring: 'border-sky-200 dark:border-sky-400/30',
    head: 'bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100',
    icon: 'bg-sky-700',
    label: 'text-sky-800 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  violet: {
    ring: 'border-violet-200 dark:border-violet-400/30',
    head: 'bg-violet-50 text-violet-900 dark:bg-violet-400/10 dark:text-violet-100',
    icon: 'bg-violet-700',
    label: 'text-violet-800 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  rose: {
    ring: 'border-rose-200 dark:border-rose-400/30',
    head: 'bg-rose-50 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100',
    icon: 'bg-rose-700',
    label: 'text-rose-800 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
} as const;

// "**Label:** rest" -> label shown as its own line above the rest.
const LEAD = /^\*\*([^*]+?):?\*\*:?\s*/;

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  items: string[];
}

export function NoteCard({ title, subtitle, icon: Icon, tone, items }: Props) {
  if (items.length === 0) return null;
  const t = TONES[tone];
  // No overflow clipping: glossary pop-ups must be able to spill out.
  return (
    <section className={`rounded-xl border bg-panel shadow-card ${t.ring}`}>
      <header className={`flex items-center gap-3 rounded-t-xl px-4 py-3 sm:px-5 ${t.head}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${t.icon}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
        </div>
      </header>
      <ul className="divide-y divide-line/70">
        {items.map((item, i) => {
          const m = item.match(LEAD);
          return (
            <li key={`${i}-${item.slice(0, 24)}`} className="flex gap-3 px-4 py-3 leading-relaxed sm:px-5">
              <span aria-hidden className={`mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
              <span className="min-w-0">
                {m && (
                  <span className={`block text-[13.5px] font-semibold ${t.label}`}>
                    <RichText text={m[1]} />
                  </span>
                )}
                <RichText text={m ? item.slice(m[0].length) : item} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
