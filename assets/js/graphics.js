/**
 * Data graphics. Both are derived from the resume -- nothing here is invented.
 *
 *  1. Career timeline: the three roles as spans on a year axis. It shows
 *     continuous employment, which a bulleted list cannot.
 *  2. Coverage matrix: how many evidenced capabilities each employer accounts
 *     for, per discipline. A heatmap of counts, so magnitude is real.
 *
 * Colour follows the documented sequential rule: one hue, light-to-dark. On a
 * dark surface the ramp is inverted from the light-mode convention -- near-zero
 * recedes toward the surface, so low counts are dark and high counts light.
 * Every cell is also directly labelled, so magnitude never rests on colour.
 */
import { resume } from './data.js';
import { capabilities, CATEGORIES } from './evidence.js';

/** Blue sequential steps 600 -> 200, used low-to-high on the dark surface. */
const RAMP = ['#184f95', '#256abf', '#5590d8', '#6da7ec', '#9ec5f4'];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

/** "January 2022" / "Jul 2025" / "Present" -> fractional year. */
function toYear(text, now = new Date()) {
  const s = String(text).trim().toLowerCase();
  if (s === 'present') return now.getFullYear() + now.getMonth() / 12;
  const m = s.match(/^([a-z]+)\s+(\d{4})$/);
  if (!m) {
    const y = s.match(/(\d{4})/);
    return y ? Number(y[1]) : NaN;
  }
  const idx = MONTHS.findIndex((name) => name.startsWith(m[1].slice(0, 3)));
  return Number(m[2]) + (idx < 0 ? 0 : idx / 12);
}

/* ==================== career timeline ==================== */

export function renderTimelineGraphic(node) {
  if (!node) return;
  const roles = (resume.experience || []).map((r) => ({
    label: r.company,
    role: r.role,
    from: toYear(r.start),
    to: toYear(r.end),
    current: String(r.end).toLowerCase() === 'present',
  })).filter((r) => Number.isFinite(r.from) && Number.isFinite(r.to));

  if (!roles.length) return;

  const min = Math.floor(Math.min(...roles.map((r) => r.from)));
  // The axis may run past the current year to fit an in-progress role, but a
  // future year must not be labelled -- it reads as a typo.
  const max = Math.max(...roles.map((r) => r.to));
  const lastLabel = Math.floor(Math.min(max, new Date().getFullYear()));
  const W = 720;
  const ROW = 34;
  const PAD_L = 22;
  const PAD_R = 14;
  const AXIS = 20;
  const H = AXIS + roles.length * ROW + 6;
  const span = Math.max(max - min, 1);
  const x = (year) => PAD_L + ((year - min) / span) * (W - PAD_L - PAD_R);

  // Oldest first reads left-to-right as a career, not a reverse-chronological list.
  const ordered = [...roles].reverse();
  const years = [];
  for (let y = min; y <= lastLabel; y++) years.push(y);

  node.innerHTML = `
    <figure class="gfx gfx-timeline">
      <figcaption class="gfx-cap">Continuous experience, ${min}–present</figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img"
        aria-label="Timeline: ${ordered.map((r) => `${r.label} ${Math.floor(r.from)} to ${r.current ? 'present' : Math.floor(r.to)}`).join('; ')}.">
        <g class="gfx-axis">
          ${years.map((y) => `<line x1="${x(y).toFixed(1)}" y1="${AXIS - 6}" x2="${x(y).toFixed(1)}" y2="${H - 4}" />`).join('')}
          ${years.map((y) => `<text x="${x(y).toFixed(1)}" y="${AXIS - 10}" text-anchor="middle">${y}</text>`).join('')}
        </g>
        ${ordered.map((r, i) => {
          const y = AXIS + i * ROW + 4;
          const x1 = x(r.from);
          const w = Math.max(x(r.to) - x1, 6);
          // A short span cannot hold its own label; put it alongside instead of
          // letting the text run off the end of the bar. This is a first guess
          // only, so the bars are not visibly re-placed on load; placeLabels()
          // corrects it against the text as actually rendered.
          const estimate = r.label.length * 6.3 + 18;
          const inside = w >= estimate;
          const tx = inside ? x1 + 9 : x1 + w + 8;
          return `<g class="gfx-bar${r.current ? ' is-current' : ''}${inside ? '' : ' is-outside'}" style="--i:${i}">
            <rect x="${x1.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="16" rx="4" />
            <text x="${tx.toFixed(1)}" y="${y + 12}">${esc(r.label)}</text>
          </g>`;
        }).join('')}
      </svg>
    </figure>`;

  placeLabels(node);
}

/**
 * Decide inside-or-alongside from the measured text rather than from a
 * per-character constant.
 *
 * The constant was 6.3px per character, which was right for exactly one font
 * and became wrong the moment the page changed face -- BodyWellnessAI was
 * judged to fit and ran off the end of its bar. getComputedTextLength returns
 * viewBox units, the same space the bar geometry is in, so the comparison is
 * exact whatever the font turns out to be.
 *
 * Runs twice: once now, and again once webfonts have loaded, because the first
 * measurement would otherwise be of the fallback face.
 */
function placeLabels(node) {
  const measure = () => {
    node.querySelectorAll('.gfx-bar').forEach((g) => {
      const rect = g.querySelector('rect');
      const text = g.querySelector('text');
      if (!rect || !text) return;
      const x1 = parseFloat(rect.getAttribute('x'));
      const w = parseFloat(rect.getAttribute('width'));
      // 9 units of padding at the leading edge, the same again as trailing air.
      const inside = w >= text.getComputedTextLength() + 18;
      g.classList.toggle('is-outside', !inside);
      text.setAttribute('x', (inside ? x1 + 9 : x1 + w + 8).toFixed(1));
    });
  };
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {});
}

/* ==================== coverage matrix ==================== */

const ORGS = [
  { key: 'Sarjen Systems', short: 'Sarjen' },
  { key: 'BodyWellnessAI', short: 'BodyWellnessAI' },
  { key: 'Mercor', short: 'Mercor' },
];

export function renderCoverageGraphic(node) {
  if (!node) return;

  // Count distinct capabilities per discipline that cite each employer.
  const counts = CATEGORIES.map((cat) => ORGS.map((org) =>
    capabilities.filter((c) => c.cat === cat && c.evidence.some((e) => e.company === org.key)).length));
  const peak = Math.max(1, ...counts.flat());

  // Column widths follow their own labels; a fixed width made the longest
  // employer name collide with its neighbours. Intrinsic units are sized to
  // roughly match the rendered width, so the SVG is never scaled up -- doing
  // that magnified every glyph and broke the header row.
  const cols = ORGS.map((o) => ({ ...o, w: Math.max(74, o.short.length * 7.4 + 18) }));
  const LABEL_W = 150;
  const ROW_H = 40;
  const HEAD_H = 30;
  const W = LABEL_W + cols.reduce((n, c) => n + c.w, 0);
  const H = HEAD_H + CATEGORIES.length * ROW_H;
  const colX = [];
  cols.reduce((acc, c) => { colX.push(acc); return acc + c.w; }, LABEL_W);

  const shade = (n) => {
    if (!n) return 'transparent';
    // Bucket into the ramp; a single hue, so more really does read as more.
    const i = Math.min(RAMP.length - 1, Math.round(((n - 1) / Math.max(peak - 1, 1)) * (RAMP.length - 1)));
    return RAMP[i];
  };
  const lightest = RAMP[RAMP.length - 1];

  node.innerHTML = `
    <figure class="gfx gfx-matrix">
      <figcaption class="gfx-cap">Evidenced capabilities by discipline and employer</figcaption>
      <svg viewBox="0 0 ${W} ${H}" style="max-width:${W}px" role="img"
        aria-label="${CATEGORIES.map((cat, r) => `${cat}: ${cols.map((o, c) => `${o.short} ${counts[r][c]}`).join(', ')}`).join('. ')}.">
        <g class="gfx-head">
          ${cols.map((o, c) => `<text x="${(colX[c] + o.w / 2).toFixed(1)}" y="${HEAD_H - 11}" text-anchor="middle">${esc(o.short)}</text>`).join('')}
        </g>
        ${CATEGORIES.map((cat, r) => `
          <g class="gfx-row" style="--i:${r}">
            <text class="gfx-rowlabel" x="0" y="${HEAD_H + r * ROW_H + 25}">${esc(cat)}</text>
            ${cols.map((o, c) => {
              const n = counts[r][c];
              const fill = shade(n);
              return `<g class="gfx-cell">
                <rect x="${(colX[c] + 3).toFixed(1)}" y="${HEAD_H + r * ROW_H + 3}"
                  width="${(o.w - 6).toFixed(1)}" height="${ROW_H - 6}" rx="5"
                  fill="${fill}"${n ? '' : ' class="is-zero"'} />
                <text x="${(colX[c] + o.w / 2).toFixed(1)}" y="${HEAD_H + r * ROW_H + 25}" text-anchor="middle"
                  class="${n && fill === lightest ? 'on-light' : ''}">${n || '·'}</text>
              </g>`;
            }).join('')}
          </g>`).join('')}
      </svg>
      <p class="gfx-note">Counts of capabilities with a supporting resume line. Certifications are listed separately.</p>
    </figure>`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
