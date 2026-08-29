"""Turn a Google Fonts stylesheet into self-hosted files. See fetch-fonts.sh."""
import re, pathlib, subprocess, sys
from collections import defaultdict

css = pathlib.Path('/tmp/gf.css').read_text()
out = pathlib.Path('assets/fonts'); out.mkdir(parents=True, exist_ok=True)

blocks = re.findall(r'(/\* ([a-z-]+) \*/\s*@font-face \{.*?\})', css, re.S)
parsed = []
for block, subset in blocks:
    if subset not in ('latin', 'latin-ext'):
        continue
    parsed.append({
        'block': block,
        'subset': subset,
        'family': re.search(r"font-family: '([^']+)'", block).group(1),
        'weight': re.search(r'font-weight: ([\d ]+)', block).group(1).strip(),
        'url': re.search(r'url\((https://[^)]+)\)', block).group(1),
    })

if not parsed:
    sys.exit('no latin @font-face blocks found -- did the request send a modern UA?')

# Google serves one variable file per requested weight, so asking for seven
# weights of Inter returns the same bytes seven times. Grouping by URL first
# means each distinct file is downloaded and shipped once, whatever the
# stylesheet asked for -- 1018 KB of fonts became 438 KB.
by_url = defaultdict(list)
for p in parsed:
    by_url[p['url']].append(p)

files, out_blocks = {}, []
for url, group in by_url.items():
    fam = group[0]['family'].lower().replace(' ', '-')
    subset = group[0]['subset']
    shared = len(group) > 1
    name = f"{fam}-{subset}.woff2" if shared else f"{fam}-{group[0]['weight']}-{subset}.woff2"
    files[name] = url
    if shared:
        # One face spanning the range, rather than N faces pointing at one file.
        lo, hi = min(int(g['weight']) for g in group), max(int(g['weight']) for g in group)
        block = re.sub(r'font-weight: [\d ]+;', f'font-weight: {lo} {hi};', group[0]['block'])
        out_blocks.append(block.replace(url, f'../fonts/{name}'))
    else:
        out_blocks.append(group[0]['block'].replace(url, f'../fonts/{name}'))

for name, url in files.items():
    if subprocess.run(['curl', '-sS', '-A', 'Mozilla/5.0', url, '-o', str(out / name)]).returncode:
        sys.exit(f'download failed: {name}')

pathlib.Path('assets/css/fonts.css').write_text(
    "/*\n"
    " * Self-hosted Inter, Silkscreen and JetBrains Mono, latin and latin-ext\n"
    " * only.\n"
    " *\n"
    " * Not a CDN link, for three reasons. The single-file standalone build is\n"
    " * meant to open with no network at all and was silently falling back to a\n"
    " * system face. A third-party request on every load is a dependency and a\n"
    " * privacy leak the page does not need. And the layout here is tuned to\n"
    " * these metrics, so the font that renders should be the font that was\n"
    " * measured.\n"
    " *\n"
    " * Silkscreen is the display face. The landing page it matches uses basis33,\n"
    " * which is only available from a font aggregator this cannot reach and\n"
    " * whose licence for commercial use is unclear. Silkscreen is the closest\n"
    " * self-hostable equivalent and is OFL.\n"
    " *\n"
    " * Regenerate with tools/fetch-fonts.sh.\n"
    " */\n\n" + '\n\n'.join(out_blocks) + '\n')
print(f'{len(files)} files, {sum(f.stat().st_size for f in out.iterdir())/1024:.0f} KB')
