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
| HK securities regulation — SFO (Cap. 571), SFC | — | Up next |
| HK insurance regulation — Insurance Ordinance (Cap. 41), IA | — | Planned |

The home page (`app/page.tsx`) shows the topics as volumes on a shelf.

## Layout

Both learning modules share one layout (`components/ui/`): a masthead with
counts and progress, a contents rail of numbered stages grouped by phase (a
sticky strip of stage pills on phones), and a stage view with tabs. Stage
notes are bullet points: the short version first, then the detail under
headings, with a bold lead-in on each bullet, a "bottom line" where a section
has one, and small diagrams (layers, tiers, escalation steps, deadlines) drawn
from the figures in the notes. The selected stage and tab are kept in the URL
hash, so `/hk-banking/#technology/checklist` links straight to a stage's
checklist, and moving to the next stage keeps the tab. Visited stages,
checklist ticks and the last stage read (for the home page's "continue" link)
are remembered in the browser only. A light / system / dark switch sits in
every masthead; colours are theme variables (`app/globals.css`), with a
lighter twin for each module and stage colour in dark mode (`lib/theme.ts`).

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
`data/banking/stages.json`; `scripts/build_banking_extracts.py` matches
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
spreadsheet (.csv) or the whole playbook as Markdown.

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

## Refreshing CUAD clauses (M&A)

`public/clauses.json` holds up to 3 deduped CUAD excerpts for each of 16
categories. It is produced by `scripts/extract_cuad.py`, which reads
`chenghao/cuad_qa` (a parquet mirror of CUAD-QA) from Hugging Face.

The GitHub Actions workflow `.github/workflows/extract-cuad.yml` runs the
script on demand (`workflow_dispatch`, from the Actions tab) or whenever the
script changes, and commits the refreshed file back to the branch. Nothing
needs to be installed locally.
