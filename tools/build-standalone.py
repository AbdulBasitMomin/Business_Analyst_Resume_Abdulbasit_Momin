#!/usr/bin/env python3
"""Bundle the site into one self-contained HTML file.

Produces `dist/resume-standalone.html`: no server, no network, no relative
requests, no ES modules and no `data:` scripts.

Why not modules + a data: URL
-----------------------------
The obvious build (an importmap mapping `three` to a base64 `data:` URL) is
refused by any Content-Security-Policy that omits `data:` from script-src.
In-app preview panels, email clients and corporate proxies all apply such a
policy, and the failure is total: the module never runs, nothing renders, and
the page sits on its spinner forever.

Why not plain concatenation either
----------------------------------
Flattening every module into one shared scope collides identifiers -- minified
three.js declares `el`, and so does ui.js. So each module is wrapped in its own
IIFE that returns its exports, and imports are rebound from the enclosing
module objects. That reproduces real module scoping in a classic script.

three.js r169 survives the conversion because it has no import.meta, no
top-level await and no dynamic import -- only one trailing `export{...}`,
rewritten into the IIFE's return value.
"""

import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'resume-standalone.html'

# Base document to inline into. Defaults to the source index.html; pass a
# prerendered copy to get static content baked in as well.
BASE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'index.html'

# Order matters: a module's dependencies must be defined before it.
MODULES = [
    'data.js', 'journey.js', 'evidence.js', 'assistant.js', 'graphics.js',
    'trace.js', 'tracegraph.js', 'traceui.js', 'ui.js', 'interactive.js',
    'artifacts.js', 'cards3d.js', 'backdrop.js', 'main.js',
]

IMPORT_RE = re.compile(
    r"^import\s+(?:\*\s+as\s+(?P<ns>\w+)|\{(?P<named>[^}]*)\})\s+from\s+"
    r"['\"](?P<src>[^'\"]+)['\"];\s*$",
    re.M,
)
EXPORT_DECL_RE = re.compile(r'^export\s+(?:async\s+)?(?:const|let|var|function|class)\s+(\w+)', re.M)

THREE_NS = '__three'


def module_var(source: str) -> str:
    """`./data.js` or `three` -> the variable holding that module's exports."""
    if source == 'three':
        return THREE_NS
    return '__mod_' + re.sub(r'\W', '_', source.rsplit('/', 1)[-1].removesuffix('.js'))


def three_iife() -> str:
    src = (ROOT / 'assets' / 'vendor' / 'three' / 'three.module.min.js').read_text()

    for banned in ('import.meta', 'import('):
        if banned in src:
            sys.exit(f'three.js contains {banned!r} -- no longer usable as a classic script')

    match = re.search(r'export\s*\{(.*?)\}\s*;?\s*$', src, flags=re.S)
    if not match:
        sys.exit('three.js: trailing export statement not found -- update the bundler')

    pairs = []
    for entry in (e.strip() for e in match.group(1).split(',')):
        if not entry:
            continue
        parts = entry.split(' as ')  # `local as Exported`, or a bare `Name`
        local = parts[0].strip()
        pairs.append(f'{parts[1].strip() if len(parts) == 2 else local}:{local}')

    return (
        f'/* ===== three.js r169 (MIT) ===== */\n'
        f'var {THREE_NS} = (function () {{\n'
        f'{src[: match.start()]}\n'
        f'return {{{",".join(pairs)}}};\n'
        f'}})();\n'
    )


def inline_fonts() -> str:
    """Fonts as data: URLs inside the stylesheet.

    A relative @font-face src is a fetch, and the standalone file is meant to
    open from a filesystem or an email attachment with no network and no
    sibling files. Left as a link it fell back to a system face, which is the
    one thing this build exists to avoid.

    CSP is not a concern here the way it is for scripts: `data:` in `font-src`
    is not what the restrictive policies block, and a font that fails to load
    degrades to a fallback rather than killing the page.
    """
    css = (ROOT / 'assets' / 'css' / 'fonts.css').read_text()

    def swap(match):
        rel = match.group(1)
        path = (ROOT / 'assets' / 'css' / rel).resolve()
        if not path.exists():
            sys.exit(f'fonts.css references a missing file: {rel}')
        b64 = base64.b64encode(path.read_bytes()).decode()
        return f"url(data:font/woff2;base64,{b64})"

    out, n = re.subn(r'url\(([^)]+\.woff2)\)', swap, css)
    if not n:
        sys.exit('fonts.css: no woff2 sources found -- update the bundler')
    return out


def module_iife(name: str) -> str:
    src = (ROOT / 'assets' / 'js' / name).read_text()

    # Rebind each import from the enclosing module object, then drop the
    # import statement itself.
    preamble = []
    for m in IMPORT_RE.finditer(src):
        holder = module_var(m.group('src'))
        if m.group('ns'):
            preamble.append(f"var {m.group('ns')} = {holder};")
        else:
            names = ', '.join(n.strip() for n in m.group('named').split(',') if n.strip())
            preamble.append(f'var {{ {names} }} = {holder};')
    src = IMPORT_RE.sub('', src)

    exports = EXPORT_DECL_RE.findall(src)
    src = re.sub(r'^export\s+(?=(?:async\s+)?(?:const|let|var|function|class)\b)', '', src, flags=re.M)

    # Dynamic imports of local modules resolve to the already-built module
    # object. Generic, so adding a module needs no bundler change -- the old
    # per-call-site regex broke every time main.js was edited.
    src = re.sub(
        r"import\(\s*['\"]\./([\w.-]+)\.js['\"]\s*\)",
        lambda m: f"Promise.resolve({module_var('./' + m.group(1) + '.js')})",
        src,
    )

    # A missed form of export or import is a syntax error in the browser, and
    # the page dies whole. Fail here instead, where the message is useful:
    # `export async function` slipped through once and shipped a blank page.
    for line in src.splitlines():
        if re.match(r'\s*(export|import)\b', line):
            sys.exit(f'{name}: unhandled module syntax -- {line.strip()[:70]!r}')

    body = '\n'.join(preamble + ['', src.strip()])
    returns = ', '.join(f'{e}: {e}' for e in exports)
    return (
        f'/* ===== {name} ===== */\n'
        f'var {module_var("./" + name)} = (function () {{\n'
        f'{body}\n'
        f'return {{{returns}}};\n'
        f'}})();\n'
    )


def main() -> None:
    html = BASE.read_text()
    css = (ROOT / 'assets' / 'css' / 'style.css').read_text()
    fonts_css = inline_fonts()
    favicon = (ROOT / 'assets' / 'favicon.svg').read_bytes()
    pdf_path = ROOT / 'assets' / 'Abdulbasit-Momin-Business-Analyst.pdf'

    parts = [three_iife()] + [module_iife(m) for m in MODULES]
    site = '\n'.join(parts)

    # The resume PDF is a relative fetch too, so inline it or the download
    # button dead-ends. An <a href="data:..."> is not covered by script-src.
    if pdf_path.exists():
        marker = f"'./assets/{pdf_path.name}'"
        if marker not in site:
            sys.exit(f'data.js: resumePdf path {marker} not found -- update the bundler')
        pdf_url = 'data:application/pdf;base64,' + base64.b64encode(pdf_path.read_bytes()).decode()
        site = site.replace(marker, f"'{pdf_url}'")

    # Module code is implicitly strict; a classic script is not.
    bundle = "(function () {\n'use strict';\n\n" + site + '\n})();\n'

    # Inline SVG rather than a data: URL -- CSP img-src blocks data: images too.
    favicon_url = 'data:image/svg+xml;base64,' + base64.b64encode(favicon).decode()

    subs = [
        # (label, pattern, replacement, expected count)
        ('fonts', r'<link rel="stylesheet" href="[^"]*fonts\.css"\s*/?>', f'<style>\n{fonts_css}\n</style>', 1),
        ('stylesheet', r'<link rel="stylesheet" href="[^"]*style\.css"\s*/?>', f'<style>\n{css}\n</style>', 1),
        ('favicon', r'<link rel="icon"[^>]*href="[^"]*favicon\.svg"\s*/?>',
         f'<link rel="icon" type="image/svg+xml" href="{favicon_url}">', 1),
        # The importmap only existed to resolve the bare `three` specifier.
        ('importmap', r'<script type="importmap">.*?</script>', '', 1),
        ('entry script', r'<script type="module" src="[^"]*main\.js"></script>',
         '<script>\n' + bundle + '\n</script>', 1),
    ]
    for label, pattern, replacement, expected in subs:
        html, n = re.subn(pattern, lambda _m, r=replacement: r, html, flags=re.S)
        if n != expected:
            sys.exit(f'{BASE.name}: {label} matched {n} times, expected {expected}')

    for banned in ('type="module"', 'importmap', 'data:text/javascript'):
        if banned in html:
            sys.exit(f'standalone build still contains {banned!r}')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html)
    print(f'wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
