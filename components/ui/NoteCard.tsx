import type { LucideIcon } from 'lucide-react';
import { RichText } from '../RichText';

const TONES = {
  sky: { ring: 'border-sky-200', head: 'bg-sky-50 text-sky-900', icon: 'bg-sky-600', dot: 'bg-sky-500' },
  violet: { ring: 'border-violet-200', head: 'bg-violet-50 text-violet-900', icon: 'bg-violet-600', dot: 'bg-violet-500' },
  rose: { ring: 'border-rose-200', head: 'bg-rose-50 text-rose-900', icon: 'bg-rose-600', dot: 'bg-rose-500' },
} as const;

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
  return (
    <section className={`overflow-hidden rounded-xl border bg-panel shadow-card ${t.ring}`}>
      <header className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${t.head}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${t.icon}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
      </header>
      <ul className="divide-y divide-line/70">
        {items.map((item) => (
          <li key={item} className="flex gap-3 px-4 py-3 leading-relaxed sm:px-5">
            <span aria-hidden className={`mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
            <span className="min-w-0">
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
