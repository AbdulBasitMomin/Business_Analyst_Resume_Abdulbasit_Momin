# Interactive 3D Resume — Abdul Basit Momin

A single-page, WebGL-driven resume site for a Business Analyst profile.
No build step, no framework: plain ES modules plus Three.js from a CDN.

## Editing content

**All content lives in one file: [`assets/js/data.js`](assets/js/data.js).**
Nothing is hardcoded in the markup — every section renders from that object, so
adding a role or a skill means editing the array and nothing else.

- `meta` — name, role, tagline, contact links, optional resume PDF path
- `stats` — the animated counters under the hero
- `about` — headline plus body paragraphs
- `experience` — roles, newest first (`end: 'Present'` renders a live badge)
- `skills` — grouped proficiency bars (`level` is 0–100)
- `skillCloud` — the labels that orbit inside the draggable 3D sphere
- `projects`, `education`, `certifications`, `testimonials`

`isPlaceholder` at the top of the file controls the amber "Draft" badge. Set it
to `false` once the real content is in.

Empty arrays hide their section, so unused blocks cost nothing.

## What's 3D here

| Layer | Detail |
| --- | --- |
| Background scene | Depth starfield with a twinkle shader, a noise-displaced icosahedron core, and octahedra orbiting on tilted rings |
| Camera | Dollies forward on scroll progress and parallaxes toward the pointer |
| Skill sphere | Labels on a Fibonacci sphere as camera-facing sprites; drag to spin, depth shown via scale and opacity |
| Cards | Pointer-tracked `rotateX/rotateY` tilt with a sheen that follows the cursor |

## Running locally

ES modules need a real HTTP origin — opening `index.html` from the filesystem
will fail on CORS. Serve the directory instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Build

```bash
# 1. serve the source
npx http-server -p 8123 -s .

# 2. bake the rendered DOM into static HTML (needs Playwright)
node tools/prerender.mjs http://localhost:8123/ dist/index.html

# 3. inline everything into one portable file
python3 tools/build-standalone.py dist/index.html
```

**`tools/prerender.mjs`** drives a real browser, waits for the render, then
snapshots the DOM. Without this a crawler — or any viewer where scripts are
blocked — sees an empty shell. The scripts stay in the snapshot and re-render
the same sections on load, which is idempotent, so the 3D still attaches.

**`tools/build-standalone.py`** produces `dist/resume-standalone.html` (~790 KB):
one file, no server, no network, no relative requests. Email it or AirDrop it.

Two hard-won constraints are encoded in that bundler:

- **No `data:` URL for three.js.** The obvious build maps the bare `three`
  specifier to a base64 `data:` URL via an importmap. Any CSP that omits
  `data:` from `script-src` refuses it — which is what in-app preview panels,
  email clients and corporate proxies all send. The failure is total: the
  module never runs and the page sits on its spinner forever.
- **No flat concatenation either.** Merging the modules into one shared scope
  collides identifiers: minified three.js declares `el`, and so does `ui.js`
  (`Identifier 'el' has already been declared`). Each module therefore gets
  its own IIFE returning its exports, with imports rebound from the enclosing
  module objects — real module scoping in a classic script.

Verified in a real browser across four environments — normal `file://`, a CSP
without `data:` scripts, `script-src 'none'`, and JavaScript disabled outright.
All four show the complete resume; the last two simply lose the 3D.

Web fonts are the only remaining network fetch; without them the page falls
back to the system sans-serif and looks essentially the same.

## Deploying

`.github/workflows/deploy.yml` publishes the repo root to GitHub Pages on every
push to `main` or `claude/3d-resume-website-rqm1j9`.

One-time setup, done by hand — the workflow's `GITHUB_TOKEN` cannot create the
Pages site, as that needs repo admin rights:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Re-run the workflow (or push again).

The published URL is then `https://<user>.github.io/<repo>/`.

### Repository visibility

This repo is currently **private**, and that blocks a publicly shareable link:

- On the **free** plan, Pages only serves **public** repositories.
- On a **paid** plan, a private repo can serve Pages, but the site inherits
  access control — only collaborators can open it, so the link cannot be sent
  to a recruiter.

For a link anyone can open, make the repository public
(**Settings → General → Danger Zone → Change visibility**). Note this also
publishes the source, so keep anything sensitive out of `data.js`.

## Accessibility & performance

- Content is prerendered into the markup and rendered before the 3D layers, so
  the page is fully readable if WebGL fails, scripts are blocked, or JS is off.
- A pure-CSS failsafe hides the loading spinner after 4s, so a script that
  never runs cannot leave it covering the page.
- `prefers-reduced-motion` disables the animation loops and reveal transitions.
- Device pixel ratio is capped at 2; particle count drops on small viewports;
  rendering stops entirely while the tab is hidden.
- A print stylesheet flattens the page to plain black-on-white.
