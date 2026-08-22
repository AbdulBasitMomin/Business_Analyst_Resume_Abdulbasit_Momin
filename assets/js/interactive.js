/**
 * The interactive layer: the parts a recruiter actually operates.
 *
 * Recruiter Mode, the skills-as-evidence explorer, the user-story lab, and a
 * delivery board whose burndown responds to the visitor's own moves. That last
 * choice is deliberate: a burndown showing "Sprint 01" history would be
 * fabricated data. Driving it from clicks demonstrates the mechanic without
 * asserting anything about past sprints.
 */
import { capabilities, CATEGORIES, recruiterProfile, caseStudies } from './evidence.js';
import { storyLab, board } from './journey.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ==================== Recruiter Mode ==================== */

const STORE_KEY = 'ba-resume-recruiter-mode';

export function initRecruiterMode() {
  const toggle = el('recruiter-toggle');
  const panel = el('recruiter-panel');
  if (!toggle || !panel) return;

  panel.innerHTML = `
    <div class="rm-inner">
      <p class="rm-eyebrow">30-second profile</p>
      <h2 class="rm-head">${esc(recruiterProfile.headline)}</h2>
      <dl class="rm-facts">
        <div><dt>Experience</dt><dd>${esc(recruiterProfile.years)}</dd></div>
        <div><dt>Location</dt><dd>${esc(recruiterProfile.location)}</dd></div>
      </dl>
      <div class="rm-block">
        <h3>Core skills</h3>
        <ul class="rm-chips">${recruiterProfile.core.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
      <div class="rm-block">
        <h3>Key results</h3>
        <ul class="rm-results">${recruiterProfile.results.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      </div>
      <div class="rm-block">
        <h3>Top projects</h3>
        <ul class="rm-results">${recruiterProfile.topCases
          .map((id) => caseStudies.find((c) => c.id === id))
          .filter(Boolean)
          .map((c) => `<li><a href="#${esc(c.id)}">${esc(c.title)}</a> — ${esc(c.org)}</li>`)
          .join('')}</ul>
      </div>
      <p class="rm-note">Full interactive walkthrough is still there — turn Recruiter Mode off any time.</p>
    </div>`;

  const apply = (on) => {
    document.body.classList.toggle('recruiter-mode', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'Full experience' : 'Recruiter mode';
    panel.hidden = !on;
    // Section offsets all change when chapters are hidden or shown, so the
    // scroll-driven nav/rail state has to be recalculated.
    window.dispatchEvent(new Event('resize'));
  };

  let on = false;
  try {
    on = localStorage.getItem(STORE_KEY) === '1';
  } catch { /* storage blocked; default off */ }
  // A deep link wins over the stored preference.
  if (location.hash === '#recruiter' || new URLSearchParams(location.search).get('mode') === 'recruiter') on = true;
  apply(on);

  toggle.addEventListener('click', () => {
    on = !on;
    apply(on);
    try { localStorage.setItem(STORE_KEY, on ? '1' : '0'); } catch { /* ignore */ }
    if (on) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==================== Skills as evidence ==================== */

export function initEvidence() {
  const filters = el('evidence-filters');
  const grid = el('evidence-grid');
  const detail = el('evidence-detail');
  if (!filters || !grid || !detail) return;

  let activeCat = 'All';
  let activeCap = null;

  filters.innerHTML = ['All', ...CATEGORIES]
    .map((c) => `<button type="button" class="ev-filter${c === 'All' ? ' is-on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join('');

  function renderGrid() {
    const list = capabilities.filter((c) => activeCat === 'All' || c.cat === activeCat);
    grid.innerHTML = list
      .map((c) => `<button type="button" class="ev-chip${c.name === activeCap ? ' is-on' : ''}"
        data-cap="${esc(c.name)}" aria-describedby="evidence-detail">${esc(c.name)}${
        c.sourced === 'listed' ? '<span class="ev-flag" title="Listed in the resume skills section, with no supporting achievement bullet">listed</span>' : ''
      }</button>`)
      .join('');
    filters.querySelectorAll('.ev-filter').forEach((b) =>
      b.classList.toggle('is-on', b.dataset.cat === activeCat));
  }

  function renderDetail() {
    const cap = capabilities.find((c) => c.name === activeCap);
    if (!cap) {
      detail.innerHTML = `<p class="ev-empty">Pick a capability to see where it was actually used — role, and the line from the resume that supports it.</p>`;
      return;
    }
    const badge = {
      bullet: 'Evidenced by an achievement bullet',
      cert: 'Evidenced by a certification',
      listed: 'Listed in the resume skills section — no achievement bullet',
    }[cap.sourced];

    detail.innerHTML = `
      <h3 class="ev-title">${esc(cap.name)}</h3>
      <p class="ev-source ev-source--${esc(cap.sourced)}">${esc(badge)}</p>
      ${cap.evidence.length
        ? cap.evidence.map((e) => `<figure class="ev-item">
            <blockquote>${esc(e.quote)}</blockquote>
            <figcaption>${esc(e.role)} · ${esc(e.company)}</figcaption>
          </figure>`).join('')
        : `<p class="ev-empty">No achievement bullet references this directly. Shown here rather than dropped, so the claim stays checkable.</p>`}`;
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.ev-filter');
    if (!btn) return;
    activeCat = btn.dataset.cat;
    renderGrid();
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.ev-chip');
    if (!btn) return;
    activeCap = btn.dataset.cap === activeCap ? null : btn.dataset.cap;
    renderGrid();
    renderDetail();
  });

  renderGrid();
  renderDetail();
}

/* ==================== User story lab ==================== */

export function initStoryLab() {
  const root = el('story-lab');
  if (!root) return;

  const LEVELS = [
    { key: 'epic', label: 'Epic' },
    { key: 'story', label: 'User story' },
    { key: 'criteria', label: 'Acceptance criteria' },
    { key: 'tasks', label: 'Tasks' },
  ];
  let level = 1;

  function body() {
    const k = LEVELS[level].key;
    if (k === 'epic') return `<p class="sl-text">${esc(storyLab.epic)}</p>`;
    if (k === 'story') return `<p class="sl-text sl-quote">${esc(storyLab.story)}</p>`;
    if (k === 'criteria') {
      return `<ul class="sl-gwt">${storyLab.criteria.map((c) => `<li>
        <span><em>Given</em> ${esc(c.given)}</span>
        <span><em>When</em> ${esc(c.when)}</span>
        <span><em>Then</em> ${esc(c.then)}</span>
      </li>`).join('')}</ul>`;
    }
    return `<ul class="sl-tasks">${storyLab.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
  }

  function render() {
    root.innerHTML = `
      <div class="sl-ladder" role="tablist" aria-label="Story breakdown level">
        ${LEVELS.map((l, i) => `<button type="button" role="tab" class="sl-step${i === level ? ' is-on' : ''}"
          aria-selected="${i === level}" data-level="${i}">${esc(l.label)}</button>`).join('<span class="sl-arrow" aria-hidden="true">→</span>')}
      </div>
      <div class="sl-panel glass" role="tabpanel">${body()}</div>
      <div class="sl-meta">
        <div class="sl-meta-col">
          <h4>Context</h4>
          <dl>${storyLab.meta.map((m) => `<div><dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd></div>`).join('')}</dl>
        </div>
        <div class="sl-meta-col">
          <h4>Edge cases</h4>
          <ul>${storyLab.edgeCases.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>
      </div>`;
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.sl-step');
    if (!btn) return;
    level = Number(btn.dataset.level);
    render();
  });

  render();
}

/* ==================== Delivery board + live burndown ==================== */

export function initBoard() {
  const root = el('board-columns');
  const chart = el('burndown');
  const readout = el('board-readout');
  if (!root) return;

  const cols = board.columns;
  const DONE = cols.length - 1;
  // Working copy so the source data stays immutable.
  const cards = board.cards.map((c) => ({ ...c, col: c.id === 'C1' || c.id === 'C2' ? 1 : 0 }));
  const total = cards.reduce((n, c) => n + c.points, 0);
  /** Remaining points after each visitor move -- the actual series. */
  const history = [total];

  function remaining() {
    return cards.reduce((n, c) => (c.col === DONE ? n : n + c.points), 0);
  }

  function renderBoard() {
    root.innerHTML = cols
      .map((name, ci) => `<div class="bd-col" data-col="${ci}">
        <h4 class="bd-col-head">${esc(name)}<span>${cards.filter((c) => c.col === ci).length}</span></h4>
        <ul class="bd-list">${cards.filter((c) => c.col === ci).map((c) => `
          <li><button type="button" class="bd-card" data-id="${esc(c.id)}"
            aria-label="${esc(c.title)}, ${c.points} points, in ${esc(name)}. Activate to advance.">
            <span class="bd-type">${esc(c.type)}</span>
            <span class="bd-title">${esc(c.title)}</span>
            <span class="bd-pts">${c.points}</span>
          </button></li>`).join('')}</ul>
      </div>`)
      .join('');

    const done = cards.filter((c) => c.col === DONE).length;
    if (readout) {
      readout.textContent = `${done}/${cards.length} cards done · ${remaining()} of ${total} points remaining`;
    }
  }

  /**
   * Burndown: remaining points over moves. Two series, so a legend is present
   * and both are direct-labelled; ideal is a straight reference line.
   */
  function renderChart() {
    if (!chart) return;
    const W = 320, H = 130, PAD = 26;
    const steps = Math.max(history.length - 1, 1);
    const x = (i) => PAD + (i / Math.max(steps, 1)) * (W - PAD * 2);
    const y = (v) => H - PAD - (v / Math.max(total, 1)) * (H - PAD * 2);

    const actual = history.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const ideal = `${x(0)},${y(total)} ${x(steps)},${y(0)}`;

    chart.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
        aria-label="Burndown: ${remaining()} of ${total} points remaining after ${history.length - 1} moves.">
        <line class="bd-axis" x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" />
        <line class="bd-axis" x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" />
        <polyline class="bd-ideal" points="${ideal}" />
        <polyline class="bd-actual" points="${actual}" />
        ${history.map((v, i) => `<circle class="bd-dot" cx="${x(i)}" cy="${y(v)}" r="3"><title>Move ${i}: ${v} points remaining</title></circle>`).join('')}
        <text class="bd-lbl" x="${PAD}" y="${PAD - 8}">${total}</text>
        <text class="bd-lbl" x="${PAD - 6}" y="${H - PAD + 4}" text-anchor="end">0</text>
      </svg>
      <p class="bd-legend">
        <span class="bd-key bd-key--actual">Actual</span>
        <span class="bd-key bd-key--ideal">Ideal</span>
      </p>`;
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.bd-card');
    if (!btn) return;
    const card = cards.find((c) => c.id === btn.dataset.id);
    if (!card || card.col >= DONE) return;
    card.col += 1;
    history.push(remaining());
    renderBoard();
    renderChart();
  });

  renderBoard();
  renderChart();
}
