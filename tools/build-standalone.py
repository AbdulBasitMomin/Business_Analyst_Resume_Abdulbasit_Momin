#!/usr/bin/env python3
"""Bundle the site into one self-contained HTML file.

Produces `dist/resume-standalone.html`: no server, no network, no relative
requests. Open it straight off the filesystem or hand the file to someone.

How it works
------------
`index.html` loads ES modules, which browsers refuse to fetch over file://.
So the modules are flattened into a single inline `<script type="module">`
(inline module scripts share one scope, so the cross-module imports between
them just fall away), and three.js is supplied as a base64 `data:` URL mapped
to the bare specifier `three` via an importmap. three.js r169 ships as one
self-contained bundle with no internal imports, which is what makes the
data: URL viable -- a module loaded from a data: URL cannot resolve relative
imports of its own.
"""

import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'resume-standalone.html'

# Order matters: definitions must precede use within the single module scope.
MODULES = ['data.js', 'ui.js', 'scene.js', 'orb.js', 'main.js']


def flatten(name: str) -> str:
    src = (ROOT / 'assets' / 'js' / name).read_text()

    # Drop cross-module imports -- everything lands in one shared scope. The
    # bare `three` import is re-added once at the top of the bundle.
    src = re.sub(r"^import\s+.*?from\s+['\"][^'\"]+['\"];\s*$", '', src, flags=re.M | re.S)

    # `export const X` / `export function X` -> plain declarations.
    src = re.sub(r'^export\s+(?=(const|let|var|function|class)\b)', '', src, flags=re.M)

    if name == 'main.js':
        # The dynamic import of scene/orb is pointless once flattened: both
        # factories are already in scope.
        src = re.sub(
            r'const \[\{ createScene \}, \{ createOrb \}\] = await Promise\.all\(\[\s*'
            r"import\('\./scene\.js'\),\s*import\('\./orb\.js'\),\s*\]\);",
            '// (scene.js and orb.js are inlined above)',
            src,
        )
        if 'inlined above' not in src:
            sys.exit('main.js: dynamic import block did not match -- update the bundler')

    return f'/* ===== {name} ===== */\n{src.strip()}\n'


def main() -> None:
    html = (ROOT / 'index.html').read_text()
    css = (ROOT / 'assets' / 'css' / 'style.css').read_text()
    three = (ROOT / 'assets' / 'vendor' / 'three' / 'three.module.min.js').read_bytes()
    favicon = (ROOT / 'assets' / 'favicon.svg').read_bytes()
    pdf_path = ROOT / 'assets' / 'Abdulbasit-Momin-Business-Analyst.pdf'

    three_url = 'data:text/javascript;base64,' + base64.b64encode(three).decode()
    favicon_url = 'data:image/svg+xml;base64,' + base64.b64encode(favicon).decode()

    bundle = "import * as THREE from 'three';\n\n" + '\n'.join(flatten(m) for m in MODULES)

    # The resume PDF is a relative fetch too, so inline it or the download
    # button dead-ends in the standalone file.
    if pdf_path.exists():
        pdf_url = ('data:application/pdf;base64,'
                   + base64.b64encode(pdf_path.read_bytes()).decode())
        marker = f"'./assets/{pdf_path.name}'"
        if marker not in bundle:
            sys.exit(f'data.js: resumePdf path {marker} not found -- update the bundler')
        bundle = bundle.replace(marker, f"'{pdf_url}'")

    subs = [
        ('<link rel="stylesheet" href="./assets/css/style.css" />', f'<style>\n{css}\n</style>'),
        ('<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg" />',
         f'<link rel="icon" type="image/svg+xml" href="{favicon_url}" />'),
        ('{ "imports": { "three": "./assets/vendor/three/three.module.min.js" } }',
         '{ "imports": { "three": "%s" } }' % three_url),
        ('<script type="module" src="./assets/js/main.js"></script>',
         f'<script type="module">\n{bundle}\n</script>'),
    ]
    for old, new in subs:
        if old not in html:
            sys.exit(f'index.html: expected snippet not found -- {old[:60]!r}')
        html = html.replace(old, new)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html)
    print(f'wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
