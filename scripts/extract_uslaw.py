#!/usr/bin/env python3
"""Extract selected sections of the United States Code and the eCFR.

Sources:
- The United States Code in USLM XML, published by the Office of the Law
  Revision Counsel of the House of Representatives (uscode.house.gov), at the
  current release point.
- The Electronic Code of Federal Regulations (ecfr.gov), through its public
  versioner API, at the latest date the title is up to date as of.

Works of the United States Government are not subject to copyright
(17 U.S.C. 105). The extracts are not the official text: the site says so
wherever it shows them and links to uscode.house.gov or ecfr.gov.

For each title in USC and CFR this writes data/usleg/<id>.json (for example
"17-USC.json", "15-CFR.json") in the same shape as data/caleg/<id>.json
(Parts, sections with number, heading, status and plain text), so
scripts/build_statute_extracts.py can resolve citations such as
{"cap": "17-USC", "section": "106"} or {"cap": "15-CFR", "section": "734.7"}.
Sections whose heading is "Definitions" also carry each definition
separately, so {"cap": "17-USC", "section": "101 \\"computer program\\""}
resolves to one definition.

Runs on GitHub Actions (.github/workflows/refresh-usleg.yml): the House and
eCFR hosts are not reachable from every network. Also usable locally:
    pip install --require-hashes -r scripts/requirements-hkel.txt
    python scripts/extract_uslaw.py
    python scripts/extract_uslaw.py --xml DIR   # usc17.xml etc. already in DIR
"""

from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import pathlib
import re
import sys
import urllib.request
import zipfile
from typing import TYPE_CHECKING

# defusedxml rejects entity declarations and external references, so a
# tampered file cannot expand into an XML bomb or read local files.
from defusedxml import ElementTree as SafeET

if TYPE_CHECKING:  # type hints only; parsing goes through SafeET
    import xml.etree.ElementTree as ET  # nosemgrep  (never runs)

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "usleg"
UA = {"User-Agent": "learning-site-statute-extractor/1.0 (+https://github.com)"}

DOWNLOAD_PAGE = "https://uscode.house.gov/download/download.shtml"
USC_SECTION_URL = "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title{t}-section{n}&num=0&edition=prelim"
USC_TITLE_URL = "https://uscode.house.gov/browse/prelim@title{t}&edition=prelim"

# Title number -> sections kept. Only the provisions the software IP volume
# cites, to keep the repository small.
USC: dict[int, list[str]] = {
    15: ["1052", "1064", "1114", "1115", "1116", "1117", "1125", "1127", "7001", "7006"],
    17: ["101", "102", "103", "105", "106", "107", "109", "117", "201", "202", "203", "204", "205",
         "302", "401", "408", "410", "411", "412", "501", "502", "503", "504", "505", "506", "507",
         "512", "1201", "1202", "1203", "1204"],
    18: ["1030", "1831", "1832", "1833", "1835", "1836", "1837", "1838", "1839"],
    19: ["1337"],
    28: ["1295", "1338", "1400", "1498"],
    35: ["100", "101", "102", "103", "112", "115", "116", "118", "154", "256", "261", "262", "271",
         "273", "281", "283", "284", "285", "286", "287", "311", "315", "321"],
}
USC_NAMES = {
    15: "Commerce and Trade (Lanham Act; E-SIGN Act)",
    17: "Copyrights",
    18: "Crimes and Criminal Procedure",
    19: "Customs Duties",
    28: "Judiciary and Judicial Procedure",
    35: "Patents",
}

ECFR_TITLES = "https://www.ecfr.gov/api/versioner/v1/titles.json"
ECFR_SECTION = "https://www.ecfr.gov/api/versioner/v1/full/{date}/title-{t}.xml?part={part}&section={sec}"
ECFR_SECTION_URL = "https://www.ecfr.gov/current/title-{t}/section-{n}"
ECFR_TITLE_URL = "https://www.ecfr.gov/current/title-{t}"

# Title number -> sections kept.
CFR: dict[int, list[str]] = {
    15: ["734.3", "734.7", "734.8", "734.17", "742.15"],   # Export Administration Regulations
    37: ["202.1"],                                         # Copyright Office: material not subject to copyright
}
CFR_NAMES = {
    15: "Commerce and Foreign Trade (Export Administration Regulations)",
    37: "Patents, Trademarks, and Copyrights",
}

NS = "{http://xml.house.gov/schemas/uslm/1.0}"
LEVELS = {"subsection": 1, "paragraph": 2, "subparagraph": 3, "clause": 4, "subclause": 5,
          "item": 6, "subitem": 7, "subsubitem": 8}
TEXTUAL = {"chapeau", "content", "continuation", "text", "p"}
DROP = {"notes", "note", "sourceCredit", "toc", "footnote", "ref-footnote", "editorialNote", "layout"}


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def clean(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace(" ;", ";").replace(" ,", ",").replace(" .", ".")


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r:  # noqa: S310 (fixed https hosts)
        return r.read()


# ---------------------------------------------------------------- U.S. Code

def inline(el: "ET.Element") -> str:
    """Text of an element and its inline children, without notes or footnotes."""
    parts: list[str] = []

    def walk(e: "ET.Element") -> None:
        if local(e.tag) in DROP:
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


def render(nodes: list["ET.Element"], depth: int, out: list[str]) -> None:
    """Lines of a section or level: textual blocks and lower levels, indented by depth."""
    pad = "  " * depth
    for child in nodes:
        tag = local(child.tag)
        if tag in DROP or tag in ("num", "heading"):
            continue
        if tag in LEVELS:
            num = child.find(NS + "num")
            head = child.find(NS + "heading")
            label = clean(" ".join(x for x in (inline(num) if num is not None else "",
                                                inline(head) if head is not None else "") if x))
            kids = list(child)
            # The first textual block runs on from the number, as printed.
            first = next((c for c in kids if local(c.tag) in ("chapeau", "content")), None)
            lead = ""
            if first is not None and not any(local(g.tag) == "p" for g in first):
                lead = inline(first)
                kids = [c for c in kids if c is not first]
            line = clean(f"{label} {lead}")
            if line:
                out.append("  " * LEVELS[tag] + line)
            render(kids, LEVELS[tag], out)
            continue
        if tag in ("content", "chapeau", "continuation", "text") and any(local(g.tag) == "p" for g in child):
            render(list(child), depth, out)
            continue
        if tag in TEXTUAL or tag in ("quotedContent", "table"):
            text = inline(child)
            if text:
                out.append(pad + text)
            continue
        # Unknown wrappers (e.g. <level> inside a section): look inside.
        render(list(child), depth, out)


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


def status_of(sec: "ET.Element") -> str:
    st = (sec.get("status") or "").lower()
    head = sec.find(NS + "heading")
    heading = inline(head) if head is not None else ""
    if st in ("repealed", "omitted", "transferred", "renumbered", "vacant") or heading.lower().startswith(("repealed", "omitted", "transferred")):
        return "repealed"
    return "in-effect"


def release_point(page: str, title: int) -> tuple[str, str]:
    """URL of the title's XML zip at the current release point, and the release point."""
    m = re.search(rf'href="([^"]*xml_usc{title:02d}@([^"]+?)\.zip)"', page)
    if not m:
        raise RuntimeError(f"no link for title {title} on the download page")
    href = m.group(1)
    url = href if href.startswith("http") else f"https://uscode.house.gov/download/{href.lstrip('/')}"
    return url, m.group(2)


def usc_title(title: int, xml: bytes, rp: str, stamp: str) -> dict:
    root = SafeET.fromstring(xml)
    keep = USC[title]
    parts: list[dict] = []
    sections: list[dict] = []
    for chapter in root.iter(NS + "chapter"):
        cnum = chapter.find(NS + "num")
        chead = chapter.find(NS + "heading")
        cid = f"P{(cnum.get('value') if cnum is not None else '') or len(parts) + 1}"
        mine: list[str] = []
        for sec in chapter.iter(NS + "section"):
            num_el = sec.find(NS + "num")
            num = (num_el.get("value") if num_el is not None else "") or ""
            if num not in keep or any(s["num"] == num for s in sections):
                continue
            head = sec.find(NS + "heading")
            lines: list[str] = []
            render(list(sec), 0, lines)
            entry = {"id": f"s{num}", "num": num, "heading": inline(head) if head is not None else "",
                     "status": status_of(sec), "part": cid, "text": "\n".join(lines)}
            if entry["heading"].lower().rstrip(".") == "definitions":
                entry["defs"] = definitions(lines)
            sections.append(entry)
            mine.append(entry["id"])
        if mine:
            parts.append({"id": cid, "num": f"Chapter {cnum.get('value') if cnum is not None else ''}".strip(),
                          "heading": clean(inline(chead) if chead is not None else "").capitalize(),
                          "status": "in-effect", "sections": mine})
    found = {s["num"] for s in sections}
    missing = [n for n in keep if n not in found]
    if missing:
        raise RuntimeError(f"title {title}: sections not found: {', '.join(missing)}")
    order = {n: i for i, n in enumerate(keep)}
    sections.sort(key=lambda s: order[s["num"]])
    return {
        "cap": f"{title}-USC",
        "title": f"{title} U.S.C. ({USC_NAMES[title]})",
        "longTitle": f"United States Code, Title {title}: {USC_NAMES[title]}",
        "instrument": "",
        "versionDate": stamp,
        "releasePoint": rp,
        "hkelUrl": USC_TITLE_URL.format(t=title),
        "sectionUrl": USC_SECTION_URL.format(t=title, n="{n}"),
        "sectionLabel": "§ {n}",
        "source": f"United States Code, Office of the Law Revision Counsel (release point {rp})",
        "indexOnly": False,
        "parts": parts,
        "sections": sections,
        "schedules": [],
    }


def run_usc(xml_dir: str | None) -> int:
    failures = 0
    page = "" if xml_dir else get(DOWNLOAD_PAGE).decode("utf-8", "replace")
    for title in sorted(USC):
        try:
            if xml_dir:
                xml = (pathlib.Path(xml_dir) / f"usc{title:02d}.xml").read_bytes()
                rp, stamp = "local", dt.date.today().isoformat()
            else:
                url, rp = release_point(page, title)
                z = zipfile.ZipFile(io.BytesIO(get(url)))
                name = next(n for n in z.namelist() if n.endswith(".xml"))
                xml = z.read(name)
                stamp = dt.date(*z.getinfo(name).date_time[:3]).isoformat()
            doc = usc_title(title, xml, rp, stamp)
        except Exception as e:  # keep going; report at the end
            print(f"  ! {title} U.S.C.: {e}", file=sys.stderr)
            if not xml_dir and title == min(USC):
                snippet = re.findall(r'href="[^"]*xml_usc[^"]*"', page)[:5]
                print(f"    download page links seen: {snippet}", file=sys.stderr)
            failures += 1
            continue
        write(doc)
    return failures


# ------------------------------------------------------------------- eCFR

def ecfr_lines(div: "ET.Element") -> list[str]:
    out: list[str] = []
    for el in div:
        tag = el.tag
        if tag in ("HEAD", "CITA", "AUTH", "SOURCE", "SECAUTH"):
            continue
        if tag in ("P", "FP", "NOTE", "EXTRACT", "HD1", "HD2", "HD3"):
            if tag in ("NOTE", "EXTRACT"):
                for p in el.iter():
                    if p.tag in ("P", "FP", "HED"):
                        t = clean("".join(p.itertext()))
                        if t:
                            out.append(t)
                continue
            t = clean("".join(el.itertext()))
            if t:
                out.append(t)
    return out


def run_cfr() -> int:
    failures = 0
    titles = json.loads(get(ECFR_TITLES))["titles"]
    for t in sorted(CFR):
        meta = next(x for x in titles if x["number"] == t)
        date = meta.get("up_to_date_as_of") or meta.get("latest_issue_date")
        sections: list[dict] = []
        parts: dict[str, dict] = {}
        try:
            for num in CFR[t]:
                part = num.split(".")[0]
                xml = get(ECFR_SECTION.format(date=date, t=t, part=part, sec=num))
                root = SafeET.fromstring(xml)
                div = next((d for d in root.iter("DIV8")
                            if (d.get("N") or "").replace("§", "").strip() == num), None)
                if div is None:
                    raise RuntimeError(f"section {num} not in the eCFR response")
                head = div.find("HEAD")
                heading = clean("".join(head.itertext())) if head is not None else ""
                heading = re.sub(rf"^§\s*{re.escape(num)}\s*", "", heading).rstrip(".")
                pid = f"P{part}"
                if pid not in parts:
                    phead = next((clean("".join(d.find("HEAD").itertext())) for d in root.iter("DIV5")
                                  if d.find("HEAD") is not None), "")
                    parts[pid] = {"id": pid, "num": f"Part {part}",
                                  "heading": re.sub(rf"^PART\s*{part}\s*[—-]*\s*", "", phead, flags=re.I).capitalize(),
                                  "status": "in-effect", "sections": []}
                parts[pid]["sections"].append(f"s{num}")
                sections.append({"id": f"s{num}", "num": num, "heading": heading, "status": "in-effect",
                                 "part": pid, "text": "\n".join(ecfr_lines(div))})
        except Exception as e:
            print(f"  ! {t} CFR: {e}", file=sys.stderr)
            failures += 1
            continue
        write({
            "cap": f"{t}-CFR",
            "title": f"{t} C.F.R. ({CFR_NAMES[t]})",
            "longTitle": f"Code of Federal Regulations, Title {t}: {CFR_NAMES[t]}",
            "instrument": "",
            "versionDate": date,
            "hkelUrl": ECFR_TITLE_URL.format(t=t),
            "sectionUrl": ECFR_SECTION_URL.format(t=t, n="{n}"),
            "sectionLabel": "§ {n}",
            "source": "Electronic Code of Federal Regulations (eCFR), Office of the Federal Register",
            "indexOnly": False,
            "parts": list(parts.values()),
            "sections": sections,
            "schedules": [],
        })
    return failures


def write(doc: dict) -> None:
    path = OUT / f"{doc['cap']}.json"
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    first = doc["sections"][0]
    print(f"{doc['cap']}: {doc['title']} | {doc['versionDate']} | {len(doc['sections'])} sections")
    print(f"    {first['num']} {first['heading']}: {first['text'][:240]!r}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xml", help="directory holding usc<NN>.xml files already downloaded (skips the eCFR)")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    failures = run_usc(args.xml)
    if not args.xml:
        failures += run_cfr()
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
