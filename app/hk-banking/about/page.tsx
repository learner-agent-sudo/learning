import { CAP155_ANATOMY } from '@/lib/banking';
import { AboutShell } from '@/components/ui/AboutShell';
import { TONES } from '@/lib/theme';

export const metadata = {
  title: 'About — HK Banking Regulation',
};

export default function HkBankingAboutPage() {
  return (
    <AboutShell
      backHref="/hk-banking/"
      backLabel="Back to banking"
      kicker="HK banking regulation"
      title="Sources & method"
      tone={TONES.forest}
    >
        <p>
          A ten-stage path through Hong Kong banking regulation, written for an experienced lawyer with an IT
          background who has just become counsel to a <strong>digital bank</strong> (a licensed bank serving
          customers mainly online; the HKMA called these &ldquo;virtual banks&rdquo; until 25 October 2024) and is
          new to the Banking Ordinance (Cap. 155).
        </p>

        <h2>Sources</h2>
        <ul>
          <li>
            <strong>Statute text</strong> comes from{' '}
            <a href="https://www.elegislation.gov.hk" target="_blank" rel="noreferrer">
              Hong Kong e-Legislation
            </a>{' '}
            (Department of Justice), obtained from{' '}
            <a
             
              href="https://data.gov.hk/en-data/dataset/hk-doj-hkel-legislation-current"
              target="_blank"
              rel="noreferrer"
            >
              DATA.GOV.HK
            </a>{' '}
            and refreshed weekly. Intellectual property rights in the legislation belong to the Government of
            the HKSAR; it is reproduced here under the DATA.GOV.HK terms with attribution. The extracts are not
            verified copies under the Legislation Publication Ordinance (Cap. 614) — use HKeL for the
            authoritative text.
            {CAP155_ANATOMY && ` Banking Ordinance version shown: as at ${CAP155_ANATOMY.versionDate}.`}
          </li>
          <li>
            <strong>HKMA material</strong> (Supervisory Policy Manual modules, guidelines, circulars) and
            industry codes are <em>summarised in our own words</em> with links to the source; they are not
            reproduced.
          </li>
        </ul>

        <h2>Method</h2>
        <p>
          Each stage was drafted from the statute and published regulatory material, then put through an
          independent adversarial fact-check of every section number, guideline code, date and threshold. Every
          statute citation is then matched automatically against the official text: a citation that does not
          resolve to a provision in force fails the build. References the fact-check could not fully confirm are
          marked <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">verify</span>.
        </p>
        <p>
          The stage notes are written as bullet points: a short &ldquo;In 30 seconds&rdquo; summary, then the detail
          under headings. The bullets were converted from the original prose and checked against it so that every
          reference, figure, date and qualification carried over unchanged. Bold lead-ins, the italic opening line
          of a section and its &ldquo;bottom line&rdquo; were then added without changing any wording (a script
          compares the text word for word). The small diagrams restate figures that appear in the notes beside
          them.
        </p>
        <p>
          Four stages (Capital &amp; liquidity; AML, sanctions &amp; fraud; Customers &amp; conduct; Recovery &amp;
          resolution) have not yet had the independent fact-check because the review run hit a usage limit. They
          carry a notice to that effect until it is done; their statute citations are already matched against the
          official text.
        </p>

        <h2>Disclaimer</h2>
        <p>
          Study material, not legal advice. Regulatory expectations change through circulars faster than
          statutes do; check the current HKMA position before advising. Content is as at October 2026.
        </p>
    </AboutShell>
  );
}
