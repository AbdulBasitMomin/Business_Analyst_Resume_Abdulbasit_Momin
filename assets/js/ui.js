/**
 * DOM rendering and interaction.
 *
 * The page is a resume first: masthead, summary, experience, skills,
 * projects, education. The business-analysis thinking follows as supporting
 * evidence in one compact "How I work" section, rather than a multi-chapter
 * walkthrough that buried the credentials.
 *
 * All content comes from the data modules -- nothing is hardcoded here.
 */
import { resume } from './data.js';
import { stakeholders, pipeline, ai, uatChain, clarityLadder, board, outcomes } from './journey.js';
import { caseStudies } from './evidence.js';
import { SUGGESTED, answer } from './assistant.js';
import { renderTimelineGraphic, renderCoverageGraphic } from './graphics.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * A dialable tel: URI. Only digits and a leading +, because parentheses and
 * separators are not reliably handled by every dialer.
 */
const telHref = (phone) => {
  const digits = String(phone).replace(/[^\d]/g, '');
  return (String(phone).trim().startsWith('+') ? '+' : '') + digits;
};

const NAV = [
  ['experience', 'Experience'],
  ['skills', 'Proof'],
  ['projects', 'Projects'],
  ['impact', 'Impact'],
  ['method', 'Journey'],
  ['contact', 'Contact'],
];

/** The lifecycle stages, in order, for the in-section rail. */
const STAGES = [
  ['st-problem', '01', 'Problem'],
  ['st-people', '02', 'People'],
  ['st-requirements', '03', 'Requirements'],
  ['st-agile', '04', 'Agile'],
  ['st-data', '05', 'Data'],
  ['st-ai', '06', 'AI'],
  ['st-uat', '07', 'UAT'],
];

export function renderAll() {
  renderMeta();
  renderNav();
  renderMasthead();
  renderSummary();
  renderExperience();
  renderTimelineGraphic(el('gfx-timeline'));
  renderCoverageGraphic(el('gfx-coverage'));
  renderProjects();
  renderEducation();
  renderImpact();
  renderMethod();
  renderAsk();
  renderContact();
}

/* ---------- chrome ---------- */

function renderMeta() {
  const m = resume.meta;
  document.title = `${m.name} | ${m.role} | ${m.location}`;
  el('nav-name').textContent = m.name;
  el('footer-name').textContent = `© ${new Date().getFullYear()} ${m.name}`;
}

function renderNav() {
  el('nav-links').innerHTML = NAV
    .map(([id, label]) => `<a href="#${id}" data-nav="${id}">${label}</a>`).join('');
}

/* ---------- masthead ---------- */

const DIAGRAM_NODES = [
  { label: 'AI', x: 160, y: 26, ai: true },
  { label: 'People', x: 46, y: 62 },
  { label: 'Agile', x: 274, y: 62 },
  { label: 'Data', x: 32, y: 128 },
  { label: 'Systems', x: 288, y: 128 },
  { label: 'Process', x: 160, y: 166 },
];

function renderHeroDiagram() {
  const node = el('hero-diagram');
  if (!node) return;
  const CX = 160, CY = 96;
  node.innerHTML = `<svg viewBox="0 0 320 192" aria-hidden="true">
    <g class="hd-links">${DIAGRAM_NODES
      .map((n, i) => `<line style="--i:${i}" x1="${CX}" y1="${CY}" x2="${n.x}" y2="${n.y}" />`).join('')}</g>
    ${DIAGRAM_NODES.map((n, i) => `<g class="hd-node${n.ai ? ' is-ai' : ''}" style="--i:${i}">
      <circle cx="${n.x}" cy="${n.y}" r="5.5" />
      <text x="${n.x}" y="${n.y - 11}" text-anchor="middle">${esc(n.label)}</text>
    </g>`).join('')}
    <g class="hd-core"><circle cx="${CX}" cy="${CY}" r="15" /><text x="${CX}" y="${CY + 4}" text-anchor="middle">BA</text></g>
  </svg>`;
}

function renderMasthead() {
  const m = resume.meta;
  el('hero-availability').textContent = m.availability || '';
  el('hero-name').textContent = m.name;

  // Contact details belong at the top of a resume, not only at the bottom.
  el('mast-contact').innerHTML = [
    m.location && { t: m.location },
    m.email && { t: m.email, href: `mailto:${m.email}` },
    m.phone && { t: m.phone, href: `tel:${telHref(m.phone)}` },
    m.linkedin && { t: 'linkedin.com/in/abmomin1', href: m.linkedin },
    // Print only: on paper this is the way back to the projects and the
    // evidence explorer, which the printed copy leaves out.
    m.portfolio && { t: m.portfolio, href: `https://${m.portfolio}`, printOnly: true },
  ].filter(Boolean)
    .map((c) => `<li${c.printOnly ? ' class="print-only"' : ''}>${
      c.href ? `<a href="${esc(c.href)}">${esc(c.t)}</a>` : esc(c.t)}</li>`)
    .join('');

  const wire = (id, href, download) => {
    const a = el(id);
    if (!a) return;
    if (!href) { a.hidden = true; return; }
    a.href = href;
    if (download) a.setAttribute('download', 'Abdulbasit-Momin-Business-Analyst.pdf');
  };
  wire('hero-resume', m.resumePdf, true);
  wire('nav-resume', m.resumePdf, true);
  wire('hero-linkedin', m.linkedin);
  wire('hero-email', m.email ? `mailto:${m.email}` : '');

  el('stats').innerHTML = (resume.stats || [])
    .map((s) => `<li class="stat">
      <span class="stat-value" data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix || '')}">0</span>
      <span class="stat-label">${esc(s.label)}</span>
      ${s.source ? `<span class="stat-source">${esc(s.source)}</span>` : ''}
    </li>`).join('');

  renderHeroDiagram();
}

function renderSummary() {
  const a = resume.about;
  el('summary-body').innerHTML =
    `<p class="summary-lead">${esc(a.headline)}</p>` +
    a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
}

/* ---------- experience: expanded, the way a resume reads ---------- */

function renderExperience() {
  el('timeline').innerHTML = (resume.experience || [])
    .map((r, ri) => {
      const current = String(r.end).toLowerCase() === 'present';
      return `<article class="role reveal">
        <header class="role-head">
          <div>
            <h3 class="role-title">${esc(r.role)}</h3>
            <p class="role-org">${esc(r.company)}${r.location ? ` · ${esc(r.location)}` : ''}</p>
          </div>
          <span class="role-dates${current ? ' is-current' : ''}">${esc(r.start)} – ${esc(r.end)}</span>
        </header>
        ${r.summary ? `<p class="role-summary">${esc(r.summary)}</p>` : ''}
        ${r.achievements?.length ? `<ul class="role-list">${r.achievements.map((x, bi) =>
          `<li data-bullet="${ri}-${bi}">${esc(x)}<button type="button" class="trace-btn" data-trace-bullet="${ri}-${bi}"
            aria-label="Show the capabilities this achievement evidences"></button></li>`).join('')}</ul>` : ''}
        ${r.tools?.length ? `<p class="role-tools"><span>Tools</span>${r.tools.map(esc).join(' · ')}</p>` : ''}
      </article>`;
    }).join('');
}

/* ---------- projects: problem / action / result, detail on demand ---------- */

function renderProjects() {
  const pick = (c, key) => c.stages.find((s) => s.k === key)?.v || '';
  el('case-list').innerHTML = caseStudies
    .map((c) => `<article class="proj reveal" id="${esc(c.id)}">
      <header class="proj-head">
        <div>
          <h3 class="proj-title">${esc(c.title)}</h3>
          <p class="proj-org">${esc(c.org)} · ${esc(c.role)}</p>
        </div>
        <span class="proj-dates">${esc(c.period)}</span>
      </header>
      <dl class="proj-par">
        <div><dt>Problem</dt><dd>${esc(pick(c, 'Problem'))}</dd></div>
        <div><dt>What I did</dt><dd>${esc(pick(c, 'Solution'))}</dd></div>
        <div><dt>Result</dt><dd>${esc(pick(c, 'Impact'))}</dd></div>
      </dl>
      <p class="proj-tools">${c.tags.map(esc).join(' · ')}</p>
      <details class="proj-more">
        <summary>Full breakdown</summary>
        <ol class="proj-stages">
          ${c.stages.map((s) => `<li><span>${esc(s.k)}</span>${esc(s.v)}</li>`).join('')}
        </ol>
      </details>
    </article>`).join('');
}

function renderEducation() {
  el('education-list').innerHTML = (resume.education || [])
    .map((e) => `<div class="edu-item">
      <h3 class="edu-degree">${esc(e.degree)}</h3>
      <p class="edu-school">${esc(e.school)}</p>
      <p class="edu-dates">${esc(e.start)} – ${esc(e.end)}</p>
    </div>`).join('');

  const creds = [
    ...(resume.certifications || []).map((c) => ({ ...c, kind: 'cert' })),
    ...(resume.awards || []).map((a) => ({ ...a, kind: 'award' })),
  ];
  el('cert-list').innerHTML = creds
    .map((c) => `<div class="cert-item${c.status ? ' is-pending' : ''}">
      <span class="cert-tick">${c.status ? '◌' : c.kind === 'award' ? '★' : '✦'}</span>
      <div>
        <span class="cert-name">${esc(c.name)}${
          c.status ? `<span class="cert-status">${esc(c.status)}</span>` : ''}</span>
        <span class="cert-meta">${esc(c.issuer)}</span>
      </div>
    </div>`).join('');
}

/* ---------- business impact ---------- */

function renderImpact() {
  const node = el('impact-list');
  if (!node) return;
  node.innerHTML = outcomes.map((o) => `<li class="outcome">
    <span class="outcome-metric">${esc(o.metric)}</span>
    <span class="outcome-unit">${esc(o.unit)}</span>
    <p class="outcome-what">${esc(o.what)}</p>
    <span class="outcome-org">${esc(o.org)}</span>
  </li>`).join('');
}

/* ---------- how I work: the lifecycle ---------- */

function renderMethod() {
  // In-section rail, so the reader always knows where in the lifecycle they are.
  const rail = el('lifecycle-rail');
  if (rail) {
    rail.innerHTML = STAGES
      .map(([id, num, label]) => `<a href="#${id}" data-stage="${id}"><span>${num}</span>${esc(label)}</a>`)
      .join('');
  }

  // 01 Problem: ambiguity to requirement.
  el('clarity-chain').innerHTML = ['Current state', 'Root cause', 'Gap', 'Requirement']
    .map((step) => `<li class="flow-step">${esc(step)}</li>`)
    .join('<li class="flow-arrow" aria-hidden="true">→</li>');

  renderSprint();
  // The five-stage loop, drawn from the resume's own verbs.
  el('method-flow').innerHTML = (resume.process || [])
    .map((s, i) => `<li class="mf-step">
      <span class="mf-num">${String(i + 1).padStart(2, '0')}</span>
      <h4 class="mf-name">${esc(s.stage)}</h4>
      <p class="mf-note">${esc(s.blurb)}</p>
    </li>`).join('');

  el('deliv-grid').innerHTML = (resume.deliverables || [])
    .map((d) => `<li>${esc(d)}</li>`).join('');

  const flow = (items, key) => items
    .map((x) => `<li class="flow-step" title="${esc(x.note)}">${esc(x[key])}</li>`)
    .join('<li class="flow-arrow" aria-hidden="true">→</li>');

  el('uat-chain').innerHTML = flow(uatChain, 'step');
  el('pipeline').innerHTML = flow(pipeline, 'stage');

  renderStakeholders();

  // 06 AI: the loop, ending on a human decision.
  el('ai-loop').innerHTML = ai.loop
    .map((x) => `<li class="flow-step" title="${esc(x.note)}">${esc(x.step)}</li>`)
    .join('<li class="flow-arrow" aria-hidden="true">→</li>');

  el('ai-stance').textContent = ai.stance;
  el('ai-practices').innerHTML = ai.practices
    .map((p) => `<li><strong>${esc(p.name)}</strong>: ${esc(p.note)}</li>`).join('');
  el('ai-grounding').textContent = ai.grounding;
}

/**
 * 04 Agile: a compact sprint flow. Cards advance a column on click, so the
 * mechanic is demonstrable without asserting anything about a real sprint --
 * the copy above it says as much.
 */
function renderSprint() {
  const node = el('sprint');
  if (!node) return;
  const cols = ['Backlog', 'Sprint', 'In progress', 'Review', 'UAT', 'Done'];
  const cards = board.cards.map((c, i) => ({ ...c, col: i < 2 ? 1 : 0 }));

  const draw = () => {
    const done = cards.filter((c) => c.col === cols.length - 1).length;
    node.innerHTML = `
      <p class="sprint-goal"><span>Sprint goal</span>Status taxonomy defined, mapped and testable.</p>
      <div class="sprint-board">
        ${cols.map((name, ci) => `<div class="sprint-col">
          <h5>${esc(name)}<span>${cards.filter((c) => c.col === ci).length}</span></h5>
          ${cards.filter((c) => c.col === ci).map((c) => `
            <button type="button" class="sprint-card" data-id="${esc(c.id)}"
              aria-label="${esc(c.title)}, in ${esc(name)}. Activate to advance.">
              <span>${esc(c.type)}</span>${esc(c.title)}
            </button>`).join('')}
        </div>`).join('')}
      </div>
      <p class="sprint-readout" role="status" aria-live="polite">${done} of ${cards.length} done. Tap a card to advance it.</p>`;
  };

  node.addEventListener('click', (e) => {
    const b = e.target.closest('.sprint-card');
    if (!b) return;
    const card = cards.find((c) => c.id === b.dataset.id);
    if (card && card.col < cols.length - 1) { card.col += 1; draw(); }
  });
  draw();
}

function renderStakeholders() {
  const list = el('stake-list');
  const detail = el('stake-detail');
  if (!list || !detail) return;

  list.innerHTML = stakeholders
    .map((s) => `<li><button type="button" class="stake-btn" data-stake="${esc(s.id)}">${esc(s.name)}</button></li>`)
    .join('');

  const show = (id) => {
    const s = stakeholders.find((x) => x.id === id) || stakeholders[0];
    detail.innerHTML = `<dl class="stake-facts">
      <div><dt>${esc(s.name)} needs</dt><dd>${esc(s.needs)}</dd></div>
      <div><dt>Provides</dt><dd>${esc(s.provides)}</dd></div>
      <div><dt>Decides</dt><dd>${esc(s.decides)}</dd></div>
    </dl>`;
    list.querySelectorAll('.stake-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.stake === s.id));
  };
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.stake-btn');
    if (b) show(b.dataset.stake);
  });
  show(stakeholders[0].id);
}

/* ---------- ask ---------- */

function renderAsk() {
  const form = el('ask-form');
  const input = el('ask-input');
  const out = el('ask-answer');
  const sugg = el('ask-suggested');
  if (!form || !input || !out) return;

  sugg.innerHTML = SUGGESTED.map((q) => `<button type="button" class="ask-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('');

  const render = (a) => {
    if (!a) { out.innerHTML = ''; return; }
    out.innerHTML = `<div class="ask-card${a.unmatched ? ' is-unmatched' : ''}">
      <h3 class="ask-title">${esc(a.title)}</h3>
      ${a.lines?.length ? `<ul class="ask-lines">${a.lines.map((l) => l ? `<li>${esc(l)}</li>` : '<li class="ask-gap"></li>').join('')}</ul>` : ''}
      ${a.proof?.length ? `<div class="proof-table">
        <div class="proof-head"><span>Skill</span><span>Project</span><span>Evidence</span></div>
        ${a.proof.map((p) => `<div class="proof-row${p.weak ? ' is-weak' : ''}">
          <span class="proof-skill">${esc(p.skill)}</span>
          <span class="proof-project">${esc(p.project)}</span>
          <span class="proof-evidence">${esc(p.evidence)}</span>
        </div>`).join('')}
      </div>` : ''}
      ${a.sources?.length ? `<p class="ask-sources">Sources: ${a.sources.map(esc).join(' · ')}</p>` : ''}
    </div>`;
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); render(answer(input.value)); });
  sugg.addEventListener('click', (e) => {
    const b = e.target.closest('.ask-chip');
    if (!b) return;
    input.value = b.dataset.q;
    render(answer(b.dataset.q));
  });
}

function renderContact() {
  const m = resume.meta;
  el('contact-sub').textContent = `${m.name}, Business Analyst in ${m.location}. ${m.availability}`;
  const links = [
    m.email && { label: 'Email', href: `mailto:${m.email}`, text: m.email },
    m.phone && { label: 'Phone', href: `tel:${telHref(m.phone)}`, text: m.phone },
    m.linkedin && { label: 'LinkedIn', href: m.linkedin, text: 'in/abmomin1' },
    m.resumePdf && {
      label: 'Resume', href: m.resumePdf, text: 'Download PDF',
      file: 'Abdulbasit-Momin-Business-Analyst.pdf',
    },
  ].filter(Boolean);
  el('contact-links').innerHTML = links
    .map((l) => `<a class="contact-link magnetic${l.file ? ' contact-link--file' : ''}" href="${esc(l.href)}"${
      l.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}${
      l.file ? ` download="${esc(l.file)}"` : ''}>
      <span class="contact-link-label">${esc(l.label)}</span>
      <span class="contact-link-text">${esc(l.text)}</span>
    </a>`).join('');
}

/* ==================== interaction ==================== */

export function initReveal() {
  // Mark up the things worth revealing here rather than in the markup, so the
  // animation layer stays out of the content templates.
  document.querySelectorAll('.section-title, .section-lede').forEach((n) => n.classList.add('reveal'));
  for (const sel of ['.role', '.proj', '.mf-step', '.edu-item', '.cert-item', '.ev-chip', '.stat']) {
    document.querySelectorAll(sel).forEach((n, i) => {
      n.classList.add('reveal');
      // Cap the stagger so a long list never waits on a long queue.
      n.style.setProperty('--stagger', String(Math.min(i, 8)));
    });
  }

  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  targets.forEach((t) => io.observe(t));
}

export function initCounters({ reducedMotion = false } = {}) {
  const nodes = document.querySelectorAll('.stat-value');
  const run = (node) => {
    const target = Number(node.dataset.count) || 0;
    const suffix = node.dataset.suffix || '';
    if (reducedMotion || !target) { node.textContent = `${target}${suffix}`; return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1100, 1);
      node.textContent = `${Math.round(target * (1 - Math.pow(1 - p, 3)))}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      run(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  nodes.forEach((n) => io.observe(n));
}

/** Small pull toward the cursor on primary actions. Pointer devices only. */
export function initMagnetic({ reducedMotion = false } = {}) {
  if (reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
  for (const b of document.querySelectorAll('.magnetic')) {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.transform = `translate(${dx * 5}px, ${dy * 5}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  }
}

/** Nav state, progress bar, and page progress for the backdrop. */
export function initScrollSync(onProgress) {
  const nav = el('nav');
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const bar = el('scroll-bar');
  const stageLinks = [...document.querySelectorAll('[data-stage]')];
  let queued = false;

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    const p = max > 0 ? Math.min(y / max, 1) : 0;
    onProgress(p);
    nav.classList.toggle('is-stuck', y > 30);
    if (bar) bar.style.transform = `scaleX(${p})`;

    const line = y + window.innerHeight * 0.3;
    let active = '';
    for (const s of document.querySelectorAll('main > section[id]')) {
      if (s.offsetTop <= line) active = s.id;
    }
    navLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === active));

    let stage = '';
    for (const [id] of STAGES) {
      const n = document.getElementById(id);
      if (n && n.offsetTop <= line) stage = id;
    }
    stageLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.stage === stage));
  };
  const onScroll = () => { if (queued) return; queued = true; requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/**
 * Light the opening paragraph up as it is read.
 *
 * Each character gets its index and the paragraph gets the position of the
 * reveal front, so this writes a single custom property per frame and the
 * stylesheet computes two hundred opacities from it. Writing each character's
 * opacity from JavaScript is the obvious version and costs two hundred style
 * writes a frame for the same picture.
 *
 * Characters are wrapped, not replaced: innerText is unchanged, so selecting
 * and copying the paragraph still yields the sentence, and anything reading
 * the page as text sees no difference.
 */
export function initLitText({ reducedMotion = false } = {}) {
  const node = document.querySelector('.summary-lead');
  if (!node || reducedMotion) return;

  const text = node.textContent;
  node.textContent = '';
  const frag = document.createDocumentFragment();
  [...text].forEach((ch, i) => {
    // Spaces stay bare: a wrapped space cannot break a line, so wrapping them
    // turns the paragraph into one unbreakable string.
    if (ch === ' ') { frag.append(' '); return; }
    const span = document.createElement('span');
    span.className = 'lit-char';
    span.style.setProperty('--i', String(i));
    span.textContent = ch;
    frag.append(span);
  });
  node.append(frag);

  const total = text.length;
  let queued = false;
  const update = () => {
    queued = false;
    const r = node.getBoundingClientRect();
    // Fully lit by the time the paragraph's top reaches a third of the screen.
    const span = r.height + window.innerHeight * 0.55;
    const travelled = window.innerHeight * 0.85 - r.top;
    const p = Math.max(0, Math.min(1, travelled / span));
    node.style.setProperty('--p', String(Math.round(p * total * 1.15)));
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}
