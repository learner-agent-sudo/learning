# Kickoff prompt for the build session

Paste the prompt below into a fresh Claude Code session pointed at this
repo. It assumes `README.md`, `docs/mna/workflow-mapping.md`, and
`docs/mna/architecture.md` are already present (they are — committed alongside
this file).

---

I'm building an interactive M&A workflow visualizer. The repo already
contains a design bundle (`README.md`, `docs/mna/workflow-mapping.md`,
`docs/mna/architecture.md`) prepared in a previous Claude session. **Read all
three before doing anything.** They define scope, the 9-stage APA
workflow, CUAD clause mappings, hand-authored APA gap-fill clauses, the
tech stack (Next.js 15 + React 19 + TS + Tailwind + Mermaid), file layout,
and the CUAD extraction script.

**Decisions already locked in** (do not re-litigate unless I bring them up):

- Deal type for v1: Asset Purchase Agreement (APA) only. SPA and Merger
  paths are shown greyed-out at the LOI branching node.
- Audience: mixed; a Beginner ↔ Practitioner depth toggle controls
  side-panel content.
- Data source: CUAD (`theatticusproject/cuad-qa` on Hugging Face) is core,
  augmented with hand-authored APA gap-fill clauses already drafted in
  `docs/mna/workflow-mapping.md`.
- 9 stages: Strategy (pre-process, dashed) → NDA → LOI → DD → APA Drafting
  → Signing → Pre-Closing → Closing → Post-Closing.
- DD is a single node in v1; expand into sub-streams later.
- Static site, no backend. CUAD pre-processed into `public/clauses.json`
  by a Python script.
- I am not an M&A lawyer — drive the legal substance yourself, and check
  with me on UX/product decisions.

**Your task — execute in this order:**

1. **Confirm scope.** After reading the bundle, summarize back to me in
   <150 words what you understood and flag anything that looks wrong or
   under-specified. Do not start coding until I say go.
2. **Scaffold the Next.js app** per `docs/mna/architecture.md`: `package.json`,
   `next.config.js` (with `output: 'export'`), Tailwind, TypeScript, the
   file layout shown in the architecture doc. Use Next.js 15 App Router
   and React 19.
3. **Extract the data into typed code:**
   - `lib/workflow.ts` — the 9 stages with the `Stage` type from the
     architecture doc, populated from `docs/mna/workflow-mapping.md`.
   - `lib/glossary.ts` — the glossary terms collected across stages.
   - `data/apa-gap-fills.json` — the hand-authored APA gap-fill clauses
     lifted out of the markdown.
4. **Build the vertical slice** end-to-end for **Stage 4 (Due Diligence)**
   only:
   - `WorkflowDiagram` rendering only that stage's node (stub Mermaid
     spec).
   - `StagePanel` rendering description (depth-aware), document checklist,
     CUAD clause cards (use a tiny stub `public/clauses.json` with 1–2
     example entries; do NOT run the full CUAD extraction yet), and APA
     gap-fill cards.
   - `DepthToggle` and `GlossaryTooltip` working.
   - `DealTypeSelector` with APA active, SPA/Merger disabled with
     "coming soon" tooltips.
5. **Run `npm run dev` and verify in a browser** that the vertical slice
   works (golden path + at least one edge case like switching depth
   mid-view). If you cannot test in a browser, say so explicitly — do not
   claim it works.
6. **Show me the result** and wait for my approval before fanning out to
   all 9 stages.
7. **After approval, fan out to all 9 stages**, then write
   `scripts/extract_cuad.py` per the architecture doc, run it (you'll
   need `pip install datasets`), and verify the real `public/clauses.json`
   populates the UI.
8. **Polish:** about page with the CUAD disclaimer from
   `docs/mna/workflow-mapping.md`, basic responsive layout, clause provenance
   pills (CUAD vs hand-authored), accessibility check (keyboard nav of the
   diagram nodes).

**Don't:**

- Add features beyond v1 scope (no SPA path, no swimlanes, no timelines,
  no DD sub-streams).
- Skip the vertical slice and try to build everything at once.
- Run the full CUAD extraction before the vertical slice works — it's slow
  and you might be rebuilding the data shape.
- Claim a UI works without actually verifying it in a browser.

**Commit conventions:** small, focused commits with clear messages.
Branch off `main`. Do not create a PR unless I ask.

Start with step 1 now.
