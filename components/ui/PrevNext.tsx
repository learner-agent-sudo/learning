import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Target {
  id: string;
  index: number;
  title: string;
}

interface Props {
  prev: Target | null;
  next: Target | null;
  onNavigate: (id: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Large previous / next links at the foot of a stage. */
export function PrevNext({ prev, next, onNavigate }: Props) {
  return (
    <nav aria-label="Stage navigation" className="mt-12 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <button
          type="button"
          onClick={() => onNavigate(prev.id)}
          className="group flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <ArrowLeft className="h-5 w-5 shrink-0 text-muted transition group-hover:-translate-x-0.5 group-hover:text-ink" aria-hidden />
          <span className="min-w-0">
            <span className="kicker block">Previous · {pad(prev.index)}</span>
            <span className="block truncate font-serif text-lg font-semibold">{prev.title}</span>
          </span>
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <button
          type="button"
          onClick={() => onNavigate(next.id)}
          className="group flex items-center justify-end gap-3 rounded-xl border border-module/30 bg-module px-4 py-3.5 text-right text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">Next · {pad(next.index)}</span>
            <span className="block truncate font-serif text-lg font-semibold">{next.title}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
        </button>
      )}
    </nav>
  );
}
