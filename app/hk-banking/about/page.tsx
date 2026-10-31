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
          An eleven-stage path through Hong Kong banking regulation, written for an experienced lawyer with an IT
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
          The concept maps (boxes joined by arrows that name the relationship) were added in October 2026. Each restates,
          in fewer words, what its stage&apos;s notes already say, and adds no new requirement or reference. An
          independent check compared every box and arrow with the notes. Dashed boxes mark something proposed, reported
          or not binding. A map simplifies; the notes and the sources behind them govern.
        </p>
        <h2>Checked against primary documents</h2>
        <p>
          In October 2026 every statement describing the following documents was checked against copies of them, and
          corrected where the text did not support it:
        </p>
        <ul>
          <li>the Guideline on Authorization of Digital Banks and Chapter 9 of the Guide to Authorization;</li>
          <li>SPM SA-2 (V.1, 2001), TM-G-1 (V.1, 2003), TM-E-1 (V.4, 2024) and CG-1 (V.4, 2025);</li>
          <li>the HKMA AML/CFT Guideline (May 2023);</li>
          <li>the Code of Banking Practice (December 2023);</li>
          <li>HKMA Guideline 3.4.1 on debt collection agencies;</li>
          <li>
            OR-2 (V.1, 31 May 2022). Its statements were first written from the consultation draft and have since been
            rechecked against the final module; its paragraph numbers are unchanged, and the notes now follow its final
            wording.
          </li>
        </ul>
        <p>
          CG-1 was first checked against V.3 (2017), then rechecked against V.4 (1 August 2025), the current version,
          and its notes now use V.4 paragraph numbers. V.4 added a paragraph on chief executives&apos; outside roles
          (2.6.13), so the later conflicts and connected lending paragraphs in 2.6 are numbered one higher than in
          V.3.
        </p>
        <p>
          The <strong>Vendors</strong> tab in Technology &amp; outsourcing is built from these documents and the
          official text of the PDPO, the Banking Ordinance and the AMLO. Each clause shows its sources and its main
          source&apos;s legal force (statute, statutory guideline, HKMA guidance, industry code, or good practice), and
          anything that is counsel&apos;s drafting rather than a stated requirement is labelled as such. The playbook
          view adds negotiating positions and model wording. These were drafted for each clause, then checked by two
          independent reviewers (one against the source documents and statute text, one for market practice), revised
          and checked again for consistency across clauses. The model wording is original drafting, not HKMA text, and
          bracketed figures are illustrative.
        </p>
        <p>
          Three tools were added to Technology &amp; outsourcing in October 2026. The <strong>SaaS terms</strong> matrix
          at the top of the Vendors tab sets 15 terms as they usually appear in a provider&apos;s standard paper
          against what SA-2 and TM-G-1 ask of the bank, with compromise wording drawn from each clause&apos;s fallback
          position; the descriptions of standard paper are general and name no provider. The{' '}
          <strong>Materiality</strong> tab walks one deployment through SA-2&apos;s outsourcing test, the
          banking-related trigger for advance discussion with the HKMA (SA-2 1.3.2) and a materiality screen. Neither
          SA-2 nor the digital bank guideline defines &ldquo;material&rdquo;, so the screen is our own and says so.
          The <strong>Incidents</strong> tab sets out the notification clocks when a critical vendor has an incident;
          the Cap. 653 deadlines come from the official text, the HKMA and customer tracks from TM-E-1, TM-G-1 and the
          HKMA&apos;s 2010 circular, and the SFC and PCPD tracks from practitioners&apos; summaries and the PCPD&apos;s
          2023 guidance, marked for checking. Each was drafted, then checked by independent reviewers against the
          source documents and statute text, and corrected. Where a clause or tool cites a statute section, its
          official text opens beneath the citation.
        </p>
        <p>
          The <strong>Digital assets, wallets &amp; P2P</strong> stage (October 2026) was checked differently, because
          HKMA, SFC and government websites could not be opened directly while it was written. Statements about
          legislation were checked against the official text of the AMLO, the Stablecoins, Stored Value Facilities,
          Banking, Deposit Protection and Money Lenders Ordinances and the Banking (Capital) Rules, and the Gatecoin
          judgment against its published text. Circulars, consultation papers, press releases and their dates were
          checked through search results showing the official title, date and reference, cross-checked against
          practitioners&apos; summaries, in a second pass dedicated to the items the first check could not confirm.
          Where a circular&apos;s own text could not be read, the stage says what it is reported to require and gives
          no paragraph numbers. Its <strong>Activities</strong> tab takes 19 things a digital bank might want to do,
          from distributing crypto ETFs to funding money lenders, and gives for each the route, what the rules
          require, launch gates to tick and the sources with their legal force.
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
