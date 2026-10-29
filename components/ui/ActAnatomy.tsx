import { ChevronRight } from 'lucide-react';
import type { CapAnatomy } from '@/lib/statute';
import { BODY, CARD, CHEVRON, SUMMARY, TITLE } from '../cardStyles';

/** The Parts and Schedules of an ordinance, generated from the official text. */
export function ActAnatomy({ anatomy, name }: { anatomy: CapAnatomy | null; name: string }) {
  if (!anatomy) return null;
  return (
    <details className={`${CARD} mt-10`}>
      <summary className={SUMMARY}>
        <ChevronRight className={CHEVRON} aria-hidden />
        <span className={TITLE}>
          Anatomy of the {name}
          <span className="mt-1 block font-mono text-[11.5px] font-normal text-muted">
            {anatomy.parts.length} Parts · {anatomy.schedules.length} Schedules · as at {anatomy.versionDate}
          </span>
        </span>
      </summary>
      <div className={BODY}>
        <p className="text-xs text-muted">Generated from the official text. Repealed Parts are omitted.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <tbody>
              {anatomy.parts.map((p) => (
                <tr key={p.num} className="border-t border-line/70 align-top">
                  <td className="whitespace-nowrap py-1.5 pr-3 font-mono text-xs font-medium text-phase">{p.num}</td>
                  <td className="py-1.5 pr-3">{p.heading}</td>
                  <td className="whitespace-nowrap py-1.5 font-mono text-[11px] text-muted">{p.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="kicker mt-4">Schedules</p>
        <ul className="mt-1.5 space-y-1 text-sm">
          {anatomy.schedules.map((s) => (
            <li key={s.num}>
              <span className="font-mono text-xs font-medium text-phase">{s.num}</span> — {s.heading}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
