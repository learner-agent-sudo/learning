import { TriangleAlert } from 'lucide-react';

/** Shown on a stage whose guidance references still await the independent fact-check. */
export function DraftNotice({ regulator }: { regulator: string }) {
  return (
    <details className="group mb-5 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2.5 px-4 py-2 [&::-webkit-details-marker]:hidden">
        <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
        <strong className="font-semibold">Independent fact-check pending</strong>
        <span className="ml-auto text-xs text-amber-800 underline underline-offset-2 dark:text-amber-200">
          <span className="group-open:hidden">What this means</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      <p className="px-4 pb-3 leading-relaxed">
        Statute citations in this stage are matched against the official text and the stage has had an editorial
        review, but its {regulator} guidance references, dates and figures have not yet been independently confirmed.
      </p>
    </details>
  );
}
