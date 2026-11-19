#!/usr/bin/env python3
"""Check the Desk's interview questions against the stage text.

Every answer line on the Desk is a whole sentence or bullet of a stage, found by a quote. This
script fails (exit 1) when a quote matches no sentence, or more than one, in its stage; when a
question's wording could carry a legal claim (a citation in the question); or when a question
points at a block that does not exist. It mirrors swSources() in lib/swUnits.ts.

    python3 scripts/check_desk.py                       # data/software-ip/desk.json
    python3 scripts/check_desk.py --file drafts.json    # a draft, same shape
    python3 scripts/check_desk.py --find releasing "Apache"   # list a stage's sentences that match
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
STAGES = ROOT / "data" / "software-ip" / "stages.json"
DESK = ROOT / "data" / "software-ip" / "desk.json"
BEATS = {"answer", "rule", "options", "bank", "pressed"}
ROLES = {"Product lead", "Designer", "CTO", "Engineering lead", "Risk", "Compliance", "General counsel",
         "Board", "COO", "Procurement", "Marketing", "Data science lead", "Security lead", "Interviewer"}
CITATION = re.compile(r"§|\bss?\.\s?\d|\bU\.S\.C\b|\bC\.F\.R\b|\bCap\.\s?\d|\bArt\.\s?\d")


def plain(s: str) -> str:
    s = re.sub(r"\[\[([^|\]]+)\|[^\]]+\]\]", r"\1", s)
    return re.sub(r"\s+", " ", s.replace("**", "")).strip()


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]


def sources(st: dict) -> list[tuple[str, str]]:
    b = f"sw-{st['id']}"
    out: list[tuple[str, str]] = []

    def add(unit: str, raw: str | None) -> None:
        if raw:
            out.append((unit, plain(raw)))

    add(f"{b}-head", st.get("oneLiner"))
    for t in st.get("keyPoints", []):
        add(f"{b}-key", t)
    for i, d in enumerate(st.get("deepDive", [])):
        u = f"{b}-s{i + 1}"
        add(u, d.get("lede"))
        for t in d.get("points", []):
            add(u, t)
        add(u, d.get("takeaway"))
    for key, field in (("engineering", "itAngle"), ("bank", "virtualBankNotes"), ("product", "productNotes")):
        for t in st.get(field) or []:
            add(f"{b}-{key}", t)
    for e in st.get("elsewhere") or []:
        for t in e["points"]:
            add(f"{b}-elsewhere-{e['place'].lower()}", t)
    for t in st.get("pitfalls", []):
        add(f"{b}-pitfalls", t)
    for p in st.get("provisions", []):
        u = f"{b}-prov-{slug(p['instrument'] + ' ' + p['ref'])}"
        add(u, p.get("summary"))
        add(u, p.get("counselNote"))
    for t in st.get("checklist", []):
        add(f"{b}-checklist", t)
    return out


def lint_words(text: str, what: str, errors: list[str], limit: int = 45) -> None:
    if "—" in text:
        errors.append(f"{what}: em dash")
    if CITATION.search(text):
        errors.append(f"{what}: carries a citation; put law in the answer lines, not the question")
    if len(text.split()) > limit:
        errors.append(f"{what}: {len(text.split())} words (at most {limit})")


def main(argv: list[str]) -> int:
    stages = {s["id"]: s for s in json.loads(STAGES.read_text(encoding="utf-8"))}
    src = {sid: sources(s) for sid, s in stages.items()}
    if "--find" in argv:
        i = argv.index("--find")
        sid, needle = argv[i + 1], plain(argv[i + 2]).lower()
        for unit, text in src.get(sid, []):
            if needle in text.lower():
                print(f"{unit}\t{text}")
        return 0
    path = pathlib.Path(argv[argv.index("--file") + 1]) if "--file" in argv else DESK
    data = json.loads(path.read_text(encoding="utf-8"))
    questions = data["questions"] if isinstance(data, dict) else data
    errors: list[str] = []
    seen_ids: set[str] = set()

    def pin(p: dict, where: str) -> str | None:
        sid, q = p.get("stage"), plain(p.get("quote", ""))
        if sid not in src:
            errors.append(f"{where}: no stage {sid!r}")
            return None
        if len(q) < 25:
            errors.append(f"{where}: quote too short to be unique ({q!r})")
        hits = [u for u, t in src[sid] if q in t]
        if len(hits) != 1:
            errors.append(f"{where}: quote matches {len(hits)} sentences in {sid}: {q[:70]!r}")
            return None
        return hits[0]

    def lines(ls: list[dict], where: str, need_core: bool) -> None:
        if not ls:
            errors.append(f"{where}: no lines")
        for j, ln in enumerate(ls):
            if ln.get("beat") not in BEATS:
                errors.append(f"{where} line {j}: beat {ln.get('beat')!r}")
            pin(ln.get("pin", {}), f"{where} line {j}")
        if need_core and not any(ln.get("core") for ln in ls):
            errors.append(f"{where}: no core line")

    for q in questions:
        qid = q.get("id", "?")
        w = f"[{qid}]"
        if qid in seen_ids:
            errors.append(f"{w} duplicate id")
        seen_ids.add(qid)
        if q.get("stage") not in stages:
            errors.append(f"{w} no stage {q.get('stage')!r}")
            continue
        ask = q.get("ask", "")
        if not ask.endswith("?"):
            errors.append(f"{w} ask does not end with a question mark")
        lint_words(ask, f"{w} ask", errors)
        col = q.get("colleague")
        if col:
            if col.get("role") not in ROLES:
                errors.append(f"{w} colleague role {col.get('role')!r} not in {sorted(ROLES)}")
            lint_words(col.get("text", ""), f"{w} colleague", errors)
        units = {u for u, _ in src[q["stage"]]}
        if q.get("primes") and q["primes"] not in units:
            errors.append(f"{w} primes {q['primes']!r} is not a block of {q['stage']}")
        lines(q.get("lines", []), w, True)
        ch = q.get("choices")
        if ch:
            opts = ch.get("options", [])
            if len(opts) < 3 or not any(o.get("in") for o in opts) or all(o.get("in") for o in opts):
                errors.append(f"{w} choices need at least 3 options, some in and some out")
            for k, o in enumerate(opts):
                lint_words(o.get("label", ""), f"{w} choice {k}", errors, 14)
                if o.get("pin"):
                    pin(o["pin"], f"{w} choice {k}")
        for k, f in enumerate(q.get("followUps") or []):
            fa = f.get("ask", "")
            if not fa.endswith("?"):
                errors.append(f"{w} follow-up {k} does not end with a question mark")
            lint_words(fa, f"{w} follow-up {k}", errors)
            lines(f.get("lines", []), f"{w} follow-up {k}", False)

    for e in errors:
        print("  !", e)
    print(f"{len(questions)} questions, {len(errors)} problems ({path.name})")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
