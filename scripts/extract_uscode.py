#!/usr/bin/env python3
"""Extract selected sections of the United States Code from GovInfo.

Source: the annual edition of the United States Code prepared by the Office
of the Law Revision Counsel and published by the U.S. Government Publishing
Office on GovInfo, one HTML file per title
(www.govinfo.gov/content/pkg/USCODE-<year>-title<N>/html/USCODE-<year>-title<N>.htm).
Each section in that file is marked with comments ("documentid", "expcite",
"field-start:statute" ... "field-end:statute"), which this script reads.

Works of the United States Government are not subject to copyright
(17 U.S.C. 105). The extracts are not the official text: the site says so
wherever it shows them and links to the section on uscode.house.gov.

For each title in USC this writes data/usleg/<N>-USC.json in the same shape
as data/caleg/<id>.json (Parts, sections with number, heading, status and
plain text), so scripts/build_statute_extracts.py can resolve citations such
as {"cap": "17-USC", "section": "106"}. Sections headed "Definitions" also
carry each definition separately, so {"cap": "17-USC", "section":
"101 \\"computer program\\""} resolves to one definition.

Runs on GitHub Actions (.github/workflows/refresh-usleg.yml). Also usable on
files already downloaded:
    python scripts/extract_uscode.py --html DIR   # USCODE-<year>-title<N>.htm in DIR
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import pathlib
import re
import sys
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "usleg"
UA = {"User-Agent": "learning-site-statute-extractor/1.0 (+https://github.com)", "Accept": "text/html,*/*"}
TITLE_HTML = "https://www.govinfo.gov/content/pkg/USCODE-{year}-title{t}/html/USCODE-{year}-title{t}.htm"
SECTION_URL = "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title{t}-section{n}&num=0&edition=prelim"
TITLE_URL = "https://www.govinfo.gov/app/collection/uscode/{year}/title{t}"

# Title number -> sections kept: only those the software IP volume cites.
USC: dict[int, list[str]] = {
    15: ["1114", "1125", "1127", "7001"],
    17: ["101", "102", "103", "105", "106", "107", "109", "117", "201", "202", "203", "204", "205",
         "302", "411", "412", "501", "502", "504", "505", "507", "512", "1201", "1202", "1203"],
    18: ["1030", "1832", "1833", "1835", "1836", "1839"],
    19: ["1337"],
    28: ["1295", "1338", "1400", "1498"],
    35: ["100", "101", "102", "103", "112", "115", "116", "154", "256", "261", "262", "271", "273",
         "284", "285", "286", "287", "311", "315", "321"],
}
NAMES = {
    15: "Commerce and Trade",
    17: "Copyrights",
    18: "Crimes and Criminal Procedure",
    19: "Customs Duties",
    28: "Judiciary and Judicial Procedure",
    35: "Patents",
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=300) as r:  # noqa: S310 (fixed https host)
        return r.read()


class Lines(HTMLParser):
    """Text of the block elements in a statute field, one line each, indented by their "-Nem" class."""

    BLOCKS = {"p", "h3", "h4", "h5", "h6", "div", "td"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lines: list[str] = []
        self.buf: list[str] = []
        self.level = 0
        self.depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.BLOCKS:
            self.flush()
            cls = dict(attrs).get("class") or ""
            m = re.search(r"-(\d+)em\b", cls)
            self.level = int(m.group(1)) if m else 0
        elif tag == "br":
            self.flush()

    def handle_endtag(self, tag: str) -> None:
        if tag in self.BLOCKS:
            self.flush()

    def handle_data(self, data: str) -> None:
        self.buf.append(data)

    def flush(self) -> None:
        text = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        if text:
            self.lines.append("  " * self.level + text)
        self.buf = []


def lines_of(fragment: str) -> list[str]:
    p = Lines()
    p.feed(fragment)
    p.close()
    p.flush()
    return p.lines


DEF_START = re.compile(r"^(?:\(\w+\)\s*)?(?:An?|The|Each|As used|For purposes)\b[^“\"]{0,80}[“\"]([^”\"]+)[”\"]")


def definitions(lines: list[str]) -> list[dict]:
    """Split a definitions section into one entry per defined term."""
    defs: list[dict] = []
    for line in lines:
        m = DEF_START.match(line.strip())
        if m and len(line) - len(line.lstrip()) <= 2:
            defs.append({"term": m.group(1).strip().lower(), "lines": [line]})
        elif defs:
            defs[-1]["lines"].append(line)
    return [{"term": d["term"], "text": "\n".join(d["lines"])} for d in defs]


def comment(block: str, name: str) -> str:
    m = re.search(rf"<!--\s*{name}:(.*?)-->", block, re.S)
    return m.group(1).strip() if m else ""


def title_doc(title: int, page: str, edition: str) -> dict:
    keep = USC[title]
    current = re.search(r"currentthrough:(\d{8})", page)
    stamp = (dt.datetime.strptime(current.group(1), "%Y%m%d").date().isoformat()
             if current else f"{edition}-01-01")
    blocks = re.split(r"(?=<!--\s*documentid:)", page)
    parts: dict[str, dict] = {}
    sections: dict[str, dict] = {}
    for block in blocks:
        expcite = comment(block, "expcite")
        item = comment(block, "itempath")
        m = re.search(r"Sec\.\s*([0-9A-Za-z.\-]+)\s*$", item) or re.search(r"!@!Sec\.\s*([0-9A-Za-z.\-]+)\s*$", expcite)
        if not m:
            continue
        num = m.group(1)
        if num not in keep or num in sections:
            continue
        head_m = re.search(r'<h3[^>]*class="section-head"[^>]*>(.*?)</h3>', block, re.S)
        heading = html.unescape(re.sub(r"<[^>]+>", "", head_m.group(1))).strip() if head_m else ""
        heading = re.sub(rf"^§\s*{re.escape(num)}\.\s*", "", heading).strip().rstrip(".")
        body = re.search(r"<!--\s*field-start:statute\s*-->(.*?)<!--\s*field-end:statute\s*-->", block, re.S)
        lines = lines_of(body.group(1)) if body else []
        chapter = next((p for p in expcite.split("!@!") if p.upper().startswith(("CHAPTER", "PART"))), "")
        cm = re.match(r"(?i)(chapter|part)\s+([0-9A-Z]+)\s*[-—]\s*(.*)", chapter)
        pid = f"P{cm.group(2)}" if cm else "P0"
        if pid not in parts:
            parts[pid] = {"id": pid, "num": f"{cm.group(1).capitalize()} {cm.group(2)}" if cm else "",
                          "heading": cm.group(3).strip().capitalize() if cm else "", "status": "in-effect",
                          "sections": []}
        status = "repealed" if not lines or heading.lower().startswith(("repealed", "omitted", "transferred")) else "in-effect"
        entry = {"id": f"s{num}", "num": num, "heading": heading, "status": status, "part": pid,
                 "text": "\n".join(lines)}
        if heading.lower() == "definitions":
            entry["defs"] = definitions(lines)
        sections[num] = entry
        parts[pid]["sections"].append(entry["id"])
    missing = [n for n in keep if n not in sections]
    if missing:
        sample = page[page.find("documentid"):][:2500] if "documentid" in page else page[:2500]
        raise RuntimeError(f"sections not found: {', '.join(missing)}\n--- sample ---\n{sample}")
    return {
        "cap": f"{title}-USC",
        "title": f"{title} U.S.C. ({NAMES[title]})",
        "longTitle": f"United States Code, Title {title}: {NAMES[title]}",
        "instrument": "",
        "versionDate": stamp,
        "edition": f"{edition} edition",
        "hkelUrl": TITLE_URL.format(year=edition, t=title),
        "sectionUrl": SECTION_URL.format(t=title, n="{n}"),
        "sectionLabel": "§ {n}",
        "source": f"United States Code, {edition} edition (Office of the Law Revision Counsel), via GovInfo",
        "sourceShort": "the U.S. Code",
        "indexOnly": False,
        "parts": [p for p in parts.values() if p["sections"]],
        "sections": [sections[n] for n in keep],
        "schedules": [],
    }


def fetch(title: int) -> tuple[str, str]:
    this_year = dt.date.today().year
    for year in range(this_year, this_year - 4, -1):
        url = TITLE_HTML.format(year=year, t=title)
        try:
            page = get(url).decode("utf-8", "replace")
        except Exception as e:
            print(f"  {url}: {e}", file=sys.stderr)
            continue
        if "documentid:" not in page:
            print(f"  {url}: no Code sections in the page", file=sys.stderr)
            continue
        print(f"  {url}: {len(page)} characters", file=sys.stderr)
        return page, str(year)
    raise RuntimeError("no GovInfo edition found")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", help="directory holding USCODE-<year>-title<N>.htm files already downloaded")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    failures = 0
    for title in sorted(USC):
        try:
            if args.html:
                path = sorted(pathlib.Path(args.html).glob(f"USCODE-*-title{title}.htm"))[-1]
                page, edition = path.read_text(encoding="utf-8", errors="replace"), path.name.split("-")[1]
            else:
                page, edition = fetch(title)
            doc = title_doc(title, page, edition)
        except Exception as e:  # keep going; report at the end
            print(f"  ! {title} U.S.C.: {e}", file=sys.stderr)
            failures += 1
            continue
        (OUT / f"{doc['cap']}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        s = doc["sections"][0]
        print(f"{doc['cap']}: {doc['source']} | current through {doc['versionDate']} | {len(doc['sections'])} sections")
        print(f"    § {s['num']} {s['heading']}: {s['text'][:300]!r}")
        for d in s.get("defs", [])[:3]:
            print(f"      def {d['term']!r}: {d['text'][:120]!r}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
