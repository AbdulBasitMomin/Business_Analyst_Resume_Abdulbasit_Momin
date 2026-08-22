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
- `process` — the five BA lifecycle stages driving the 3D flow and its cards
- `deliverables` — artefacts produced, rendered as a two-column list
- `domains` — settings the work happened in
- `projects`, `education`, `certifications`, `awards`, `testimonials`

`isPlaceholder` at the top of the file controls the amber "Draft" badge. Set it
to `false` once the real content is in.

Empty arrays hide their section, so unused blocks cost nothing.

## What's 3D here

The 3D is meant to *say something about business analysis*, not just decorate.

| Layer | Detail |
| --- | --- |
| **Backdrop** (`scene.js`) | A **requirements traceability network**: business need → requirement → user story → acceptance criteria → test case, as five layers along X. Edges only ever join adjacent layers — a link that skipped one would misrepresent traceability — and pulses travel downstream along them. A legend under the hero names each layer, tying its hue to its nodes. |
| Camera | Rides along the chain as scroll advances, looking slightly ahead down the flow, parallaxing toward the pointer. Past the hero the canvas fades to 24% so it never competes with body copy. |
| **Process flow** (`process.js`) | The BA lifecycle as five hexagonal plates on an arc, with a token that travels and dwells on each. Optimise loops back to Elicit along a dashed curve, because the lifecycle is a loop. The active plate lifts and brightens, and reports itself so the DOM cards highlight in sync. |
| **Skill graph** (`orb.js`) | Clusters by discipline: each group gets a hub on a Fibonacci sphere with its skills orbiting it on staggered radii, joined by spokes. Labels are camera-facing sprites sized from measured text, so long names are neither clipped nor squashed. Drag to spin. |
| Cards | Pointer-tracked `rotateX/rotateY` tilt with a sheen that follows the cursor |

### Colour is validated, not chosen by eye

Hues come from a documented categorical order and are taken **contiguously** —
the ordering *is* the colour-vision-safety mechanism, so skipping a slot breaks
it. Checked with a palette validator rather than judged by eye:

- The traceability layers and process stages are **chains** (layer N only ever
  sits beside N±1), so they use the adjacent pairlist: five contiguous slots
  pass every gate.
- The skill graph's clusters float freely in 3D, so any two can end up side by
  side — the all-pairs case, where four hues **fail** (yellow vs orange at
  normal-vision ΔE 10.6, under the 15 floor). So the graph uses **one** hue;
  identity there comes from each cluster's named hub and its position, which is
  stronger than colour anyway.
- Skill bars are **meters**, not charts: a single ratio against a limit, so
  track and fill come from one hue ramp. A two-hue gradient would imply a
  second variable that isn't there.
- The hero KPIs stay **stat tiles**. They're heterogeneous units (years,
  dashboards, %, deployments); putting them on one axis would be a dual-scale
  chart, which is the classic charting mistake.

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
