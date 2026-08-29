# Landing pages

Two full-viewport landing compositions built to a supplied spec: React +
TypeScript + Tailwind + Vite, `lucide-react` for the icons, Inter for body text
and basis33 for the bitmap words.

| Source            | Published to | What it is                                                     |
| ----------------- | ------------ | -------------------------------------------------------------- |
| `src/App.tsx`     | `../landing` | The reference recreated exactly, hotlinked stock video and all. |
| `src/Me.tsx`      | `../me`      | The same composition, real resume, generated background, self-hosted fonts. |
| `src/Portfolio.tsx` | `../portfolio` | A longer scrolling page from a second reference, same real content. |

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

`../landing` loads them as the spec names them: Inter from Google Fonts,
basis33 from its aggregator, two `<link>` tags in the head.

`../me` does neither, because it has to match the resume site in the repository
root and that site self-hosts everything so its single-file standalone opens
offline. basis33 cannot be self-hosted here: it is served only by
`db.onlinewebfonts.com`, which this environment's egress policy denies outright
and whose licence for commercial use is unclear either way.

**Silkscreen** stands in. It was picked by rendering ten self-hostable pixel
faces at the sizes this page uses and comparing them against basis33 as it
renders in a real browser -- Silkscreen has the same single-pixel strokes and
wide letterforms, and it is OFL. Both pages that carry the real name now use it,
so the jump from one to the other is not a jump. It sets wider than basis33,
which the layout had to absorb: display words dropped from `1.25em` to `1.05em`
and the bottom row went from an even split to `1.45fr 1fr`, because at the old
values `DELIVERABLES` ran past its column edge and `REQUIREMENTS &` overflowed
on its own between `lg` and `xl`.

`../me` makes no external request of any kind: no font CDN, no video host,
nothing. Verified by loading it with every non-local request aborted -- seven
faces resolve, Silkscreen renders, zero requests attempted.


## The portfolio page

Built from a second reference: loading counter, GSAP hero entrance, bento work
grid, pinned parallax gallery, marquee footer. Inter for reading, Instrument
Serif italic for display -- a display face that stays legible, which the bitmap
one did not.

Three of its sections had no truthful equivalent and carry real work instead
rather than being filled in:

| Reference          | Here                                                     |
| ------------------ | -------------------------------------------------------- |
| Journal, 4 posts   | The delivery loop: the five process stages from data.js.  |
| Explorations, Dribbble | The artefacts: six of the fourteen deliverable types. |
| 20+ yrs, 95+ projects, 200% clients | The three resume figures, each printing the line it came from. |

The reference fills its cards with photography and streams a Mux video behind
the hero. Neither is used: `portfolioCovers.tsx` draws each cover as the
artefact the project actually produced -- a segmentation map, a dashboard, a
traceability matrix -- and the hero reuses the generated WebGL scene. Nothing is
hotlinked and nothing 404s when someone else's CDN moves.

`check-portfolio.mjs` guards it: every value against `data.js`, a blocklist for
the reference persona, a sweep that fails on any number rendered on the page
that cannot be traced back to `data.js`, and a contrast pass that hides the
glyphs and samples whatever is actually behind each run. 33 checks.

    npx http-server dist -p 8271 -s &
    URL_ME=http://127.0.0.1:8271/me/ URL_PORTFOLIO=http://127.0.0.1:8271/portfolio/ npm run check
