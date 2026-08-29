# Adam Roberts landing page

A recreation of a supplied full-viewport portfolio landing composition, built to
its spec: React + TypeScript + Tailwind + Vite, `lucide-react` for the three
icons, Inter for everything except the two bitmap words, which are basis33.

This is a separate app from the resume site in the repository root. It shares
nothing with it: its own stack, its own build, its own `node_modules`. The
resume site remains a no-build static page and is untouched.

## Build

    npm install
    npm run build      # -> dist/

The published copy lives at `../landing/`, which is what GitHub Pages serves at
`/landing/`. Regenerate it after a change:

    npm run build && rm -rf ../landing && cp -r dist ../landing

`vite.config.ts` sets `base: './'` so the bundle works from that sub-path rather
than only at a domain root. `portfolio-landing/` is pruned from the Pages upload
in `.github/workflows/deploy.yml`; only the built `landing/` directory ships.

## Three external assets

The spec names exact URLs for the background video, Inter and basis33, and says
not to substitute them. They are used verbatim. Two of the three are blocked by
this sandbox's egress proxy (`CONNECT tunnel failed, 403`), so the video and the
bitmap face could not be seen rendering here; the markup requesting them is
correct and they resolve from an ordinary browser.

The video is hotlinked from a CloudFront bucket that belongs to whoever produced
the original page. It is not served from this repository and will break whenever
that URL moves.

## The single viewport

`h-screen overflow-hidden` with no scroll is the spec's central constraint, so
content taller than the viewport is clipped rather than scrolled. Measured with
real Inter loaded and basis33 falling back to monospace:

| Viewport            | Overflow |
| ------------------- | -------- |
| 375 x 667           | 234px    |
| 390 x 844           | 57px     |
| 412 x 915           | 0        |
| 430 x 932           | 0        |
| 768 x 1024          | 0        |

Those are upper bounds. About 300px of that column is `.font-pixel` text, and
basis33 is a compact bitmap face that sets shorter than the monospace fallback
standing in for it, so the real figures are smaller. Fitting the short phones
for certain would mean scrolling or dropping copy, both of which the spec rules
out, so nothing here compensates for it.
