# Landing pages

Two full-viewport landing compositions built to a supplied spec: React +
TypeScript + Tailwind + Vite, `lucide-react` for the icons, Inter for body text
and basis33 for the bitmap words.

| Source            | Published to | What it is                                        |
| ----------------- | ------------ | ------------------------------------------------- |
| `src/App.tsx`     | `../landing` | The reference recreated exactly, as specified.    |
| `src/Me.tsx`      | `../me`      | The same composition carrying the real resume.     |

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
performed:

    npx http-server dist -p 8210 -s &
    npm run check        # 35 checks

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

## Three external assets

The spec names exact URLs for the background video, Inter and basis33 and says
not to substitute them. They are used verbatim. Inter and basis33 are blocked by
this sandbox's egress proxy (`CONNECT tunnel failed, 403`), so measurements here
were taken with Inter self-hosted locally and monospace standing in for basis33.

The video is hotlinked from a CloudFront bucket belonging to whoever produced
the original page. It is not served from this repository, it is not licensed to
this one, and it will break whenever that URL moves.
