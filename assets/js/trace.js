/**
 * Traceability.
 *
 * A business analyst's core artefact is the traceability matrix: every claim
 * links back to the thing that evidences it. This module builds that matrix
 * over the resume's own content, so the site demonstrates traceability by
 * being traceable.
 *
 * Capability -> resume bullet -> project -> employer. Every edge is DERIVED
 * from data already present: a capability quotes a resume line, and a case
 * study belongs to an employer. Nothing here asserts a new claim, and a
 * capability with no supporting bullet stays visibly untraced rather than
 * being quietly attached to something.
 */
import { resume } from './data.js';
import { capabilities, projectsFor } from './evidence.js';

/**
 * Normalise for comparison: fold case, drop punctuation, collapse space.
 * Quotes in the evidence map are excerpts, so they differ from the bullet in
 * capitalisation and trailing punctuation even when they are the same words.
 */
const norm = (s) => String(s)
  .toLowerCase()
  .replace(/…|\.\.\./g, '|')
  .replace(/[^a-z0-9|]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Every achievement bullet, addressable as "roleIndex-bulletIndex". */
export function bulletIndex() {
  const out = [];
  (resume.experience || []).forEach((role, ri) => {
    (role.achievements || []).forEach((text, bi) => {
      out.push({
        id: `${ri}-${bi}`, ri, bi, text, n: norm(text),
        company: role.company, short: role.short || role.company, role: role.role,
      });
    });
  });
  return out;
}

/**
 * Longest-window match. An excerpt may elide its middle ("Document … APIs"),
 * so each side of an ellipsis is tried separately -- a prefix-only match
 * cannot span the gap and silently loses those capabilities.
 */
function bulletsForQuote(quote, bullets) {
  const hits = new Set();
  for (const part of norm(quote).split('|')) {
    const words = part.split(' ').filter(Boolean);
    if (words.length < 4) continue;
    for (let len = words.length; len >= 4; len--) {
      const needle = words.slice(0, len).join(' ');
      const found = bullets.filter((b) => b.n.includes(needle));
      if (found.length) {
        found.forEach((f) => hits.add(f.id));
        break;
      }
    }
  }
  return [...hits];
}

/**
 * The matrix, both directions.
 *   byCapability: name -> { bullets, projects, orgs, traced }
 *   byBullet:     bulletId -> capability names
 */
export function buildTrace() {
  const bullets = bulletIndex();
  const byId = new Map(bullets.map((b) => [b.id, b]));
  const byCapability = new Map();
  const byBullet = new Map(bullets.map((b) => [b.id, []]));

  for (const cap of capabilities) {
    const ids = [...new Set(cap.evidence.flatMap((ev) => bulletsForQuote(ev.quote, bullets)))];
    byCapability.set(cap.name, {
      cap,
      bullets: ids.map((id) => byId.get(id)),
      projects: projectsFor(cap),
      orgs: [...new Set(cap.evidence.map((ev) => ev.company))],
      traced: ids.length > 0,
    });
    ids.forEach((id) => byBullet.get(id).push(cap.name));
  }

  return { bullets, byCapability, byBullet };
}
