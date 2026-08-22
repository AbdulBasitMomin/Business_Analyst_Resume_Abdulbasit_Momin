# Source and provenance

Vendored from a third-party skills collection:

- Repo: https://github.com/freshtechbro/claudedesignskills
- Path: `.claude/skills/web3d-integration-patterns/SKILL.md`
- Licence: MIT (see `LICENSE`, Copyright (c) 2025 Claude Skills Project)
- Retrieved: 2026-08-22

## Two things to know before relying on it

**1. The bundled resources it advertises do not exist.** Its "Resources"
section lists `references/architecture_patterns.md`,
`references/performance_optimization.md`, `references/state_management.md`,
`scripts/integration_helper.py`, `scripts/pattern_generator.py` and
`assets/starter_unified/`. Every one of those paths returns 404 in the source
repo. Only SKILL.md was published, so treat any instruction to "see
references/…" as a dead end.

**2. It does not describe this project's stack.** The skill covers React,
React Three Fiber, GSAP ScrollTrigger, Framer Motion, React Spring and
Zustand. This site is deliberately vanilla ES modules plus a vendored
three.js, with no framework and no build step — that is what makes the
single-file `dist/resume-standalone.html` and the CSP-proof fallback
possible. The skill is useful reading if the project ever migrates to React;
its patterns do not apply as written today.
