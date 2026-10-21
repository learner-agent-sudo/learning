interface Term {
  term: string;
  definition: string;
}

/** Definitions laid out in full, for reading rather than hovering. */
export function GlossaryGrid({ terms }: { terms: Term[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {terms.map((g) => (
        <div key={g.term} className="rounded-xl border border-line bg-panel px-4 py-3 shadow-card">
          <dt className="font-serif text-lg font-semibold leading-tight">{g.term}</dt>
          <dd className="mt-1 text-[14px] leading-relaxed text-ink/75">{g.definition}</dd>
        </div>
      ))}
    </dl>
  );
}
