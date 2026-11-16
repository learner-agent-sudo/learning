#!/usr/bin/env python3
"""Extract the text of selected open source licences from the SPDX License List.

Source: the SPDX License List data (github.com/spdx/license-list-data), which
publishes each licence's text as its steward wrote it. The licences kept here
allow verbatim copies of their text (or are dedicated to the public domain);
source-available licences that do not are summarised in the site's own words
and linked instead.

For each licence in LICENCES this writes data/licences/<SPDX id>.json in the
same shape as data/caleg/<id>.json, with one "section" per numbered section of
the licence (plus "preamble", "appendix" or "full text"), so
scripts/build_statute_extracts.py can resolve citations such as
{"cap": "GPL-3.0-only", "section": "6"} or {"cap": "MIT", "section": "full text"}.

Usage:
    python scripts/extract_licences.py
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "licences"
BASE = "https://raw.githubusercontent.com/spdx/license-list-data/main/json"
PAGE = "https://spdx.org/licenses/{id}.html"

# SPDX id -> how the text is laid out: "numbered" (0. / 1. sections),
# "cc-sections" ("Section 1 – ..."), or "whole" (short licences shown entire).
LICENCES: dict[str, str] = {
    "0BSD": "whole",
    "MIT": "whole",
    "MIT-0": "whole",
    "BSD-2-Clause": "whole",
    "BSD-3-Clause": "whole",
    "ISC": "whole",
    "Zlib": "whole",
    "BSL-1.0": "whole",
    "Unlicense": "whole",
    "Apache-2.0": "numbered",
    "CC0-1.0": "numbered",
    "CC-BY-4.0": "cc-sections",
    "MPL-2.0": "numbered",
    "EPL-2.0": "numbered",
    "CDDL-1.0": "numbered",
    "EUPL-1.2": "numbered",
    "LGPL-2.1-only": "numbered",
    "LGPL-3.0-only": "numbered",
    "GPL-2.0-only": "numbered",
    "GPL-3.0-only": "numbered",
    "AGPL-3.0-only": "numbered",
}
# Licence exceptions (SPDX keeps them in a separate list).
EXCEPTIONS = ["Classpath-exception-2.0", "GCC-exception-3.1", "LLVM-exception"]

END = re.compile(r"(?im)^\s*END OF TERMS AND CONDITIONS\s*$")
APPENDIX = re.compile(r"(?m)^\s*(?:APPENDIX\b|Exhibit A\b|How to Apply These Terms|Appendix\b)")
TOP = re.compile(r"(?m)^[ \t*]*(\d{1,2})\.(?=[ \t]|[A-Z]|$)")
# Where a licence's own terms end and another licence's text, appended to it, begins.
CUT = {"LGPL-3.0-only": re.compile(r"(?m)^\s*GNU GENERAL PUBLIC LICENSE\s*$")}
CC = re.compile(r"(?m)^[ \t]*Section (\d)\s*[–-]")


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "learning-site-licence-extractor/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310 (fixed https host)
        return r.read()


def prep(text: str) -> str:
    """Normalise line ends; drop box borders and heading underlines."""
    text = text.replace("\r\n", "\n").replace("\t", " ")
    text = re.sub(r"(?m)^[ \t]*\*{5,}[ \t]*$", "", text)
    # Boxed paragraphs (MPL-2.0 ss.6-7) carry a "*" at both ends of each line.
    text = re.sub(r"(?m)^[ \t]*\*[ \t]?(.*?)[ \t]*\*[ \t]*$", r"\1", text)
    return re.sub(r"(?m)^[ \t]*-{3,}[ \t]*$", "", text)


def split_heading(body: str) -> str:
    """Put a short heading line ("Obligations of the Licensee") on its own paragraph."""
    lines = body.lstrip(" ").split("\n", 2)
    if len(lines) >= 2 and lines[0].strip() and len(lines[0].split()) <= 8 and (lines[1].strip()[:1].isupper() or lines[1].strip()[:1] in '“"') \
            and not lines[0].rstrip().endswith((",", ";", ":")):
        return lines[0] + "\n\n" + "\n".join(lines[1:])
    return body


def paragraphs(text: str) -> str:
    """Unwrap hard-wrapped lines; keep paragraph breaks and list items."""
    out: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        if not lines:
            continue
        joined: list[str] = []
        for ln in lines:
            # A new item starts a new line: (a), 1.1., a), bullets, "Section 2 –".
            if joined and re.match(r"^(?:\([a-z0-9ivx]+\)|\d+(?:\.\d+)+\.?|[a-z]\)|[-*•]|Section \d)\s", ln):
                joined.append(ln)
            elif joined:
                joined[-1] += " " + ln
            else:
                joined.append(ln)
        out.append("\n".join(joined))
    return "\n\n".join(out).strip()


def heading_of(body: str) -> str:
    """The section's own heading, when its first line is one ("0. Definitions.")."""
    first = body.split("\n", 1)[0].strip()
    m = re.match(r"^([A-Z][^.\n]{1,80}?)\.?$", first)
    if m and len(first) <= 82 and len(first.split()) <= 10:
        return m.group(1).strip()
    m = re.match(r"^([A-Z][A-Za-z ,'/&-]{2,60}?)\.\s", first)
    return m.group(1).strip() if m and len(m.group(1).split()) <= 8 else ""


def split_numbered(text: str, pattern: re.Pattern) -> list[dict]:
    end = END.search(text)
    terms_end = end.start() if end else len(text)
    hits = []
    expected = None
    for m in pattern.finditer(text, 0, terms_end):
        n = int(m.group(1))
        if expected is None:
            if n in (0, 1):
                hits.append(m)
                expected = n + 1
        elif n == expected:
            hits.append(m)
            expected = n + 1
    if len(hits) < 3:
        raise RuntimeError(f"found only {len(hits)} numbered sections")
    sections: list[dict] = []
    pre = paragraphs(text[: hits[0].start()])
    if len(pre) > 200:
        sections.append(named("Preamble", pre))
    last_end = terms_end
    if not end:
        app = APPENDIX.search(text, hits[-1].end())
        last_end = app.start() if app else len(text)
    for i, m in enumerate(hits):
        stop = hits[i + 1].start() if i + 1 < len(hits) else last_end
        body = paragraphs(split_heading(text[m.end(): stop]))
        num = m.group(1)
        sections.append({"id": f"s{num}", "num": num, "heading": heading_of(body), "status": "in-effect",
                         "text": f"{num}. {body}"})
    tail = paragraphs(text[last_end:])
    tail = re.sub(r"^END OF TERMS AND CONDITIONS\s*", "", tail).strip()
    if len(tail) > 120:
        sections.append(named("Appendix", tail))
    return sections


def named(name: str, text: str) -> dict:
    return {"id": "s" + name.upper().replace(" ", "-"), "num": name, "heading": "", "status": "in-effect",
            "label": name, "text": text}


def extract(spdx: str, layout: str, meta: dict, list_version: str, release: str, exception: bool) -> dict:
    data = json.loads(get(f"{BASE}/{'exceptions' if exception else 'details'}/{spdx}.json"))
    text = data["licenseExceptionText" if exception else "licenseText"]
    text = prep(text)
    if spdx in CUT:
        start = text.find("6. Revised Versions")
        m = CUT[spdx].search(text, max(start, 0))
        if m:
            text = text[: m.start()]
    if layout == "whole":
        sections = [named("Full text", paragraphs(text))]
    elif layout == "cc-sections":
        sections = split_numbered(text, CC)
        for s in sections:
            if s["num"].isdigit():
                s["text"] = re.sub(r"^\d+\.\s*", "", s["text"])
                s["text"] = f"Section {s['num']} – {s['text']}" if not s["text"].startswith("Section") else s["text"]
    else:
        sections = split_numbered(text, TOP)
    name = data.get("name") or meta.get("name") or spdx
    return {
        "cap": spdx,
        "title": name,
        "longTitle": name,
        "instrument": "licence exception" if exception else "licence",
        "versionDate": release,
        "listVersion": list_version,
        "hkelUrl": PAGE.format(id=spdx),
        "sectionLabel": "Section {n}",
        "source": f"SPDX License List {list_version}, licence text as published by its steward",
        "sourceShort": "SPDX",
        "kind": "licence",
        "osiApproved": bool(meta.get("isOsiApproved", data.get("isOsiApproved"))),
        "fsfLibre": bool(meta.get("isFsfLibre", data.get("isFsfLibre"))),
        "indexOnly": False,
        "parts": [],
        "sections": sections,
        "schedules": [],
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    listing = json.loads(get(f"{BASE}/licenses.json"))
    version, release = listing["licenseListVersion"], listing["releaseDate"]
    by_id = {l["licenseId"]: l for l in listing["licenses"]}
    failures = 0
    jobs = [(i, lay, False) for i, lay in LICENCES.items()] + [(e, "whole", True) for e in EXCEPTIONS]
    for spdx, layout, exc in jobs:
        try:
            doc = extract(spdx, layout, by_id.get(spdx, {}), version, release, exc)
        except Exception as e:  # keep going; report at the end
            print(f"  ! {spdx}: {e}", file=sys.stderr)
            failures += 1
            continue
        (OUT / f"{spdx}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        nums = ", ".join(s["num"] for s in doc["sections"])
        print(f"{spdx}: {doc['title']} | OSI {doc['osiApproved']} | {len(doc['sections'])} sections: {nums}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
