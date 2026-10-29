#!/usr/bin/env python3
"""Attach official statute text to the regulation modules' cited provisions.

For each module in MODULES, reads data/<module>/stages.json and the
e-Legislation extracts in data/hkel/<cap>.json, and writes
data/<module>/statute-extracts.json:

  extracts   one entry per cited (cap, section) that resolves
  unresolved citations that do not match a section/schedule in force —
             treated as errors to fix in the content
  anatomy    Parts and Schedules of the module's main ordinance

Run after editing the stages or refreshing data/hkel:
    python scripts/build_statute_extracts.py
Exits non-zero when a citation does not resolve, so CI catches drift.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HKEL = ROOT / "data" / "hkel"

# Module folder under data/, and the chapter whose anatomy it shows.
MODULES = [("banking", "155"), ("securities", "571")]

MAX_CHARS = 6000  # long sections (e.g. s. 2 definitions) are cut; HKeL has the rest

ORDINALS = {
    w: i for i, w in enumerate(
        "first second third fourth fifth sixth seventh eighth ninth tenth eleventh "
        "twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth "
        "nineteenth twentieth".split(), start=1)
}

SCHEDULE = re.compile(
    r"(?i)^(?:sch(?:edule|ed)?\.?\s*(?P<n>\d+[A-Z]?)|(?P<word>[a-z]+)\s+schedule)"
    r"(?:\s*[,;]?\s*(?:s(?:ection)?s?\.?|para(?:graph)?s?\.?)\s*(?P<item>\d+[A-Z]*))?"
)
SECTION = re.compile(r"(?i)^(?:s(?:ection)?s?\.?\s*)?(?P<num>\d+[A-Z]*)")
PART = re.compile(r"(?i)^(?:pt|part)\.?\s*(?P<num>[0-9]+[A-Z]*|[IVXL]+[A-Z]*)\b")


def parse_ref(section: str) -> tuple[str, str, str | None] | None:
    text = section.strip()
    m = PART.match(text)
    if m:
        return ("part", m.group("num").upper(), None)
    m = SCHEDULE.match(text)
    if m:
        n = m.group("n") or ORDINALS.get((m.group("word") or "").lower())
        return ("sch", str(n), m.group("item")) if n else None
    m = SECTION.match(text)
    return ("s", m.group("num").upper(), None) if m else None


def load_cap(cap: str, cache: dict) -> dict | None:
    if cap not in cache:
        path = HKEL / f"{cap}.json"
        cache[cap] = json.loads(path.read_text(encoding="utf-8")) if path.exists() else None
    return cache[cap]


def clip(text: str) -> tuple[str, bool]:
    if len(text) <= MAX_CHARS:
        return text, False
    cut = text.rfind("\n", 0, MAX_CHARS)
    return text[: cut if cut > 0 else MAX_CHARS], True


def resolve_part(doc: dict, num: str) -> dict | None:
    part = next((p for p in doc["parts"] if p["num"].upper() == f"PART {num}"), None)
    if not part or part["status"] != "in-effect":
        return None
    by_id = {s["id"]: s for s in doc["sections"]}
    lines = [f"s. {by_id[i]['num']}  {by_id[i]['heading']}"
             for i in part["sections"] if i in by_id and by_id[i]["status"] == "in-effect"]
    return {
        "label": part["num"],
        "heading": part["heading"],
        "capTitle": doc["title"],
        "versionDate": doc["versionDate"],
        "hkelUrl": doc["hkelUrl"],
        "isPart": True,
        "text": "\n".join(lines),
        "truncated": False,
    }


def resolve(doc: dict, ref: tuple[str, str, str | None]) -> dict | None:
    kind, num, item = ref
    if kind == "part":
        return resolve_part(doc, num)
    if kind == "s":
        hit = next((s for s in doc["sections"] if s["id"] == f"s{num}"), None)
        label = f"s. {num}"
        part = next((p for p in doc["parts"] if p["id"] == hit.get("part")), None) if hit else None
    else:
        sch = next((s for s in doc["schedules"] if s["id"] == f"sch{num}"), None)
        hit = sch
        label = sch["num"] if sch else f"Schedule {num}"
        if sch and item:
            hit = next((i for i in sch.get("items", []) if i["num"] == item), None)
            label = f"{sch['num']}, s. {item}"
        part = None
    if not hit or hit.get("status") != "in-effect":
        return None
    entry = {
        "label": label,
        "heading": hit.get("heading") or (sch["heading"] if kind == "sch" else ""),
        "capTitle": doc["title"],
        "versionDate": doc["versionDate"],
        "hkelUrl": doc["hkelUrl"],
    }
    if part:
        entry["part"] = f"{part['num']} — {part['heading']}"
    if "text" in hit:
        entry["text"], entry["truncated"] = clip(hit["text"])
    return entry


def anatomy(doc: dict) -> dict:
    def nums(ids: list[str]) -> list[str]:
        return [i[1:] for i in ids]
    # Parts inside Schedules are numbered in arabic (Part 1, 2, ...); when the
    # body's Parts are in roman numerals, keep only those.
    roman = bool(doc["parts"]) and re.fullmatch(r"Part [IVXL]+[A-Z]*", doc["parts"][0]["num"])
    parts = []
    for p in doc["parts"]:
        if p["status"] != "in-effect" or not p["heading"] or not p["sections"]:
            continue
        if roman and not re.fullmatch(r"Part [IVXL]+[A-Z]*", p["num"]):
            continue
        secs = nums(p["sections"])
        parts.append({"num": p["num"], "heading": p["heading"],
                      "range": f"ss. {secs[0]}–{secs[-1]}" if len(secs) > 1 else f"s. {secs[0]}"})
    schedules = [{"num": s["num"], "heading": s["heading"]}
                 for s in doc["schedules"] if s["status"] == "in-effect" and s["heading"]]
    return {"cap": doc["cap"], "title": doc["title"], "versionDate": doc["versionDate"],
            "hkelUrl": doc["hkelUrl"], "parts": parts, "schedules": schedules}


def build(module: str, main_cap: str, cache: dict) -> int:
    stages_path = ROOT / "data" / module / "stages.json"
    out_path = ROOT / "data" / module / "statute-extracts.json"
    stages = json.loads(stages_path.read_text(encoding="utf-8"))
    extracts: dict[str, dict] = {}
    unresolved: list[dict] = []
    for stage in stages:
        for p in stage["provisions"]:
            cap, section = p.get("cap"), p.get("section")
            if not cap or not section:
                continue
            key = f"{cap}|{section}"
            if key in extracts:
                continue
            doc = load_cap(cap, cache)
            ref = parse_ref(section)
            hit = resolve(doc, ref) if doc and ref else None
            if hit:
                extracts[key] = hit
            else:
                reason = "chapter not extracted" if not doc else "unparseable reference" if not ref else "no such provision in force"
                unresolved.append({"stage": stage["id"], "cap": cap, "section": section,
                                   "ref": p["ref"], "reason": reason})

    doc = load_cap(main_cap, cache)
    out = {
        "extracts": extracts,
        "unresolved": unresolved,
        "anatomy": anatomy(doc) if doc else None,
    }
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{module}: {len(extracts)} provisions resolved, {len(unresolved)} unresolved -> {out_path.relative_to(ROOT)}")
    for u in unresolved:
        print(f"  ! [{u['stage']}] Cap. {u['cap']} {u['section']!r} ({u['ref']}): {u['reason']}")
    return len(unresolved)


def main() -> int:
    cache: dict = {}
    failures = sum(build(module, cap, cache) for module, cap in MODULES
                   if (ROOT / "data" / module / "stages.json").exists())
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
