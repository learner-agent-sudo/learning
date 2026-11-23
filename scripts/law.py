#!/usr/bin/env python3
"""Print one section of the extracted statute or licence text, for drafting and checking.

    python3 scripts/law.py 35-USC 102          # U.S. Code section
    python3 scripts/law.py 17-USC '101 "computer program"'
    python3 scripts/law.py Apache-2.0 3        # licence section
    python3 scripts/law.py 514 9A --full       # Hong Kong ordinance, whole text
    python3 scripts/law.py P-4 --list          # the sections held for an instrument

The id is the file name under data/hkel, data/caleg, data/usleg or data/licences. Sections
resolve exactly as scripts/build_statute_extracts.py resolves a stage citation, so a section
this prints is one a stage can cite. Without --full, long text is cut at 3,000 characters.
"""
from __future__ import annotations

import json
import sys

import build_statute_extracts as bse
from build_statute_extracts import SOURCES, parse_ref, resolve


def load(cap: str) -> dict | None:
    for d in SOURCES:
        p = d / f"{cap}.json"
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8"))
    return None


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    full, listing = "--full" in argv, "--list" in argv
    if not args:
        print(__doc__)
        return 2
    doc = load(args[0])
    if doc is None:
        print(f"no extract for {args[0]!r}; held: " + ", ".join(sorted(p.stem for d in SOURCES for p in d.glob("*.json"))))
        return 1
    if listing or len(args) == 1:
        print(f"{doc.get('title')} ({doc.get('versionDate', '')})")
        for s in doc["sections"]:
            print(f"  {s['num']:<10} {s.get('heading', '')}")
        return 0
    ref = parse_ref(args[1])
    if full:
        # The site clips long sections for display; --full must show all of the held text.
        bse.MAX_CHARS = sys.maxsize
    hit = resolve(doc, ref) if ref else None
    if not hit:
        print(f"{args[1]!r} does not resolve in {args[0]}")
        return 1
    text = hit.get("text", "")
    print(f"{doc.get('title')} · {hit.get('label') or args[1]} · {hit.get('heading', '')}")
    print(text if full or len(text) <= 3000 else text[:3000] + "\n[... cut; add --full]")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
