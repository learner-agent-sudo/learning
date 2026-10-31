# Learning

A personal study site: interactive notes on deals, privacy, and Hong Kong
financial regulation. Static Next.js site (no backend), published on GitHub
Pages by `.github/workflows/deploy-pages.yml` on every push to the default
branch.

## Topics

| Topic | Route | Status |
|---|---|---|
| M&A — U.S. private-company Asset Purchase Agreement | `/mna/` | Live |
| Privacy & data protection — GDPR (DataGuard) | `/privacy/dataguard/index.html` | Live |
| HK banking regulation — Banking Ordinance (Cap. 155), HKMA | `/hk-banking/` | Live |
| HK securities regulation — SFO (Cap. 571), SFC | `/hk-securities/` | Live |
| HK insurance regulation — Insurance Ordinance (Cap. 41), IA | — | Up next |

The home page (`app/page.tsx`) shows the topics as volumes on a shelf.

## Layout

The learning modules share one layout (`components/ui/`): a masthead with
counts and progress, a contents rail of numbered stages grouped by phase (a
sticky strip of stage pills on phones), and a stage view with tabs. Stage
notes are bullet points: the short version first, then the detail under
headings, with a bold lead-in on each bullet, a "bottom line" where a section
has one, and small diagrams (layers, tiers, escalation steps, deadlines) drawn
from the figures in the notes. Banking and securities stages also have concept maps: boxes
joined by arrows that name the relationship, one under "How it fits together"
and more beside the sections they illustrate. They are drawn in CSS
(`components/ui/ConceptMap.tsx`), and screen readers get the same links as a
list of sentences. Abbreviations (`data/abbreviations.json`) are explained
where they appear: the first use in each bullet opens its full name on tap or
hover, and each stage lists the ones it uses under its title, so stages can
be read in any order. The selected stage and tab are kept in the URL
hash, so `/hk-banking/#technology/checklist` links straight to a stage's
checklist, and moving to the next stage keeps the tab. Visited stages,
checklist ticks and the last stage read (for the home page's "continue" link)
are remembered in the browser only. A light / system / dark switch sits in
every masthead; colours are theme variables (`app/globals.css`), with a
lighter twin for each module and stage colour in dark mode (`lib/theme.ts`).

On phones and tablets the stage strip and tab bar slide away while you read
down and come back when you scroll up. A floating button, which comes and
goes with them, shows which section of a long tab you are in and opens a list
to jump between sections, or takes you back to the top. Each tab ends with a link to the next one, and glossary
definitions open as a sheet at the foot of the screen. The site can be added
to a phone's home screen (`app/manifest.ts`), where it opens full screen.

## M&A — interactive APA workflow

An interactive walkthrough of a U.S. private-company **Asset Purchase
Agreement (APA)** transaction, from strategy through post-closing. The deal
is split into 9 stages. Each stage gives plain-English and practitioner
bullet points side by side, then tabs for the documents produced at that
stage, the contract clauses that typically appear, and a glossary.

1. **Strategy** *(pre-process, internal to each side)*
2. **NDA** — confidentiality
3. **LOI / Term Sheet** — non-binding intent (deal-type branch point)
4. **Due Diligence**
5. **APA Drafting & Negotiation**
6. **Signing**
7. **Pre-Closing** — covenants, regulatory, conditions
8. **Closing** — bill of sale, assignments, funds flow
9. **Post-Closing** — true-up, indemnification, integration

APA is the only complete deal type; SPA and Merger paths are shown greyed
out. Clause content comes from the
[CUAD](https://www.atticusprojectai.org/cuad) dataset (CC BY 4.0) plus
hand-authored clauses for APA-specific provisions CUAD under-represents
(`data/apa-gap-fills.json`).

See `docs/mna/workflow-mapping.md` for per-stage documents, clauses, and
glossary terms, and `docs/mna/architecture.md` for the tech stack and file
layout.

## HK banking regulation

Eleven stages from the regulatory map to recovery and resolution, written for
counsel at a Hong Kong digital bank. Each stage has an "In 30 seconds"
summary and an in-depth note, the key statutory provisions and HKMA
guidance (statute cards carry the official text from Hong Kong
e-Legislation), a counsel's checklist, notes on the IT angle, digital-bank
specifics and pitfalls, and a glossary. Content lives in
`data/banking/stages.json`; `scripts/build_statute_extracts.py` matches
every statute citation against the official text and fails the build if
one does not resolve. Stage 6 (Technology & outsourcing) also has a
**Vendors** tab: the 25 clauses a vendor, cloud or outsourcing contract needs,
each with its sources and their legal force (PDPO, HKMA guidelines and SPM
modules, the AML Guideline, the Code of Banking Practice), a lifecycle from
risk assessment to exit, and a negotiation playbook per clause: stance
(must-have or expected), preferred, fallback and red-line positions, original
model wording with bracketed choices, drafting to watch for, answers to vendor
pushback and who signs off a deviation. A review tracker marks each clause
against the contract under review (meets, fallback agreed, gap, not
applicable) with notes, kept in the browser, and exports the review as a
spreadsheet (.csv) or the whole playbook as Markdown. The Vendors tab opens
with a **SaaS terms** matrix: 15 terms as standard SaaS or cloud paper usually
puts them, what SA-2 and TM-G-1 ask of the bank, the line to hold and
compromise wording. Two more tabs sit beside it. **Materiality** walks one
deployment through SA-2's outsourcing test, the banking-related trigger for
advance discussion with the HKMA and a materiality screen, with a regulatory
condition for signing early and a downloadable note. **Incidents** sets out
the notification clocks when a critical vendor has an incident (vendor, HKMA,
Cap. 653 Commissioner, SFC and HKMA, customers, PCPD) as a scenario, a chart
and a call sheet. Statute sources in these tools open their official text in
place, and every stage's checklist takes a note per item, filters open and done
items, and downloads as Markdown or a spreadsheet.

Stage 9 (Digital assets, wallets & P2P) covers virtual assets, stablecoins
under Cap. 656, tokenised deposits and securities, Project Ensemble and
e-HKD, the Basel cryptoasset capital rules, wallets and the travel rule,
P2P and platform lending under the Money Lenders Ordinance, and Web3. Its
**Activities** tab answers "can the bank do it?" for 19 activities: the
route (licence, registration or HKMA engagement), what the rules require,
launch gates to tick before going live, the regime's status (in force, in
transition, proposed or pilot) and the sources with their legal force,
including SFC guidance, case law and proposals. Ticks stay in the browser
and the shown activities export as Markdown launch notes.

## HK securities regulation

Sixteen stages through the Securities and Futures Ordinance (Cap. 571), from
the regulatory map to complaints, compensation and failure, written for the
same reader: counsel at a digital bank that deals in securities as an SFC
registered institution, with the HKMA as its frontline supervisor. Stages 3
to 6 ("The virtual bank's route") start from the bank's product decisions:
how the SFC relates to a virtual bank that adds share trading, wealth
management (with the insurance and MPF regulators alongside) or crypto
trading, each ending in "Go deeper" links to the detailed stages. The rest
cover regulated activities and the perimeter, licensing and registration,
responsible officers and managers-in-charge, the Code of Conduct, client
assets and financial resources, offers and prospectuses, online platforms and
virtual assets, market misconduct, disclosure of interests and takeovers, and
enforcement. Each has the same tabs as the banking stages, with notes on what
changes when the firm is a bank. Content lives in
`data/securities/stages.json`; statute cards carry the official text of the
SFO, nine of its rule sets and Cap. 32 (prospectuses), attached by
`scripts/build_statute_extracts.py`.

## Privacy — DataGuard

A self-contained HTML training game: the learner acts as a company's data
protection lead and decides 20 cases drawn from public GDPR enforcement
decisions, across five departments. It lives at
`public/privacy/dataguard/index.html` and was imported unchanged, with its
git history, from the former `learning-GDPR` repository.

## Disclaimer

This is an **educational** site, not legal advice. Clause text is excerpted
from public datasets or hand-authored as illustrative examples; case
scenarios are simplified from public regulator decisions. Real matters
involve jurisdiction-specific facts and qualified counsel.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out/
```

On GitHub Pages the site lives under `/<repo-name>/`. The deploy workflow
passes that prefix to the build as `PAGES_BASE_PATH` (read in
`next.config.js`); locally it is empty, so the site serves from `/`.

## Security

- Dependencies are pinned to exact versions (`package.json`, with
  `package-lock.json` installed by `npm ci`). Next.js's own copy of PostCSS is
  replaced with the project's patched one (`overrides`).
- Workflow actions are pinned to full commit SHAs, with the release tag in a
  comment; to update one, look up the new tag's commit and change both.
- `scripts/extract_hkel.py` parses legislation XML with `defusedxml`,
  installed from `scripts/requirements-hkel.txt` with `--require-hashes`.
- `vercel.json` sends security headers on Vercel (a content security policy
  that allows only this site's own files, no framing, `nosniff`, a strict
  referrer policy). GitHub Pages cannot send custom headers.

## Refreshing CUAD clauses (M&A)

`public/clauses.json` holds up to 3 deduped CUAD excerpts for each of 16
categories. It is produced by `scripts/extract_cuad.py`, which reads
`chenghao/cuad_qa` (a parquet mirror of CUAD-QA) from Hugging Face.

The GitHub Actions workflow `.github/workflows/extract-cuad.yml` runs the
script on demand (`workflow_dispatch`, from the Actions tab) or whenever the
script changes, and commits the refreshed file back to the branch. Nothing
needs to be installed locally.
