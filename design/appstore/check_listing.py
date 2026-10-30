"""Counts each field of listing.md against App Store Connect's limits: python3 check_listing.py"""
import re
from pathlib import Path

text = (Path(__file__).parent / "listing.md").read_text()
bad = 0
# A "### Field (limit)" heading followed by its text in a fenced block.
for field, limit, body in re.findall(r"^### (.+?) \((\d+)\)\n+```\n(.*?)\n```", text, re.S | re.M):
    # Keywords count in bytes; everything else in characters.
    n = len(body.encode()) if field in ("Keywords", "Schlüsselwörter") else len(body)
    over = n > int(limit)
    bad += over
    print(f"{'OVER' if over else 'ok':4}  {n:4} / {limit:4}  {field}")
raise SystemExit(bad)
