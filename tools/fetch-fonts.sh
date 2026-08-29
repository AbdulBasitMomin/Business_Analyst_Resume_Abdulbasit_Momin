#!/usr/bin/env bash
# Refresh the self-hosted fonts from Google Fonts.
#
# Only latin and latin-ext are kept: a resume in English never sets the
# cyrillic, greek, vietnamese or thai subsets, and shipping them multiplies the
# byte count for glyphs no reader will see.
#
# A modern User-Agent is required. Without one Google serves TTF rather than
# woff2, which is roughly twice the size.
set -euo pipefail
cd "$(dirname "$0")/.."
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
URL="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
curl -sS -A "$UA" "$URL" -o /tmp/gf.css
python3 tools/fetch-fonts.py
