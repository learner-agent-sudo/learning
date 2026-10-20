#!/usr/bin/env python3
"""One-off probe of Hong Kong e-Legislation open data (DATA.GOV.HK).

Runs on GitHub Actions (the dev sandbox cannot reach HK government hosts).
Prints the structure of the dataset listings to the job log and saves the
raw XML for the banking-related chapters under data/hkel/raw/ so the real
extractor can be written against actual files.

Source: Department of Justice, Hong Kong e-Legislation, via DATA.GOV.HK
(reuse permitted with attribution under the DATA.GOV.HK terms).
"""

from __future__ import annotations

import io
import json
import pathlib
import re
import sys
import urllib.request
import zipfile

UA = {"User-Agent": "learning-site-probe/1.0 (+https://github.com/learner-agent-sudo/learning)"}
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "hkel" / "raw"

# Chapters a virtual bank's counsel needs first.
WANTED = ["155", "155L", "155M", "155Q", "155S", "615", "581", "584", "628", "486", "653", "656"]

CKAN = "https://data.gov.hk/en-data/api/3/action/package_show?id="
DATASETS = ["hk-doj-hkel-legislation-current", "hk-doj-hkel-list-of-legislation-current"]
MANIFEST = "https://resource.data.one.gov.hk/doj/data/hkel_list_c_all_en.json"
PAGES = [
    "https://www.elegislation.gov.hk/hk/cap155!en",
    "https://www.elegislation.gov.hk/hk/cap155!en.xml",
    "https://www.elegislation.gov.hk/hk/cap155!en@2026-01-01",
]


def get(url: str, limit: int | None = None) -> tuple[int, str, bytes]:
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read() if limit is None else resp.read(limit)
            return resp.status, resp.headers.get("Content-Type", ""), data
    except urllib.error.HTTPError as err:
        return err.code, err.headers.get("Content-Type", ""), b""
    except Exception as err:  # noqa: BLE001 - probe: report everything
        print(f"  ! {url}: {type(err).__name__}: {err}")
        return -1, "", b""


def section(title: str) -> None:
    print(f"\n===== {title} =====", flush=True)


def probe_manifest() -> None:
    section("JSON manifest")
    status, ctype, body = get(MANIFEST)
    print(f"status={status} type={ctype} bytes={len(body)}")
    if status != 200:
        return
    data = json.loads(body.decode("utf-8-sig"))
    print("top-level:", type(data).__name__, list(data)[:10] if isinstance(data, dict) else len(data))
    items = data if isinstance(data, list) else next((v for v in data.values() if isinstance(v, list)), [])
    print("first items:", json.dumps(items[:2], ensure_ascii=False, indent=1)[:2000])
    hits = [i for i in items if re.search(r'(?<!\d)(155|615)(?![0-9])', json.dumps(i, ensure_ascii=False))]
    print(f"items mentioning 155/615: {len(hits)}")
    print(json.dumps(hits[:6], ensure_ascii=False, indent=1)[:3000])


def range_of(name: str) -> tuple[int, int] | None:
    m = re.search(r'(\d+)\s*[—–-]+\s*(\d+)', name)
    return (int(m.group(1)), int(m.group(2))) if m else None


def probe_ckan() -> list[dict]:
    resources: list[dict] = []
    for ds in DATASETS:
        section(f"CKAN {ds}")
        status, ctype, body = get(CKAN + ds)
        print(f"status={status} type={ctype} bytes={len(body)}")
        if status != 200:
            continue
        pkg = json.loads(body).get("result", {})
        print("title:", pkg.get("title"), "| license:", pkg.get("license_title"), pkg.get("license_url"))
        for r in pkg.get("resources", []):
            print(f"  - {r.get('name')!r} format={r.get('format')} url={r.get('url')}")
            resources.append(r)
    return resources


def wanted_member(path: str) -> str | None:
    base = path.rsplit("/", 1)[-1]
    for cap in WANTED:
        if re.search(rf'(?i)(?:^|[^0-9a-z])(?:cap[_ -]?)?{cap}(?![0-9a-z])', base):
            return cap
    return None


def probe_zips(resources: list[dict]) -> None:
    english = [r for r in resources if "english" in (r.get("name") or "").lower()
               and (r.get("format") or "").upper() in ("ZIP", "XML", "")]
    targets = [r for r in english if (rg := range_of(r.get("name") or "")) and rg[0] <= 155 <= rg[1]]
    targets += [r for r in english if (rg := range_of(r.get("name") or "")) and rg[0] <= 615 <= rg[1] and r not in targets]
    if not targets:
        targets = english[:2]
    OUT.mkdir(parents=True, exist_ok=True)
    listing: list[str] = []
    for r in targets[:3]:
        section(f"ZIP {r.get('name')}")
        status, ctype, body = get(r["url"])
        print(f"status={status} type={ctype} bytes={len(body)}")
        if status != 200 or not body:
            continue
        try:
            zf = zipfile.ZipFile(io.BytesIO(body))
        except zipfile.BadZipFile:
            print("not a zip; head:", body[:500])
            continue
        names = zf.namelist()
        print(f"members={len(names)}; first 40:")
        for n in names[:40]:
            print("   ", n)
        listing += [f"{r.get('name')}\t{n}" for n in names]
        for n in names:
            cap = wanted_member(n)
            if not cap or n.endswith("/"):
                continue
            data = zf.read(n)
            dest = OUT / n.replace("/", "__")
            dest.write_bytes(data)
            print(f"  saved {n} ({len(data)} bytes) as cap {cap}")
    (OUT / "MEMBERS.txt").write_text("\n".join(listing) + "\n", encoding="utf-8")


def probe_pages() -> None:
    section("HKeL pages")
    for url in PAGES:
        status, ctype, body = get(url, limit=4000)
        print(f"{status} {ctype} {url}")
        if status == 200:
            print("   head:", body[:300])


def main() -> int:
    probe_manifest()
    resources = probe_ckan()
    probe_zips(resources)
    probe_pages()
    return 0


if __name__ == "__main__":
    sys.exit(main())
