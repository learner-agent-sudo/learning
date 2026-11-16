# U.S. legislation extracts

Do not edit by hand. The text of the U.S. Code sections the software IP
volume cites, held in the same shape as `data/caleg` so
`scripts/build_statute_extracts.py` can attach it to citations such as
`{"cap": "17-USC", "section": "106"}` or `{"cap": "17-USC", "section": "101 \"computer program\""}`.

Sources:
- `15-USC`, `17-USC`, `18-USC`, `19-USC`, `28-USC`, `35-USC`: the United States
  Code, 2024 main edition, as published on GovInfo by the U.S. Government
  Publishing Office. Each section was copied twice, independently, from the
  Legal Data Hunter index of that edition and the copies compared before use.
  Sections longer than about 6,000 characters stop at a sentence end and are
  marked as continuing.
- `CA-LAB`, `CA-BPC`, `CA-CIV`: California Labor, Business and Professions, and
  Civil Code sections, from California Legislative Information as indexed in
  April 2026.

The House (uscode.house.gov), GovInfo and eCFR hosts refuse automated
downloads, so there is no refresh job: check a section against the official
text before relying on it, and re-copy it when the law changes.

Works of the United States Government are not subject to copyright
(17 U.S.C. 105). These extracts are **not** the official text. For that, see
uscode.house.gov, govinfo.gov and leginfo.legislature.ca.gov.
