import { SW_STAGES, USC17_ANATOMY } from '@/lib/softwareIp';
import { AboutShell } from '@/components/ui/AboutShell';
import { TONES } from '@/lib/theme';

export const metadata = {
  title: 'About — Open Source & Software IP',
};

const LICENCES = SW_STAGES.reduce((n, s) => n + (s.licenceKit?.licences.length ?? 0), 0);
const STEPS = (id: string) => SW_STAGES.find((s) => s.id === id)?.reviewKit?.items.length ?? 0;

export default function SoftwareIpAboutPage() {
  return (
    <AboutShell
      backHref="/software-ip/"
      backLabel="Back to open source & software IP"
      kicker="Open source & software IP"
      title="Sources & method"
      tone={TONES.amber}
    >
      <p>
        A {SW_STAGES.length}-stage path through the law of software for the reader of the other volumes: an
        experienced lawyer with an IT background, here counsel to a <strong>bank or fintech in the United
        States</strong>. It covers US federal law in full, with state law where it decides the point (California is
        the main example), and each stage ends with short notes on what differs in the European Union, the United
        Kingdom, Hong Kong and Canada.
      </p>
      <p>
        Stages 1 to 6 set out the rights in code: copyright, who owns code written by staff, contractors and vendors,
        patents, trade secrets and trademarks. Stages 7 to 10 explain open source licences: how they work, then the
        permissive, copyleft and network-copyleft families and the source-available licences that are not open
        source. Stage 7&apos;s <strong>Licence finder</strong> takes {LICENCES} licences and the ways a bank uses
        code (running it internally, changing it, shipping it in an app, serving it online, giving it to a contractor)
        and shows what each licence asks, with the licence&apos;s own words one tap away, and whether two licences
        can be combined in one program.
      </p>
      <p>
        Stages 11 to 15 turn the law into practice. Three of them carry checklists built on the same tool as the
        Canadian volume&apos;s vendor and advertising checklists: an <strong>OSS review</strong> for approving one
        component ({STEPS('using')} steps), a <strong>Release</strong> checklist for publishing the bank&apos;s code
        or contributing to outside projects ({STEPS('releasing')} steps), and a <strong>Diligence</strong> checklist
        for buying a company or code base, licensing software in, or signing up to a SaaS service (
        {STEPS('deals')} steps). A profile narrows each to the steps that apply; each step names its owners, the
        evidence for the file and its sources with their legal force, and some carry model wording. Progress and
        notes stay in the browser and download as a checklist or a tracker. The last two stages cover AI-generated
        code and models, and disputes and enforcement.
      </p>
      <p>
        Abbreviations are explained where they appear, so a stage can be read on its own and in any order. The first
        use in each bullet has a dotted underline; tap or hover it for the full name.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>
          <strong>U.S. Code text</strong> comes from the annual edition of the United States Code that the Office of
          the Law Revision Counsel prepares and the Government Publishing Office publishes on{' '}
          <a href="https://www.govinfo.gov/app/collection/uscode" target="_blank" rel="noreferrer">
            GovInfo
          </a>
          , extracted for the sections cited (Titles 15, 17, 18, 19, 28 and 35) and refreshed monthly
          {USC17_ANATOMY && `; the text shown is current through ${USC17_ANATOMY.versionDate}`}. Later amendments
          will not show until the next edition. Works of the US Government are not subject to copyright; this is not
          the official text, and each extract links to the section on uscode.house.gov.
        </li>
        <li>
          <strong>California code sections</strong> (Labor Code §§ 2870-2872, Business and Professions Code § 16600,
          Civil Code § 3426.1) are copied from California Legislative Information as indexed in April 2026.
          Hong Kong (Copyright and Patents Ordinances) and Canadian (Copyright and Patent Acts) text comes from the
          same official sources as the other volumes.
        </li>
        <li>
          <strong>Licence texts</strong> come from the{' '}
          <a href="https://github.com/spdx/license-list-data" target="_blank" rel="noreferrer">
            SPDX License List data
          </a>
          , split into each licence&apos;s sections. Only licences that allow verbatim copies of their text (or are
          public domain dedications) are shown; source-available licences such as SSPL, BUSL and the Elastic
          License are summarised and linked. The copy that ships with a component is the one that governs it.
        </li>
        <li>
          <strong>Cases, agency guidance and reports</strong> (Copyright Office, USPTO, NIST, CISA, OMB, the bank
          regulators, NYDFS) are <em>summarised in our own words</em>. Points that rest on reports of a decision or
          a development, rather than its text, are marked &ldquo;reported; check&rdquo;, as are developments in 2025
          and 2026 that could be checked only through secondary sources.
        </li>
      </ul>

      <h2>Method</h2>
      <p>
        Low-cost research agents checked a list of claims (citations, dates, holdings, figures and the status of
        pending matters) against court and agency sources and reports. A supervisor reviewed every result and kept
        a file of settled facts, each marked as verified or reported. Drafting agents then wrote each stage, the
        Licence finder data, the notes on other places and the checklists from that file and the statute and
        licence text alone, and a checker script tested every citation, the house style and the shape of the data.
        Every statute and licence citation is also matched automatically against the extracted text: one that does
        not resolve fails the build.
      </p>
      <p>
        The stages carry a <em>Fact-check pending</em> badge until an independent review of their case citations
        and guidance references is complete.
      </p>

      <h2>Disclaimer</h2>
      <p>
        Study material, not legal advice. Open source licences are read on their own words and the facts of each use,
        and few of their questions have been decided by courts; positions of the Free Software Foundation and the
        Open Source Initiative are views, not law. AI and copyright, patent eligibility and PTAB practice were moving
        quickly as this was written. Content is as at November 2026.
      </p>
    </AboutShell>
  );
}
