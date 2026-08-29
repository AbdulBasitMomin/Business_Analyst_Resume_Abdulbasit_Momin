"""Turn a Google Fonts stylesheet into self-hosted files. See fetch-fonts.sh."""
import re, pathlib, subprocess, sys

css = pathlib.Path('/tmp/gf.css').read_text()
out = pathlib.Path('assets/fonts'); out.mkdir(parents=True, exist_ok=True)

blocks = re.findall(r'(/\* ([a-z-]+) \*/\s*@font-face \{.*?\})', css, re.S)
keep, seen = [], {}
for block, subset in blocks:
    if subset not in ('latin', 'latin-ext'):
        continue
    fam = re.search(r"font-family: '([^']+)'", block).group(1)
    wt = re.search(r'font-weight: (\d+)', block).group(1)
    url = re.search(r'url\((https://[^)]+)\)', block).group(1)
    name = f"{fam.lower().replace(' ', '-')}-{wt}-{subset}.woff2"
    seen[name] = url
    keep.append(block.replace(url, f'../fonts/{name}'))

if not keep:
    sys.exit('no latin @font-face blocks found -- did the request send a modern UA?')

for name, url in seen.items():
    if subprocess.run(['curl', '-sS', '-A', 'Mozilla/5.0', url, '-o', str(out / name)]).returncode:
        sys.exit(f'download failed: {name}')

pathlib.Path('assets/css/fonts.css').write_text(
    "/*\n"
    " * Self-hosted Kanit and JetBrains Mono, latin and latin-ext only.\n"
    " *\n"
    " * Not a CDN link, for three reasons. The single-file standalone build is\n"
    " * meant to open with no network at all and was silently falling back to a\n"
    " * system face. A third-party request on every load is a dependency and a\n"
    " * privacy leak the page does not need. And the layout here is tuned to\n"
    " * these metrics, so the font that renders should be the font that was\n"
    " * measured.\n"
    " *\n"
    " * Regenerate with tools/fetch-fonts.sh.\n"
    " */\n\n" + '\n\n'.join(keep) + '\n')
print(f'{len(seen)} files, {sum(f.stat().st_size for f in out.iterdir())/1024:.0f} KB')
