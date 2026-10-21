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
headings. The selected stage is kept in the URL hash, so `/hk-banking/#technology`
links straight to a stage. Visited stages and checklist ticks are remembered
in the browser only.

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

Ten stages from the regulatory map to recovery and resolution, written for
counsel at a Hong Kong digital bank. Each stage has an "In 30 seconds"
summary and an in-depth note, the key statutory provisions and HKMA
guidance (statute cards carry the official text from Hong Kong
e-Legislation), a counsel's checklist, notes on the IT angle, digital-bank
specifics and pitfalls, and a glossary. Content lives in
`data/banking/stages.json`; `scripts/build_banking_extracts.py` matches
every statute citation against the official text and fails the build if
one does not resolve.

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
