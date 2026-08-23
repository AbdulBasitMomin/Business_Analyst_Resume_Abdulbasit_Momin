# Business Analyst Resume: Abdulbasit Momin

A single-page resume site for a Business Analyst profile, with a WebGL layer.
No build step and no framework: plain ES modules plus a vendored copy of
Three.js r169.

Live: https://abdulbasitmomin.github.io/Business_Analyst_Resume_Abdulbasit_Momin/

## Editing content

**All resume content lives in one file:
[`assets/js/data.js`](assets/js/data.js).** Nothing is hardcoded in the markup,
so adding a role or a certification means editing the array and nothing else.

- `meta`: name, role, tagline, contact links, resume PDF path, portfolio URL
- `stats`: the counters beside the hero. Each carries a `source`, because a
  number a reader cannot trace is a liability
- `about`: headline plus body paragraphs
- `experience`: roles, newest first (`end: 'Present'` renders a live badge)
- `skills`, `skillCloud`, `deliverables`, `domains`: the capability lists
- `process`: the BA lifecycle stages
- `projects`, `education`, `certifications`, `awards`, `testimonials`

A certification carrying `status: 'In progress'` renders with a hollow mark and
an amber status pill, and never as a completed credential.

Three further files hold the derived layers, all of them built from the content
above rather than asserting anything new:

- [`journey.js`](assets/js/journey.js): the lifecycle walkthrough, stakeholder
  views and attributed outcomes
- [`evidence.js`](assets/js/evidence.js): each capability mapped to the resume
  line that evidences it, plus the case studies
- [`trace.js`](assets/js/trace.js): the traceability matrix, derived by
  matching capability quotes against achievement bullets

`isPlaceholder` at the top of `data.js` controls the amber "Draft" badge.

Empty arrays hide their section, so unused blocks cost nothing.

After any content edit, regenerate the downloadable PDF (step 4 under Build).

## What's 3D here

The 3D is meant to *say something about business analysis*, not just decorate.

| Layer | Detail |
| --- | --- |
| **Traceability matrix** (`tracegraph.js`) | The one piece of 3D that is not atmosphere. The real matrix, drawn: achievement bullets clustered by employer on the left, capabilities fanning out by category on the right, one edge per link `trace.js` could actually derive. Hover a node for its text, click it to open its evidence, and selecting a capability anywhere isolates its subgraph. A capability nothing evidences is drawn amber and unlinked, because that gap is true. |
| **Backdrop** (`backdrop.js`) | A particle field on a shell, parallaxing toward the pointer, receding to a quarter opacity once there is body copy on screen. |
| **Artefacts** (`artifacts.js`) | Workstations, documents and the delivery loop, drifting far behind the reading column as wireframe blueprints. Deliberately faint: at this opacity a solid model becomes a grey smudge while an outline stays legible, and if it ever competes with a line of text the text wins. |
| **Data graphics** (`graphics.js`) | SVG, not WebGL: the career timeline and the capability coverage matrix. Both need to be legible at every width and readable in print, which rules out a canvas. |
| Cards | Pointer-tracked tilt with a sheen that follows the cursor. |

### Colour is validated, not chosen by eye

Hues come from a documented categorical order and are taken **contiguously**:
the ordering *is* the colour-vision-safety mechanism, so skipping a slot breaks
it. Checked with a palette validator rather than judged by eye.

- The **traceability graph** carries two series plus a status: achievements on
  slot 1 (blue), capabilities on slot 2 (orange), and the reserved warning
  amber for a capability with nothing behind it. It first shipped with blue and
  violet for the two series, which measure ΔE 1.9 under protanopia and 9.8
  under normal vision against a floor of 15: a reader with full colour vision
  could barely tell the two node kinds apart. Blue against orange measures 26.8
  and 31.8. Position and node size carried the distinction either way, but the
  normal-vision floor is not something secondary encoding excuses.
- The **coverage matrix** is sequential, so it is one hue stepped light to
  dark, revalidated against the current surface (monotone lightness, visible
  step gaps, the pale end still clearing the surface).
- The **career timeline** is a single series, so it needs no legend; the title
  names it.
- The **hero KPIs** stay stat tiles. They are heterogeneous units (years,
  dashboards, deployments); putting them on one axis would be a dual-scale
  chart, which is the classic charting mistake.

The neutrals are **graphite**, near-neutral with only a faint cool cast rather
than a saturated navy. On large areas low chroma reads as considered and high
chroma reads as decorated, which is most of the distance between a
professional dark interface and a themed one. The accent is a steel azure held
back from the brighter blue it replaced, and it is the same colour the charts
use for series 1, so the page carries one blue rather than two. Swapping it
meant re-running the full gate: the two series clear all-pairs CVD ΔE 24.6 and
normal-vision 28.6 against the new surface, and the sequential ramp still
passes monotone lightness, step gaps and light-end contrast.

Beyond hue, what carries the look is surface: an elevation ladder, a 1px
catch of light on each card's top edge, three fixed ambient sources, and cards
that hold a real position in space. Contrast is measured from the *composited*
pixel behind each text run rather than from the token values, because the card
faces are translucent over a gradient and a token's nominal contrast is not
what a reader gets. Raising the card opacity once dropped seven muted-ink
styles to 4.48:1; the audit now measures all of it on every run.

### 3D cards

A card turns towards the pointer, a specular highlight tracks across its face,
and the elements on the face sit at their own depths, so the parallax is real
rather than a flat image being skewed. Three constraints shape it:

- **Rotation is capped at 5.5°.** Past roughly seven the type on the face reads
  as distorted, and a transform costs subpixel antialiasing while it is
  applied. Nothing is transformed at rest.
- **Pointers only.** There is no hover on a touch screen, so a tilt there
  either never fires or fires on a tap and sticks. Phones get the flat card,
  which is the same card.
- **One listener, one frame.** A `pointermove` handler per card is a dozen
  handlers competing for the same frame. `cards3d.js` reads the pointer once,
  coalesces to `requestAnimationFrame` (600 events collapse to ~30 writes), and
  releases on leave, blur and scroll so a card is never left tilted at an angle
  that no longer points anywhere.

## Running locally

ES modules need a real HTTP origin. Opening `index.html` from the filesystem
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

# 4. regenerate the downloadable resume PDF from the site's own print view
node tools/build-resume-pdf.mjs http://localhost:8123/ \
  assets/Abdulbasit-Momin-Business-Analyst.pdf
```

Run step 4 after any content edit. The PDF used to be a separate export from a
word processor, which meant every change had to be made twice and the two
drifted: the site listed one set of certifications and the download listed
another. It is now generated from `data.js` through the `@media print` block,
so the download and the page cannot disagree, and Ctrl-P gives the same two
pages. The script fails rather than writing a file if the printed copy is
missing an expected credential.

**`tools/prerender.mjs`** drives a real browser, waits for the render, then
snapshots the DOM. Without this a crawler, or any viewer where scripts are
blocked, sees an empty shell. The scripts stay in the snapshot and re-render
the same sections on load, which is idempotent, so the 3D still attaches.

**`tools/build-standalone.py`** produces `dist/resume-standalone.html` (~1 MB):
one file, no server, no network, no relative requests. Email it or AirDrop it.

Two hard-won constraints are encoded in that bundler:

- **No `data:` URL for three.js.** The obvious build maps the bare `three`
  specifier to a base64 `data:` URL via an importmap. Any CSP that omits
  `data:` from `script-src` refuses it, which is what in-app preview panels,
  email clients and corporate proxies all send. The failure is total: the
  module never runs and the page sits on its spinner forever.
- **No flat concatenation either.** Merging the modules into one shared scope
  collides identifiers: minified three.js declares `el`, and so does `ui.js`
  (`Identifier 'el' has already been declared`). Each module therefore gets
  its own IIFE returning its exports, with imports rebound from the enclosing
  module objects: real module scoping in a classic script.

Verified in a real browser across four environments: normal `file://`, a CSP
without `data:` scripts, `script-src 'none'`, and JavaScript disabled outright.
All four show the complete resume; the last two simply lose the 3D.

Web fonts are the only remaining network fetch; without them the page falls
back to the system sans-serif and looks essentially the same.

## Deploying

`.github/workflows/deploy.yml` publishes the repo root to GitHub Pages on every
push to `main` or `claude/3d-resume-website-rqm1j9`.

One-time setup, done by hand. The workflow's `GITHUB_TOKEN` cannot create the
Pages site, as that needs repo admin rights:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Re-run the workflow (or push again).

The published URL is then `https://<user>.github.io/<repo>/`.

### Repository visibility

This repo is currently **private**, and that blocks a publicly shareable link:

- On the **free** plan, Pages only serves **public** repositories.
- On a **paid** plan, a private repo can serve Pages, but the site inherits
  access control: only collaborators can open it, so the link cannot be sent
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
