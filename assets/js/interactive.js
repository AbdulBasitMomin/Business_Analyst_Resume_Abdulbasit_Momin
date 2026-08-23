/**
 * The interactive layer: condensed mode, the skills-as-evidence explorer, and
 * the worked user-story example.
 *
 * The interactive sprint board that used to live here was retired along with
 * the guided journey -- on a resume it read as a product demo rather than
 * evidence, and the credentials are the point.
 */
import { capabilities, CATEGORIES, recruiterProfile, caseStudies, projectsFor } from './evidence.js';
import { storyLab } from './journey.js';
import { showTrace } from './traceui.js';

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
          .map((c) => `<li><a href="#${esc(c.id)}">${esc(c.title)}</a> · ${esc(c.org)}</li>`)
          .join('')}</ul>
      </div>
      <p class="rm-note">Full interactive walkthrough is still there. Turn Recruiter Mode off any time.</p>
    </div>`;

  const apply = (on) => {
    document.body.classList.toggle('recruiter-mode', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'Full resume' : 'Condensed';
    panel.hidden = !on;
    // Section offsets change when sections are hidden or shown, so the
    // scroll-driven nav state has to be recalculated.
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
      detail.innerHTML = `<p class="ev-empty">Pick a capability to see where it was actually used: the role, and the line from the resume that supports it.</p>`;
      return;
    }
    const badge = {
      bullet: 'Evidenced by an achievement bullet',
      cert: 'Evidenced by a certification',
      listed: 'Listed in the resume skills section, no achievement bullet',
    }[cap.sourced];

    // Skill -> project -> evidence. The project link is what turns a listed
    // skill into something a recruiter can go and read about.
    const projects = projectsFor(cap);
    detail.innerHTML = `
      <h3 class="ev-title">${esc(cap.name)}</h3>
      <p class="ev-source ev-source--${esc(cap.sourced)}">${esc(badge)}</p>
      ${cap.evidence.length
        ? cap.evidence.map((e) => `<figure class="ev-item">
            <blockquote>${esc(e.quote)}</blockquote>
            <figcaption>${esc(e.role)} · ${esc(e.company)}</figcaption>
          </figure>`).join('')
        : `<p class="ev-empty">No achievement bullet references this directly. Shown here rather than dropped, so the claim stays checkable.</p>`}
      ${projects.length ? `<div class="ev-proof">
        <span class="ev-proof-label">Used on</span>
        <ul>${projects.map((p) => `<li><a href="#${esc(p.id)}">${esc(p.title)}</a></li>`).join('')}</ul>
      </div>` : ''}`;
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
    // Mark the resume bullets this capability traces back to.
    showTrace(activeCap);
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
