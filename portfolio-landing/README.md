# Landing pages

Two full-viewport landing compositions built to a supplied spec: React +
TypeScript + Tailwind + Vite, `lucide-react` for the icons, Inter for body text
and basis33 for the bitmap words.

| Source            | Published to | What it is                                                     |
| ----------------- | ------------ | -------------------------------------------------------------- |
| `src/App.tsx`     | `../landing` | The reference recreated exactly, hotlinked stock video and all. |
| `src/Me.tsx`      | `../me`      | The same composition, real resume, generated background.        |

Both are separate from the resume site in the repository root and share nothing
with it. The resume site stays a no-build static page, which is what lets it
produce a single-file standalone, a CSP-proof fallback, a prerendered document
and a two-page PDF; a Vite bundle in the same tree would cost all four.

## Build

    npm install
    npm run build      # vite build, then pack.mjs splits the MPA into ../landing and ../me

Vite emits one multi-page build sharing a single `assets/`. `pack.mjs` splits it
into two self-contained directories, because each gets installed independently
and one of them at the root of a Pages site. `base` is `./`, so either directory
works at a domain root or under any sub-path.

`portfolio-landing/` is pruned from the Pages upload in
`.github/workflows/deploy.yml`; only the two built directories ship.

## Nothing on the personal page is invented

`src/Me.tsx` imports `assets/js/data.js` -- the resume site's single source of
truth -- through the `@resume` alias, so the name, role, location, availability,
figures, phone, PDF path and the footer counts are all read from it rather than
retyped. Edit `data.js` and both the resume and this page move together.

The reference's three award chips have no truthful equivalent, so they carry the
resume's three quantified figures instead, each `title`d with the resume line it
came from. The showreel button becomes the resume download. The nav points at
the real sections of the live resume.

`check-content.mjs` is the guard. It asserts every rendered value against
`data.js` and fails on any of the reference's copy surviving into the personal
page -- the persona, the awards, the invented counts, the services not
performed. `npm run check` runs it with the contrast and behaviour guards:

    npx http-server dist -p 8240 -s &
    URL=http://127.0.0.1:8240/me/ npm run check     # 35 + 9 + 7

## The single viewport

`h-screen overflow-hidden` with no scroll is the spec's central constraint, so
content taller than the viewport is clipped rather than scrolled. Measured with
real Inter served locally and basis33 falling back to monospace:

| Viewport            | `../landing` | `../me` |
| ------------------- | ------------ | ------- |
| 375 x 667           | 234px        | 205px   |
| 390 x 844           | 57px         | fits    |
| 412 x 915           | fits         | fits    |
| 430 x 932 and above | fits         | fits    |

Those are upper bounds: basis33 is a compact bitmap face that sets shorter than
the monospace standing in for it. The personal page's copy was shortened until
it cleared the reference at every size -- capability labels to one or two words,
figure chips to a number and a noun, with the full label on the `title`.

### Headline line breaks

The four specified lines are held by `<br>`, not by `white-space: nowrap`.
Nowrap does pin them, but it trades a reflow for text clipped off the right edge
inside `overflow-hidden`, which is worse. So the breaks depend on how wide the
words actually set, and in the worst-case substitution they survive down to
1440px on `../landing` and 1600px on `../me`; below `lg` the headline gets the
full width and both hold again. basis33 is much narrower than the monospace
those numbers were measured with, so the real range is wider -- but it was not
measurable here, see below. If `AMBIGUOUS INTO` does split on a real browser,
a shorter word on that line fixes it; `UNCLEAR INTO` measured equal to the
reference.

## The background

`../landing` keeps the specified video, because it is a faithful recreation.
`../me` does not. That video is a stock clip of a model, hotlinked from a
CloudFront bucket belonging to whoever produced the original page: not licensed
here, unrelated to the work, and dead the day that URL moves.

`src/workspace.ts` replaces it with a scene of the instruments the role actually
uses -- a laptop running a dashboard whose bars and trend line animate, drifting
requirements documents, and the delivery loop with a marker running the circuit.
Every vertex is generated at runtime, so there is no asset to licence and
nothing to 404. Drawn as unlit wireframe rather than solid props, because at the
alpha this layer runs at a solid model turns into a grey smudge while an outline
stays legible. Geometry and materials are built once and shared, keys are one
instanced mesh, and the loop stops when the tab is hidden.

It costs 125 KB gzipped, which is three.js. That is more JavaScript than the
rest of the page put together and far less than the video it replaces.

### Keeping the copy readable over it

Text contrast is measured against the composited frame, not against token
values: `check-contrast.mjs` screenshots each viewport with the copy hidden,
finds the brightest pixel under every text run, composites the run's own colour
over it and computes the ratio. Nine viewports, and the worst run is 4.83:1
against a 4.5 floor.

Getting there was not a matter of moving the rig. Each nudge to dodge one
collision only held until some untested window size put a bright edge behind a
different line -- 1440 cleared and 1280 broke, then 1280 cleared and 375 broke.
The fix is structural: gradient scrims over the two bands the copy occupies, the
meta grid along the top and the headline along the bottom, leaving the middle of
the frame where the laptop is at full strength. Below `lg` the canvas also drops
to 25% opacity, because the stacked layout leaves the scene nowhere to sit that
is not behind a line of text.

Three ways it degrades, all covered by `check-behaviour.mjs`: no WebGL renders
the page on plain black with no uncaught error, `prefers-reduced-motion` holds a
single still frame rather than dropping the composition, and the canvas is
`aria-hidden`.

## Fonts

The spec names exact URLs for Inter and basis33 and says not to substitute them.
They are used verbatim on both pages. Both are blocked by this sandbox's egress
proxy (`CONNECT tunnel failed, 403`), so measurements here were taken with Inter
self-hosted locally and monospace standing in for basis33.
