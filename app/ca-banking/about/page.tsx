import { BANK_ACT_ANATOMY } from '@/lib/caBanking';
import { AboutShell } from '@/components/ui/AboutShell';
import { TONES } from '@/lib/theme';

export const metadata = {
  title: 'About — Canadian Banking Regulation',
};

export default function CaBankingAboutPage() {
  return (
    <AboutShell
      backHref="/ca-banking/"
      backLabel="Back to Canadian banking"
      kicker="Canadian banking regulation"
      title="Sources & method"
      tone={TONES.brick}
    >
      <p>
        A fourteen-stage path through the federal rules for a bank in Canada, written for the reader of the Hong Kong
        volumes: an experienced lawyer with an IT background who is counsel to a <strong>digital bank</strong>. Canada
        has no separate licence for one: a digital bank is a bank under the Bank Act, supervised by OSFI, that serves
        its customers mainly through an app.
      </p>
      <p>
        The weight is on <strong>vendors and third parties</strong>. Stages 5 to 8 cover OSFI&apos;s third-party risk
        guideline (B-10), technology, cyber and operational resilience, data and records, and partners who deal with
        customers for the bank. Stage 5 carries the <strong>vendor-contract kit</strong>: each clause a vendor, cloud,
        group or partner agreement needs in Canada, with its sources and their legal force, a negotiation playbook
        with model wording, a banking addendum builder and a SaaS terms matrix. It opens with a crosswalk from the
        Hong Kong kit: which HKMA-driven clauses Canada still needs, which it puts in statute, which it softens or
        drops, and what it adds. The <strong>Risk &amp; criticality</strong> tab screens one arrangement under B-10,
        and stage 6&apos;s <strong>Incidents</strong> tab sets out who must be told, by when, when a critical vendor
        has an incident.
      </p>
      <p>
        Stage 5 also has a <strong>New IT vendor</strong> tab: counsel&apos;s checklist for taking on an IT vendor, from
        intake to exit, in nine phases. A profile of the deal (what the vendor provides; personal information, Quebec,
        offshore, critical, related party, standard terms and so on) narrows it to the steps that apply. Each step says
        what to do, who owns it, what goes on the file and why, with the legal force of each source, and links to the
        clause cards and the addendum builder. Beyond the banking rules it covers the general Canadian law an IT
        contract has to work under: copyright and moral rights, the insolvency stays and licence protection, the
        Competition Act&apos;s no-poaching offence, withholding tax, Quebec&apos;s privacy Act and Civil Code, and the
        leading contract cases. Progress and notes stay in the browser and download as a checklist or a tracker.
      </p>
      <p>
        Stage 12, <strong>Advertising &amp; promotion</strong>, covers what counsel checks before the bank&apos;s
        ads, messages, offers and partner content go out: the Bank Act&apos;s advertising standard and the
        disclosures a rate, payment or fee brings in, the Competition Act&apos;s deceptive-marketing rules, the
        anti-spam and telemarketing rules, the CDIC by-law, the limits on bank names and insurance promotion, and
        Quebec&apos;s French-language and consumer rules. Its <strong>Ad review</strong> tab is a checklist for
        one piece of material, narrowed by what it promotes, what it says, where it runs, who sees it and who
        makes it, with model wording where it helps.
      </p>
      <p>
        Abbreviations are explained where they appear, so a stage can be read on its own and in any order. The first
        use in each bullet has a dotted underline; tap or hover it for the full name.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>
          <strong>Statute text</strong> comes from the consolidated Acts and regulations published by the Department
          of Justice Canada as XML (the data behind the{' '}
          <a href="https://laws-lois.justice.gc.ca" target="_blank" rel="noreferrer">
            Justice Laws Website
          </a>
          ), refreshed weekly: the Bank Act, PIPEDA, the PCMLTFA and its regulations, the CDIC Act and two CDIC
          by-laws, the OSFI and FCAC Acts, the Retail Payment Activities Act and its regulations, Canada&apos;s
          anti-spam legislation and its two sets of regulations, the Financial Consumer Protection Framework
          Regulations, the Supervisory Information (Banks) Regulations, the Real-Time Rail By-law, and selected
          sections of the Criminal Code, the Competition Act, the Trademarks Act and the Telecommunications Act.
          Federal enactments may be reproduced under the Reproduction of Federal Law Order; this is not the official
          version, and each extract links to the official text.
          {BANK_ACT_ANATOMY && ` Bank Act text shown: current to ${BANK_ACT_ANATOMY.versionDate}.`}
        </li>
        <li>
          <strong>OSFI, FCAC, FINTRAC, Privacy Commissioner, CDIC, Bank of Canada and Payments Canada material</strong>{' '}
          (guidelines, advisories, guides, bulletins and rules) is <em>summarised in our own words</em>; it is not
          reproduced. Cards link to the source where we have a confirmed address.
        </li>
        <li>
          <strong>Quebec law</strong> (the private-sector privacy Act as amended by Law 25, the Charter of the
          French language and the Consumer Protection Act) could be checked only through official guidance and
          reports, so points that rest on it are marked &ldquo;reported; check&rdquo;. So are court and tribunal
          decisions, Ad Standards&apos; Code and guidelines, and regulator positions on advertising that were found
          only in reports of them.
        </li>
      </ul>

      <h2>Method</h2>
      <p>
        Low-cost research agents read the primary pages of OSFI&apos;s guidelines and advisories, the FCAC, OPC,
        FINTRAC, CDIC, Bank of Canada and Payments Canada material, and wrote reading notes with each paragraph
        number. Drafting agents then wrote each stage and each part of the vendor kit from those notes and the
        official statute text, separate checkers tested every section number, date, threshold and claim about who a
        rule binds, and a critic looked for contradictions and gaps across the volume. Each finding was reviewed
        against the sources before it was accepted or rejected. Every statute citation is also matched automatically
        against the official text: a citation that does not resolve to a provision in force fails the build.
      </p>
      <p>
        The stages carry a <em>Fact-check pending</em> badge until an independent review of their guidance
        references is complete.
      </p>

      <h2>Disclaimer</h2>
      <p>
        Study material, not legal advice. OSFI and the agencies change their expectations through guidelines and
        advisories faster than the Bank Act changes, and several reforms (the Critical Cyber Systems Protection Act,
        federal privacy reform, consumer-driven banking) were enacted or proposed but not in force as this was
        written; check the current position before advising. Content is as at November 2026.
      </p>
    </AboutShell>
  );
}
