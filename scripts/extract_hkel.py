#!/usr/bin/env python3
"""Extract selected Hong Kong ordinances from e-Legislation open data.

Source: Hong Kong e-Legislation (Department of Justice), published on
DATA.GOV.HK as "Hong Kong Legislation (Current Version)". Reuse is
permitted with attribution under the DATA.GOV.HK terms. The extracted
text is not a "verified copy" under the Legislation Publication Ordinance
(Cap. 614); the site links to HKeL for the authoritative version.

For each chapter in CAPS this writes data/hkel/<cap>.json with the
chapter's Parts, sections and schedules (number, heading, status and,
unless the chapter is index-only, the plain text).

Runs on GitHub Actions (.github/workflows/refresh-hkel.yml): the bundles
are large (hundreds of MB) and HK government hosts are not reachable from
every network. Also usable locally on already-downloaded XML:
    python scripts/extract_hkel.py --xml path/to/cap_155_..._en_c.xml
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

BUNDLES = [
    ("https://resource.data.one.gov.hk/doj/data/hkel_c_leg_cap_1_cap_300_en.zip", 1, 300),
    ("https://resource.data.one.gov.hk/doj/data/hkel_c_leg_cap_301_cap_600_en.zip", 301, 600),
    ("https://resource.data.one.gov.hk/doj/data/hkel_c_leg_cap_601_cap_end_en.zip", 601, 10**6),
]

# Chapters used by the HK banking module. Large technical rule-books are
# kept index-only (Parts and headings, no text) to keep the repo small.
CAPS = [
    "66",    # Exchange Fund Ordinance
    "71",    # Control of Exemption Clauses Ordinance
    "155",   # Banking Ordinance
    "155L",  # Banking (Capital) Rules
    "155M",  # Banking (Disclosure) Rules
    "155Q",  # Banking (Liquidity) Rules
    "155S",  # Banking (Exposure Limits) Rules
    "405",   # Drug Trafficking (Recovery of Proceeds) Ordinance
    "455",   # Organized and Serious Crimes Ordinance
    "458",   # Unconscionable Contracts Ordinance
    "486",   # Personal Data (Privacy) Ordinance
    "537",   # United Nations Sanctions Ordinance
    "553",   # Electronic Transactions Ordinance
    "575",   # United Nations (Anti-Terrorism Measures) Ordinance
    "581",   # Deposit Protection Scheme Ordinance
    "584",   # Payment Systems and Stored Value Facilities Ordinance
    "615",   # Anti-Money Laundering and Counter-Terrorist Financing Ordinance
    "628",   # Financial Institutions (Resolution) Ordinance
    "628B",  # Financial Institutions (Resolution) (Loss-absorbing Capacity Requirements—Banking Sector) Rules
    "653",   # Protection of Critical Infrastructures (Computer Systems) Ordinance
    "656",   # Stablecoins Ordinance
]
INDEX_ONLY = {"155L", "155M", "155Q", "155S", "628B"}

NS = "{http://www.xml.gov.hk/schemas/hklm/1.0}"
DC = "{http://purl.org/dc/elements/1.1/}"
OUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "data" / "hkel"

# Elements that start a new numbered line in the rendered text.
STRUCTURAL = {
    "subsection", "paragraph", "subparagraph", "clause", "subclause",
    "subsubclause", "def", "proviso", "item", "level",
}
# Containers inside schedules whose number and heading head a block.
BLOCK = {"section", "part", "division", "subdivision"}
# Elements whose text completes the current line.
TEXTUAL = {"content", "leadIn", "continued", "text", "p"}
SKIP = {"num", "heading", "sourceNote", "editorialNote", "note", "marker", "commencementNote"}


def tag(el: ET.Element) -> str:
    return el.tag.rsplit("}", 1)[-1]


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def inline_text(el: ET.Element) -> str:
    """Text of an element, skipping notes and nested structural children."""
    parts: list[str] = [el.text or ""]
    for child in el:
        name = tag(child)
        if name in STRUCTURAL:
            parts.append(child.tail or "")
            continue
        if name not in SKIP:
            parts.append(inline_text(child))
        parts.append(child.tail or "")
    return "".join(parts)


def has_nested_structure(el: ET.Element) -> bool:
    """True if a numbered element sits anywhere below el's direct children."""
    return any(tag(d) in STRUCTURAL for child in el for d in child.iter())


def cell_text(el: ET.Element) -> str:
    """All text in a table cell, numbered sub-paragraphs included, notes left out."""
    parts: list[str] = [el.text or ""]
    for child in el:
        if tag(child) not in SKIP - {"num"}:
            parts.append(" " + cell_text(child) + " ")
        parts.append(child.tail or "")
    return squash("".join(parts))


def num_of(el: ET.Element) -> str:
    n = el.find(NS + "num")
    return squash("".join(n.itertext())) if n is not None else ""


def heading_of(el: ET.Element) -> str:
    h = el.find(NS + "heading")
    return squash("".join(h.itertext())) if h is not None else ""


def render(el: ET.Element, depth: int = 0, top: bool = True) -> list[str]:
    """Render a section/schedule body as indented plain-text lines.

    Mixed content (e.g. a definition: <term>…</term> (<term>中文</term>)
    means …) is read in document order; numbered children start new lines.
    """
    lines: list[str] = []
    buf: list[str] = []

    def flush() -> None:
        text = squash("".join(buf))
        buf.clear()
        if text:
            lines.append("  " * depth + text)

    if not top:
        label = num_of(el)
        if tag(el) in BLOCK and heading_of(el):
            label = f"{label} {heading_of(el)}".strip()
        if label:
            buf.append(label + " ")
    buf.append(el.text or "")
    for child in el:
        name = tag(child)
        if name in SKIP:
            pass
        elif name in STRUCTURAL or name in BLOCK:
            flush()
            lines.extend(render(child, depth + 1 if name in STRUCTURAL else depth, top=False))
        elif name == "table":
            # HTML-style (tr/td) or CALS-style (row/entry) rows.
            flush()
            for row in (r for r in child.iter() if tag(r) in ("tr", "row")):
                cells = [cell_text(c) for c in row if tag(c) in ("td", "th", "entry")]
                lines.append("  " * depth + " | ".join(c for c in cells if c))
        elif child.find(f".//{NS}table") is not None or has_nested_structure(child):
            # A wrapper (a table, a CALS row or entry, ...) holding numbered
            # paragraphs below its direct children: inline_text would drop
            # them (e.g. Cap. 653 Sch. 6 item 1), so render it as a block.
            flush()
            lines.extend(render(child, depth, top=False))
        elif name in TEXTUAL:
            buf.append(inline_text(child))
            flush()
        else:
            buf.append(inline_text(child))
        buf.append(child.tail or "")
    flush()
    return lines


def status_of(el: ET.Element) -> str:
    """'in-effect', or why not (e.g. 'repealed', 'omitted' as spent)."""
    status = el.get("status") or ""
    if status in ("repealed", "omitted") or el.get("reason") == "repealed":
        return status or "repealed"
    return "in-effect"


def unit(el: ET.Element, part: str | None, with_text: bool) -> dict:
    entry = {
        "id": el.get("name"),
        "num": num_of(el).rstrip("."),
        "heading": heading_of(el),
        "status": status_of(el),
    }
    if part:
        entry["part"] = part
    if with_text and entry["status"] == "in-effect":
        entry["text"] = "\n".join(render(el))
    return entry


def parse(xml_bytes: bytes, cap: str) -> dict:
    root = ET.fromstring(xml_bytes)
    meta = root.find(NS + "meta")
    main = root.find(NS + "main")
    with_text = cap not in INDEX_ONLY

    # The citation provision (s. 1, "Short title") names the instrument;
    # earlier <shortTitle> tags can be cross-references to other chapters.
    s1 = next((s for s in main.iter(NS + "section") if s.get("name") == "s1"), None)
    short = s1.find(f".//{NS}shortTitle") if s1 is not None else None
    if short is None:
        short = main.find(NS + "docTitle")  # subsidiary legislation
    if short is None:
        short = main.find(f".//{NS}shortTitle")
    long_title = main.find(NS + "longTitle")
    doc = {
        "cap": cap,
        "title": squash("".join(short.itertext())) if short is not None else "",
        "longTitle": squash(inline_text(long_title)) if long_title is not None else "",
        "versionDate": meta.findtext(DC + "date") or "",
        "hkelUrl": f"https://www.elegislation.gov.hk/hk/cap{cap}",
        "indexOnly": not with_text,
        "parts": [],
        "sections": [],
        "schedules": [],
    }

    for part in main.iter(NS + "part"):
        name = part.get("name")
        doc["parts"].append({
            "id": name,
            "num": num_of(part),
            "heading": heading_of(part),
            "status": status_of(part),
            "sections": [s.get("name") for s in part.iter(NS + "section")],
        })
    part_of = {s: p["id"] for p in doc["parts"] for s in p["sections"]}

    schedules = list(main.iter(NS + "schedule"))
    in_schedule = {id(s) for sch in schedules for s in sch.iter(NS + "section")}
    for sec in main.iter(NS + "section"):
        if id(sec) in in_schedule:
            continue
        doc["sections"].append(unit(sec, part_of.get(sec.get("name")), with_text))
    for sch in schedules:
        entry = unit(sch, None, with_text)
        # Schedules are often cited by inner section ("Sch. 2, s. 9").
        entry["items"] = [unit(s, None, with_text) for s in sch.iter(NS + "section")]
        doc["schedules"].append(entry)

    # Fall back to the document name when the short title is not marked up.
    if not doc["title"]:
        doc["title"] = meta.findtext(NS + "docName") or f"Cap. {cap}"
    return doc


def member_for(names: list[str], cap: str) -> str | None:
    folder = f"cap_{cap}_en_c"
    hits = [n for n in names
            if n.replace("\\", "/").split("/")[0] == folder
            and n.lower().endswith(".xml") and "images" not in n.lower()]
    return sorted(hits)[-1] if hits else None


def cap_number(cap: str) -> int:
    return int(re.match(r"\d+", cap).group(0))


def download(url: str, dest: pathlib.Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "learning-site/1.0"})
    with urllib.request.urlopen(req, timeout=600) as resp, dest.open("wb") as fh:
        while chunk := resp.read(1 << 20):
            fh.write(chunk)


def write(doc: dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{doc['cap']}.json"
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    n_text = sum(1 for s in doc["sections"] if "text" in s)
    print(f"  Cap. {doc['cap']} {doc['title']!r} as at {doc['versionDate']}: "
          f"{len(doc['parts'])} parts, {len(doc['sections'])} sections ({n_text} with text), "
          f"{len(doc['schedules'])} schedules -> {path.name}")


def run_bundles() -> int:
    missing: list[str] = []
    with tempfile.TemporaryDirectory() as tmp:
        for url, lo, hi in BUNDLES:
            wanted = [c for c in CAPS if lo <= cap_number(c) <= hi]
            if not wanted:
                continue
            zpath = pathlib.Path(tmp) / url.rsplit("/", 1)[-1]
            print(f"Downloading {url} for {', '.join(wanted)} ...", flush=True)
            download(url, zpath)
            with zipfile.ZipFile(zpath) as zf:
                names = zf.namelist()
                for cap in wanted:
                    member = member_for(names, cap)
                    if not member:
                        missing.append(cap)
                        print(f"::warning::Cap. {cap} not found in bundle")
                        continue
                    # One malformed chapter must not block the others; the
                    # previous extract stays in place and the run is flagged.
                    try:
                        write(parse(zf.read(member), cap))
                    except Exception as err:  # noqa: BLE001
                        missing.append(cap)
                        print(f"::warning::Cap. {cap} failed to parse: {type(err).__name__}: {err}")
            zpath.unlink()
    if missing:
        print(f"Not extracted: {', '.join(missing)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xml", nargs="*", help="parse local XML files instead of downloading")
    args = ap.parse_args()
    if args.xml:
        for path in args.xml:
            m = re.search(r"cap_([0-9]+[A-Z]*)_", pathlib.Path(path).name)
            write(parse(pathlib.Path(path).read_bytes(), m.group(1)))
        return 0
    return run_bundles()


if __name__ == "__main__":
    sys.exit(main())
