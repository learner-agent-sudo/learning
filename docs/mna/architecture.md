# Architecture

## Tech stack

- **Next.js 15** with the App Router, configured with `output: 'export'`
  for fully static hosting.
- **React 19**.
- **TypeScript** (strict).
- **Tailwind CSS** for styling.
- **Mermaid** (`mermaid` npm package) for the workflow diagram, rendered
  client-side. Each stage node is a clickable target that opens the side
  panel.
- **Hugging Face `datasets`** (Python) used **at build time only** to
  produce `public/clauses.json` from CUAD. The runtime has no Python
  dependency.
- No database, no API routes, no auth.

## File layout

```
.
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # topic hub (all learning topics)
│   ├── mna/
│   │   ├── layout.tsx            # route metadata
│   │   ├── page.tsx              # main visualizer
│   │   └── about/page.tsx        # disclaimer + CUAD attribution
│   └── globals.css
├── components/
│   ├── WorkflowDiagram.tsx       # Mermaid renderer + click handler
│   ├── StagePanel.tsx            # side panel, depth-aware
│   ├── ClauseCard.tsx            # one clause: title, excerpt, provenance
│   ├── DocumentList.tsx          # documents produced at a stage
│   ├── GlossaryTooltip.tsx       # hover/tap definitions
│   ├── DepthToggle.tsx           # Beginner / Practitioner switch
│   └── DealTypeSelector.tsx      # APA active; SPA, Merger disabled
├── lib/
│   ├── workflow.ts               # the 9 stages, typed
│   ├── glossary.ts               # term -> definition map
│   └── clauses.ts                # loader + types for clauses.json
├── data/
│   └── apa-gap-fills.json        # hand-authored APA-specific clauses
├── public/
│   ├── clauses.json              # produced by scripts/extract_cuad.py
│   └── privacy/dataguard/        # GDPR game (separate topic, static HTML)
├── scripts/
│   └── extract_cuad.py           # one-shot CUAD -> clauses.json
├── docs/
│   └── mna/
│       ├── workflow-mapping.md
│       ├── architecture.md
│       └── PROMPT.md             # original kickoff prompt
├── README.md
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Core types

```ts
// lib/workflow.ts
export type Depth = 'beginner' | 'practitioner';
export type DealType = 'apa' | 'spa' | 'merger';
export type ClauseProvenance = 'cuad' | 'hand-authored';

export interface Document {
  name: string;
  description?: string;
}

export interface ClauseRef {
  id: string;                  // matches clauses.json or apa-gap-fills.json
  category: string;            // CUAD category or hand-authored title
  provenance: ClauseProvenance;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface Stage {
  id: string;                  // 'strategy', 'nda', 'loi', 'dd', ...
  index: number;               // 1..9
  title: string;
  kind: 'pre-process' | 'normal' | 'branch';
  description: { beginner: string; practitioner: string };
  documents: Document[];
  clauses: ClauseRef[];
  glossary: GlossaryTerm[];
  dealTypes: DealType[];       // which deal types include this stage
}
```

```ts
// lib/clauses.ts (shape of public/clauses.json entries)
export interface CuadClause {
  id: string;                  // stable id, e.g. 'cuad-anti-assignment-001'
  category: string;            // CUAD category, e.g. 'Anti-Assignment'
  contract_title: string;      // CUAD's contract filename / title
  contract_type?: string;      // best-effort tag (License, MSA, etc.)
  excerpt: string;             // the labeled span
  source: 'cuad';
}

export interface GapFillClause {
  id: string;                  // 'gf-purchased-assets'
  category: string;            // 'Purchased Assets'
  description: string;
  example_text: string;        // illustrative drafting
  source: 'hand-authored';
}
```

## CUAD extraction script

`scripts/extract_cuad.py` is run once locally (or in CI) to produce
`public/clauses.json`.

```python
# Pseudocode — implementer to fill in.
# pip install datasets
from datasets import load_dataset
import json, re, hashlib, pathlib

CUAD_CATEGORIES_WE_USE = [
    "Governing Law",
    "Anti-Assignment",
    "Change Of Control",
    "Most Favored Nation",
    "Exclusivity",
    "Non-Compete",
    "No-Solicit Of Employees",
    "No-Solicit Of Customers",
    "Termination For Convenience",
    "Audit Rights",
    "Insurance",
    "IP Ownership Assignment",
    "License Grant",
    "Cap On Liability",
    "Non-Disparagement",
    "Notice Period To Terminate Renewal",
]

MAX_PER_CATEGORY = 3            # keep clauses.json small
MAX_EXCERPT_CHARS = 1200

def main():
    ds = load_dataset("theatticusproject/cuad-qa", split="train")
    # CUAD-QA layout: each row is a (contract, question, answer) tuple
    # where the question encodes the category. Group by category, dedupe
    # by (contract_title, excerpt prefix), keep first MAX_PER_CATEGORY
    # non-empty answers per category.
    out = []
    by_cat = {}
    for row in ds:
        cat = extract_category(row["question"])  # parse "Highlight the parts ... related to \"X\" ..."
        if cat not in CUAD_CATEGORIES_WE_USE:
            continue
        answers = row["answers"]["text"]
        if not answers:
            continue
        for ans in answers:
            ans = ans.strip()
            if not ans:
                continue
            entry = {
                "id": stable_id(cat, row["title"], ans),
                "category": cat,
                "contract_title": row["title"],
                "excerpt": ans[:MAX_EXCERPT_CHARS],
                "source": "cuad",
            }
            by_cat.setdefault(cat, [])
            if len(by_cat[cat]) < MAX_PER_CATEGORY and not is_dup(by_cat[cat], entry):
                by_cat[cat].append(entry)

    for cat, entries in by_cat.items():
        out.extend(entries)

    pathlib.Path("public/clauses.json").write_text(
        json.dumps(out, indent=2)
    )

def extract_category(question: str) -> str:
    m = re.search(r'"([^"]+)"', question)
    return m.group(1) if m else ""

def stable_id(cat, title, excerpt):
    h = hashlib.sha1(f"{cat}|{title}|{excerpt[:200]}".encode()).hexdigest()[:10]
    slug = re.sub(r'[^a-z0-9]+', '-', cat.lower()).strip('-')
    return f"cuad-{slug}-{h}"

def is_dup(existing, entry):
    return any(e["excerpt"][:200] == entry["excerpt"][:200] for e in existing)

if __name__ == "__main__":
    main()
```

The script is **deliberately simple**: cap at 3 excerpts per category to
keep `clauses.json` under ~150 KB. The exact CUAD-QA field names should
be verified against the dataset card before relying on them; the
implementer should `print(ds.features)` first.

## Component contracts

- `WorkflowDiagram` — renders a Mermaid `flowchart TD` derived from
  `lib/workflow.ts`. Stage nodes have `id`s matching `Stage.id`. The
  component installs a click handler on rendered SVG nodes that calls
  `onSelectStage(stageId)`. The pre-process Strategy node is dashed via
  Mermaid `classDef`. SPA / Merger placeholder nodes are styled disabled.
- `StagePanel` — receives `stage: Stage`, `depth: Depth`, `clauseLookup`.
  Renders description (depth-keyed), documents, clauses (CUAD + gap-fill
  cards intermixed, sorted CUAD-first), glossary chips at the bottom.
- `DepthToggle` — controlled component, lifts to page-level state.
- `DealTypeSelector` — APA active; SPA / Merger render with
  `aria-disabled` and a "Coming soon" tooltip.
- `GlossaryTooltip` — wraps a term; on hover/focus shows the definition
  from `lib/glossary.ts`. Used inside descriptions via a small
  `<Term>foo</Term>` wrapper that the panel renders.

## Static export config

`next.config.js`:

```js
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

## Build & deploy

```
npm install
npm run dev          # local dev
python scripts/extract_cuad.py    # once, to populate public/clauses.json
npm run build        # produces ./out/
```

`./out/` is uploadable to any static host (GitHub Pages, Netlify,
Cloudflare Pages, S3+CloudFront).

## Out of scope for v1

- SPA and Merger workflow content (placeholder nodes only).
- DD sub-streams.
- Swimlane / role-based view (buyer-counsel vs. seller-counsel).
- Timeline / Gantt view.
- Search across clauses.
- Persisted user state (depth toggle is in-memory).
