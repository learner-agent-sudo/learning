import { CAP41_ANATOMY } from '@/lib/insurance';
import { AboutShell } from '@/components/ui/AboutShell';
import { TONES } from '@/lib/theme';

export const metadata = {
  title: 'About — HK Insurance Regulation',
};

export default function HkInsuranceAboutPage() {
  return (
    <AboutShell
      backHref="/hk-insurance/"
      backLabel="Back to insurance"
      kicker="HK insurance regulation"
      title="Sources & method"
      tone={TONES.bronze}
    >
      <p>
        A twelve-stage path through the Insurance Ordinance (Cap. 41), written for the same reader as the banking and
        securities volumes: an experienced lawyer with an IT background who is counsel to a Hong Kong{' '}
        <strong>digital bank</strong>, here one that wants to offer or resell insurance in its app. The Ordinance has no
        general exemption for banks. A bank that invites customers to buy a policy, arranges one or advises on one
        needs its own Insurance Authority licence, usually as a <strong>licensed insurance agency</strong>, and its
        staff need individual licences. The HKMA inspects and investigates that business under powers the IA has
        delegated to it.
      </p>
      <p>
        Stages 3 and 4, <em>The digital bank&apos;s route</em>, start from the bank&apos;s decisions: which distribution
        model to use, and what each product and sales journey needs. Each carries a <strong>Launch kit</strong>: the
        legal route from the business decision to go-live, Legal&apos;s workplan by workstream, and activity cards that
        give the route, what the rules require, the gates to confirm before launch, the traps and the sources with
        their legal force. The other stages explain the framework: insurers, licensing, conduct, investment-linked and
        savings products, digital sales, anti-money laundering, supervision and redress.
      </p>
      <p>
        Abbreviations are explained where they appear, so a stage can be read on its own and in any order. The first
        use in each bullet has a dotted underline; tap or hover it for the full name.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>
          <strong>Statute text</strong> comes from{' '}
          <a href="https://www.elegislation.gov.hk" target="_blank" rel="noreferrer">
            Hong Kong e-Legislation
          </a>{' '}
          (Department of Justice), obtained from{' '}
          <a href="https://data.gov.hk/en-data/dataset/hk-doj-hkel-legislation-current" target="_blank" rel="noreferrer">
            DATA.GOV.HK
          </a>{' '}
          and refreshed weekly: the Insurance Ordinance and four sets of subsidiary legislation made under it (the levy
          regulation and order, the rules on the maximum number of appointing insurers, and the rules for licensed
          insurance broker companies), with the Banking Ordinance, the AMLO, the PDPO and the SFO where they meet
          insurance. Intellectual property rights in the legislation belong to the Government of the HKSAR; it is
          reproduced here under the DATA.GOV.HK terms with attribution. The extracts are not verified copies under the
          Legislation Publication Ordinance (Cap. 614); use HKeL for the authoritative text.
          {CAP41_ANATOMY && ` Insurance Ordinance version shown: as at ${CAP41_ANATOMY.versionDate}.`}
        </li>
        <li>
          <strong>IA, HKMA and SFC material</strong> (codes of conduct, guidelines, circulars, explanatory notes and
          FAQs) is <em>summarised in our own words</em>; it is not reproduced. Cards link to the source where we have a
          confirmed address.
        </li>
      </ul>

      <h2>Method</h2>
      <p>
        Low-cost research agents first built a sourced fact list on the IA&apos;s codes and guidelines, the HKMA&apos;s
        rules for banks that sell insurance, the market and the products. Drafting agents then wrote each stage and
        both launch kits from that list and the official statute text, separate checkers tested every section number,
        date, threshold and claim about who a rule binds, and a critic looked for contradictions and gaps across the
        volume. Each finding was reviewed against the sources before it was accepted or rejected. Every statute
        citation is also matched automatically against the official text: a citation that does not resolve to a
        provision in force fails the build.
      </p>
      <p>
        IA, HKMA and SFC websites could not be opened directly while the volume was written (November 2026).
        Statements about codes, guidelines and circulars were therefore checked through search results showing the
        official title and date, cross-checked against practitioners&apos; summaries. Where a document&apos;s own text
        could not be read, the volume says what it is reported to require and gives no more detail than those sources
        confirm (&ldquo;reported; check&rdquo;). The stages carry a <em>Fact-check pending</em> badge until an
        independent review of their guidance references is complete.
      </p>

      <h2>Disclaimer</h2>
      <p>
        Study material, not legal advice. The IA and the HKMA change their expectations through guidelines and
        circulars faster than the Ordinance changes; check the current position before advising. Content is as at
        November 2026.
      </p>
    </AboutShell>
  );
}
