# Source and provenance

The skills in this directory are vendored from a third-party collection, not
written for this project:

- Repo: https://github.com/freshtechbro/claudedesignskills
- Licence: MIT (see `LICENSE`, Copyright (c) 2025 Claude Skills Project)
- Retrieved: 2026-08-22

| Skill | Published resources beyond SKILL.md |
| --- | --- |
| `web3d-integration-patterns` | none (see its own SOURCE.md) |
| `threejs-webgl` | none |
| `gsap-scrolltrigger` | none |
| `react-three-fiber` | `references/api_reference.md`, `scripts/component_generator.py`, `scripts/scene_setup.py` |
| `motion-framer` | none |
| `react-spring-physics` | none |

Each SKILL.md advertises a "Resources" section listing `references/`,
`scripts/` and `assets/` files. With the three exceptions in the table above,
those paths return 404 in the source repo — only the SKILL.md files were ever
published. Treat any instruction to "see references/…" as a dead end.

## What actually applies to this site

Four of the five new skills target React: React Three Fiber, Framer Motion,
React Spring, and GSAP's React bindings. This site is deliberately vanilla ES
modules plus a vendored three.js r169, with no framework and no build step —
that is what makes the single-file `dist/resume-standalone.html` and the
CSP-proof fallback possible.

So only `threejs-webgl` applies directly. What was used from it, in
`assets/js/tracegraph.js`:

- **InstancedMesh for repeated objects** — all 46 graph nodes are one draw
  call, coloured per instance.
- **Raycasting for interaction** — `instanceId` from a single
  `intersectObject` call identifies the picked node.
- **Geometry reuse and explicit disposal** — one sphere geometry, one
  material, and a `dispose()` that releases both plus the renderer.
- **Animation clock for consistent timing** — the sway is driven by delta
  time, not frame count.

From `web3d-integration-patterns`, the layered-separation pattern: the 3D
layer owns the scene and the render loop, the DOM owns every label and all
the text, and a small state bridge (`select` / `onPick` / `onTags`) joins
them. All the readable content stays in HTML.

The rest is useful reading if this project ever moves to React. It does not
apply as written today.
