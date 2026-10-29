import { CAP571_ANATOMY } from '@/lib/securities';
import { AboutShell } from '@/components/ui/AboutShell';
import { TONES } from '@/lib/theme';

export const metadata = {
  title: 'About — HK Securities Regulation',
};

export default function HkSecuritiesAboutPage() {
  return (
    <AboutShell
      backHref="/hk-securities/"
      backLabel="Back to securities"
      kicker="HK securities regulation"
      title="Sources & method"
      tone={TONES.plum}
    >
        <p>
          A sixteen-stage path through the Securities and Futures Ordinance (Cap. 571), written for the same reader as
          the banking volume: an experienced lawyer with an IT background who is counsel to a Hong Kong{' '}
          <strong>digital bank</strong>. A bank cannot hold an SFC licence; it deals in and advises on securities as a{' '}
          <strong>registered institution</strong>, with the HKMA as its day-to-day supervisor. The stages explain the
          regime as it applies to every intermediary, and each adds notes on what changes when the firm is a bank.
        </p>
        <p>
          Stages 3 to 6, <em>The virtual bank&apos;s route</em>, start from the bank&apos;s product decisions: what the
          SFC&apos;s role is when a virtual bank adds share trading, wealth management or crypto trading to its app, and
          where the HKMA, the Insurance Authority and the MPFA come in. Each ends with links to the stages that cover
          its points in depth.
        </p>
        <p>
          Abbreviations are explained where they appear, so a stage can be read on its own and in any order. The first
          use in each bullet has a dotted underline; tap or hover it for the full name. Each stage also lists its
          abbreviations under its title.
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
            and refreshed weekly: the Ordinance itself, nine sets of rules made under it (professional investors, client
            securities, client money, financial resources, records, contract notes, accounts and audit, licensing
            information and stock market listing) and, for prospectuses, the Companies (Winding Up and Miscellaneous
            Provisions) Ordinance (Cap. 32). Intellectual property rights in the legislation belong to the Government of
            the HKSAR; it is reproduced here under the DATA.GOV.HK terms with attribution. The extracts are not verified
            copies under the Legislation Publication Ordinance (Cap. 614) — use HKeL for the authoritative text.
            {CAP571_ANATOMY && ` Securities and Futures Ordinance version shown: as at ${CAP571_ANATOMY.versionDate}.`}
          </li>
          <li>
            <strong>SFC, HKMA and HKEX material</strong> (codes, guidelines, circulars, FAQs and the Takeovers Codes) is{' '}
            <em>summarised in our own words</em>; it is not reproduced. Cards link to the source where we have a
            confirmed address.
          </li>
        </ul>

        <h2>Method</h2>
        <p>
          Each stage was drafted from the official text of the Ordinance and its rules and from published SFC, HKMA and
          HKEX material, then reviewed against the statute text section by section. An independent adversarial
          fact-check then tested every section number, date, threshold and penalty, and an editorial pass corrected or
          removed anything the checks could not support. Every statute citation is also matched automatically against
          the official text: a citation that does not resolve to a provision in force fails the build.
        </p>
        <p>
          SFC, HKMA and HKEX websites could not be opened directly while the stages were written (October 2026).
          Statements about codes, guidelines and circulars were therefore checked through search results showing the
          official title and date, cross-checked against practitioners&apos; summaries. Where a document&apos;s own text
          could not be read, the stage says what it is reported to require and gives no more detail than those sources
          confirm; its card is marked{' '}
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">verify</span>.
          Dates of the virtual-asset circulars match the banking volume&apos;s Digital assets stage.
        </p>
        <p>
          The notes follow the banking volume&apos;s format: bullet points with a short &ldquo;In 30 seconds&rdquo;
          summary, small diagrams that restate figures in the notes, and a concept map per stage (boxes joined by arrows
          that name the relationship). A map simplifies; the notes and the sources behind them govern. Dashed boxes mark
          something proposed or not binding.
        </p>

        <h2>Disclaimer</h2>
        <p>
          Study material, not legal advice. The SFC changes its expectations through circulars and FAQs faster than
          the Ordinance changes; check the current SFC and HKMA position before advising. Content is as at October
          2026.
        </p>
    </AboutShell>
  );
}
