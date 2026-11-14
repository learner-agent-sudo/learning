#!/usr/bin/env python3
"""Extract selected federal Acts and regulations of Canada from the Justice
Laws consolidated XML.

Source: the consolidated Acts and regulations published by the Department of
Justice Canada as XML (github.com/justicecanada/laws-lois-xml, mirroring the
Justice Laws Website). The Reproduction of Federal Law Order (SI/97-5) lets
anyone reproduce federal enactments without charge or permission, provided
due diligence is exercised in ensuring accuracy and the reproduction is not
represented as an official version. The site says so wherever it shows the
text, and links to laws-lois.justice.gc.ca for the official version.

For each instrument in INSTRUMENTS this writes data/caleg/<id>.json in the
same shape as data/hkel/<cap>.json (Parts, sections and schedules with
number, heading, status and plain text), so scripts/build_statute_extracts.py
can resolve citations against either jurisdiction.

Runs on GitHub Actions (.github/workflows/refresh-caleg.yml). Also usable
locally:
    pip install --require-hashes -r scripts/requirements-hkel.txt
    python scripts/extract_justice.py            # download and extract all
    python scripts/extract_justice.py --xml DIR  # use XML files already in DIR
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
import urllib.request
from typing import TYPE_CHECKING

# defusedxml rejects entity declarations and external references, so a
# tampered file cannot expand into an XML bomb or read local files.
from defusedxml import ElementTree as SafeET

if TYPE_CHECKING:  # type hints only; parsing goes through SafeET
    import xml.etree.ElementTree as ET  # nosemgrep  (never runs)

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "caleg"
RAW = "https://raw.githubusercontent.com/justicecanada/laws-lois-xml/main/eng/{kind}/{id}.xml"
OFFICIAL = "https://laws-lois.justice.gc.ca/eng/{kind}/{id}/"

# (id as Justice Laws numbers it, "acts" or "regulations", sections to keep).
# None keeps every section; a list keeps only those sections (very large Acts
# of which the Canadian banking module cites a few provisions).
INSTRUMENTS: list[tuple[str, str, list[str] | None]] = [
    ("B-1.01", "acts", None),          # Bank Act
    ("C-3", "acts", None),             # Canada Deposit Insurance Corporation Act
    ("F-11.1", "acts", None),          # Financial Consumer Agency of Canada Act
    ("O-2.7", "acts", None),           # Office of the Superintendent of Financial Institutions Act
    ("P-8.6", "acts", None),           # Personal Information Protection and Electronic Documents Act
    ("P-24.501", "acts", None),        # Proceeds of Crime (Money Laundering) and Terrorist Financing Act
    ("R-7.36", "acts", None),          # Retail Payment Activities Act
    ("E-1.6", "acts", None),           # Canada's anti-spam legislation (CASL)
    ("C-34", "acts", ["45", "74.01", "74.06", "90.1"]),   # Competition Act
    ("C-46", "acts", ["206", "347", "426", "462.31"]),    # Criminal Code
    ("C-42", "acts", ["13", "14.1"]),                     # Copyright Act
    ("B-3", "acts", ["65.1", "65.11", "72.1", "246.1"]),  # Bankruptcy and Insolvency Act
    ("C-36", "acts", ["32", "34", "36"]),                 # Companies' Creditors Arrangement Act
    ("I-3.3", "acts", ["212", "215"]),                    # Income Tax Act
    ("E-15", "acts", ["218"]),                            # Excise Tax Act
    ("L-2", "acts", ["44", "189", "212"]),                # Canada Labour Code
    ("A-0.6", "acts", ["5", "7", "69"]),                  # Accessible Canada Act
    ("F-10.6", "acts", ["2", "9", "11"]),                 # Fighting Against Forced Labour and Child Labour in Supply Chains Act
    ("SOR-2021-181", "regulations", None),  # Financial Consumer Protection Framework Regulations
    ("SOR-92-330", "regulations", None),    # Insurance Business (Banks and Bank Holding Companies) Regulations
    ("SOR-2002-184", "regulations", None),  # PCMLTF Regulations
    ("SOR-2018-64", "regulations", None),   # Breach of Security Safeguards Regulations
    ("SOR-2001-59", "regulations", None),   # Supervisory Information (Banks) Regulations
    ("SOR-2023-229", "regulations", None),  # Retail Payment Activities Regulations
    ("SOR-96-542", "regulations", None),    # CDIC Deposit Insurance Information By-law
    ("SOR-2010-292", "regulations", None),  # CDIC Data and System Requirements By-law
    ("SOR-2026-133", "regulations", None),  # Real-Time Rail By-law (Payments Canada)
    ("C.R.C.,_c._945", "regulations", ["105"]),  # Income Tax Regulations
]

# Ids that are awkward as file names and citation keys, and the key used instead.
CAP_ALIAS = {"C.R.C.,_c._945": "CRC-945"}

# Acts without an official short title, named as they are commonly cited.
TITLES = {"E-1.6": "Canada's Anti-Spam Legislation (S.C. 2010, c. 23)"}

LIMS = "{http://justice.gc.ca/lims}"
INDENT = {"Subsection": 2, "Paragraph": 4, "Subparagraph": 6, "Clause": 8, "Subclause": 10, "Subsubclause": 12}
SKIP = {"HistoricalNote", "Label", "MarginalNote", "DefinedTermFr", "FootnoteRef", "Footnote"}


def clean(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    # The French equivalent of a defined term is dropped, leaving "()".
    s = re.sub(r"\s*\(\s*\)", "", s)
    return s.replace(" ;", ";").replace(" .", ".").replace(" ,", ",")


def inline(el: "ET.Element") -> str:
    """Text of a Text-like element, without French terms or footnotes."""
    parts: list[str] = []

    def walk(e: "ET.Element") -> None:
        if e.tag in SKIP and e is not el:
            if e.tail:
                parts.append(e.tail)
            return
        if e.text:
            parts.append(e.text)
        for c in e:
            walk(c)
        if e.tail and e is not el:
            parts.append(e.tail)

    walk(el)
    return clean("".join(parts))


def table_text(el: "ET.Element", pad: str) -> list[str]:
    rows = []
    for row in el.iter("row"):
        cells = [clean(" ".join(e.itertext())) for e in row.findall("entry")]
        if any(cells):
            rows.append(pad + " | ".join(cells))
    return rows


def render(el: "ET.Element", depth: int, out: list[str]) -> None:
    """Append the lines of a section's body, indenting each level."""
    for child in el:
        tag = child.tag
        if tag in SKIP or tag in ("Heading",):
            continue
        if tag in INDENT:
            level = max(INDENT[tag], depth + 2)
            pad = " " * level
            note = child.find("MarginalNote")
            if note is not None and tag == "Subsection":
                out.append(pad + inline(note))
            label = child.findtext("Label") or ""
            text_el = child.find("Text")
            head = inline(text_el) if text_el is not None else ""
            out.append(f"{pad}{label} {head}".rstrip() if label else pad + head)
            render_rest(child, level, out)
        elif tag == "Definition":
            pad = " " * (depth + 2)
            text_el = child.find("Text")
            out.append(pad + (inline(text_el) if text_el is not None else ""))
            render_rest(child, depth + 2, out)
        elif tag in ("ContinuedSectionSubsection", "ContinuedParagraph", "ContinuedSubparagraph",
                     "ContinuedClause", "ContinuedDefinition", "ContinuedFormulaParagraph"):
            text_el = child.find("Text")
            if text_el is not None:
                out.append(" " * max(depth, 2) + inline(text_el))
        elif tag in ("FormulaGroup", "Formula", "FormulaDefinition", "FormulaParagraph"):
            out.append(" " * (depth + 2) + clean(" ".join(child.itertext())))
        elif tag == "TableGroup":
            out.extend(table_text(child, " " * (depth + 2)))
        elif tag in ("ReadAsText", "SectionPiece"):
            # Words an Act tells the reader to read into another provision.
            render(child, depth + 2 if tag == "ReadAsText" else depth, out)
        elif tag in ("Provision", "List", "Item"):
            label = child.findtext("Label") or ""
            text_el = child.find("Text")
            head = inline(text_el) if text_el is not None else ""
            if head or label:
                out.append(" " * (depth + 2) + f"{label} {head}".strip())
            render_rest(child, depth + 2, out)


def render_rest(el: "ET.Element", depth: int, out: list[str]) -> None:
    rest = [c for c in el if c.tag not in ("Text", "Label", "MarginalNote")]
    holder = type(el)(el.tag)
    holder.extend(rest)
    render(holder, depth, out)


def section_text(sec: "ET.Element") -> str:
    lines: list[str] = []
    text_el = sec.find("Text")
    if text_el is not None:
        lines.append("  " + inline(text_el))
    render_rest(sec, 0, lines)
    return "\n".join(l for l in lines if l.strip())


def is_repealed(sec: "ET.Element") -> bool:
    text_el = sec.find("Text")
    return text_el is not None and text_el.find("Repealed") is not None and len(list(sec.iter("Subsection"))) == 0


def schedule_items(sch: "ET.Element") -> list[dict]:
    """Numbered items in a schedule, such as the clauses of PIPEDA Schedule 1
    ("4.1.3"), or numbered rows; each with the text that follows it."""
    items: list[dict] = []
    current: dict | None = None
    group = ""
    num_only = re.compile(r"^\d+(?:\.\d+)*$")
    lead = re.compile(r"^(\d+(?:\.\d+)+)\s+(.*)$")
    for e in sch.iter():
        if e.tag == "GroupHeading":
            title = clean(" ".join(e.itertext()))
            m = lead.match(title)
            if m:
                # A clause takes the heading of the principle it falls under.
                group = m.group(2)
                current = {"num": m.group(1), "heading": group, "status": "in-effect", "text": ""}
                items.append(current)
        elif e.tag == "Provision":
            t = e.find("Text")
            if t is None:
                continue
            txt = inline(t)
            if num_only.match(txt):
                current = {"num": txt, "heading": group, "status": "in-effect", "text": ""}
                items.append(current)
            elif current is not None and txt:
                label = e.findtext("Label") or ""
                line = (f"{label} {txt}".strip())
                current["text"] = (current["text"] + "\n  " + line) if current["text"] else "  " + line
    return items


def roman_or_num(label: str) -> str:
    return re.sub(r"(?i)^(?:part|schedule)\s+", "", label).strip()


def extract(kind: str, ident: str, xml: bytes, keep: list[str] | None) -> dict:
    root = SafeET.fromstring(xml)
    ident_el = root.find("Identification")
    title = TITLES.get(ident) or clean(" ".join((ident_el.find("ShortTitle") if ident_el.find("ShortTitle") is not None
                                                  else ident_el.find("LongTitle")).itertext()))
    long_title = clean(" ".join(ident_el.find("LongTitle").itertext())) if ident_el.find("LongTitle") is not None else title
    version = root.get(f"{LIMS}current-date") or root.get(f"{LIMS}pit-date") or ""
    instrument = ident_el.findtext("InstrumentNumber") or ""
    official = OFFICIAL.format(kind=kind, id=ident)

    parts: list[dict] = []
    sections: list[dict] = []
    current_part: dict | None = None
    last_heading = ""
    body = root.find("Body")
    for el in body:
        if el.tag == "Heading":
            label = el.findtext("Label") or ""
            heading = clean(" ".join(el.find("TitleText").itertext())) if el.find("TitleText") is not None else ""
            if el.get("level") == "1" and label.upper().startswith("PART"):
                current_part = {
                    "id": f"P{roman_or_num(label)}",
                    "num": f"Part {roman_or_num(label)}",
                    "heading": heading,
                    "status": "in-effect",
                    "sections": [],
                }
                parts.append(current_part)
            elif el.get("level") == "1" and not label:
                # An unnumbered top-level heading (e.g. "Short Title") ends the Part.
                current_part = None
            last_heading = heading or last_heading
        elif el.tag == "Section":
            num = el.findtext("Label") or ""
            if not num:
                continue
            note = el.find("MarginalNote")
            if note is None:
                sub = el.find("Subsection")
                note = sub.find("MarginalNote") if sub is not None else None
            heading = inline(note) if note is not None else last_heading
            repealed = is_repealed(el)
            entry = {
                "id": f"s{num}",
                "num": num,
                "heading": heading,
                "status": "repealed" if repealed else "in-effect",
                "part": current_part["id"] if current_part else None,
            }
            if not repealed:
                entry["text"] = section_text(el)
            if keep is not None and num not in keep:
                continue
            sections.append(entry)
            if current_part:
                current_part["sections"].append(entry["id"])

    schedules = []
    # A filtered Act keeps only the cited sections, not its forms and schedules.
    for sch in (root.iter("Schedule") if keep is None else []):
        head = sch.find("ScheduleFormHeading")
        label = head.findtext("Label") if head is not None else ""
        if not label:
            continue
        num = roman_or_num(label)
        heading = clean(" ".join(head.find("TitleText").itertext())) if head is not None and head.find("TitleText") is not None else ""
        items = schedule_items(sch)
        entry = {"id": f"sch{num}", "num": f"Schedule {num}", "heading": heading, "status": "in-effect"}
        if items:
            entry["items"] = items
        else:
            lines: list[str] = []
            render(sch, 0, lines)
            if lines:
                entry["text"] = "\n".join(lines)
        schedules.append(entry)

    if keep is not None:
        parts = [p for p in parts if p["sections"]]
        missing = sorted(set(keep) - {s["num"] for s in sections})
        if missing:
            print(f"  ! {ident}: kept sections not found: {', '.join(missing)}", file=sys.stderr)

    return {
        "cap": CAP_ALIAS.get(ident, ident),
        "title": title,
        "longTitle": long_title,
        "instrument": instrument,
        "versionDate": version,
        "hkelUrl": official,
        "sectionUrl": official + "section-{n}.html",
        "source": "Justice Laws Website (Department of Justice Canada)",
        "indexOnly": False,
        "parts": parts,
        "sections": sections,
        "schedules": schedules,
    }


def fetch(kind: str, ident: str) -> bytes:
    url = RAW.format(kind=kind, id=ident)
    req = urllib.request.Request(url, headers={"User-Agent": "learning-site-extractor"})
    with urllib.request.urlopen(req, timeout=120) as resp:  # noqa: S310 (fixed https host)
        return resp.read()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xml", help="directory holding <id>.xml files already downloaded")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    failures = 0
    for ident, kind, keep in INSTRUMENTS:
        try:
            xml = (pathlib.Path(args.xml) / f"{ident}.xml").read_bytes() if args.xml else fetch(kind, ident)
            doc = extract(kind, ident, xml, keep)
        except Exception as e:  # keep going; report at the end
            print(f"  ! {ident}: {e}", file=sys.stderr)
            failures += 1
            continue
        path = OUT / f"{CAP_ALIAS.get(ident, ident)}.json"
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        live = sum(1 for s in doc["sections"] if s["status"] == "in-effect")
        print(f"{ident}: {doc['title']} | current to {doc['versionDate']} | {live} sections, "
              f"{len(doc['parts'])} parts, {len(doc['schedules'])} schedules")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
