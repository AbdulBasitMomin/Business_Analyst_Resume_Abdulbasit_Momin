/**
 * DOM rendering and the 2D interaction layer.
 *
 * Every section renders from the data modules -- no content is hardcoded here.
 * Structure mirrors the journey: hero, the nine chapters, then experience,
 * cases, evidence, impact, finale, ask, resume, contact.
 */
import { resume } from './data.js';
import {
  problemInputs, discoveryMethods, stakeholders, elicitation, requirementTypes,
  clarityLadder, board, pipeline, dataControls, ai, uatChain, impact, convergence,
} from './journey.js';
import { caseStudies } from './evidence.js';
import { SUGGESTED, answer } from './assistant.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NAV = [
  ['ch-problem', 'Journey'],
  ['experience', 'Experience'],
  ['cases', 'Cases'],
  ['evidence', 'Capabilities'],
  ['ch-impact', 'Impact'],
  ['resume', 'Resume'],
];

/** Named for the hero legend: what the visitor is about to travel through. */
const SYSTEM_CHAIN = ['Problem', 'Stakeholders', 'Requirements', 'Delivery', 'Data', 'AI', 'Validation', 'Impact'];

export function renderAll() {
  renderMeta();
  renderNav();
  renderRail();
  renderHero();
  renderProblem();
  renderStakeholders();
  renderRequirements();
  renderBoardExtras();
  renderPipeline();
  renderAI();
  renderUAT();
  renderExperience();
  renderCases();
  renderImpact();
  renderFinale();
  renderAsk();
  renderATS();
  renderContact();
}

/* ---------- chrome ---------- */

function renderMeta() {
  const m = resume.meta;
  document.title = `${m.name} | Business Analyst | AI, Data & Agile`;
  el('nav-name').textContent = m.name;
  el('footer-name').textContent = `© ${new Date().getFullYear()} ${m.name}`;
}

function renderNav() {
  el('nav-links').innerHTML = NAV
    .map(([id, label]) => `<a href="#${id}" data-nav="${id}">${label}</a>`)
    .join('');
}

/** Chapter rail, built from the sections actually present in the document. */
function renderRail() {
  const rail = el('rail');
  if (!rail) return;
  const items = [...document.querySelectorAll('main section[id]')]
    .map((s) => ({
      id: s.id,
      num: s.querySelector('.section-num')?.textContent?.trim(),
      title: s.querySelector('.section-title')?.textContent?.trim(),
    }))
    .filter((s) => s.num && s.title);

  rail.innerHTML = items
    .map((s) => `<a class="rail-item" href="#${esc(s.id)}" data-rail="${esc(s.id)}">
      <span class="rail-num">${esc(s.num)}</span>
      <span class="rail-label">${esc(s.title)}</span>
    </a>`)
    .join('');
}

function renderHero() {
  const m = resume.meta;
  el('hero-availability').textContent = m.availability || '';
  el('hero-name').innerHTML = m.name
    .split(' ')
    .map((word) => `<span class="word">${word.split('').map((ch, i) =>
      `<span class="char" style="--i:${i}">${esc(ch)}</span>`).join('')}</span>`)
    .join(' ');

  const li = el('hero-linkedin');
  if (m.linkedin) li.href = m.linkedin;
  else li.hidden = true;

  el('stats').innerHTML = (resume.stats || [])
    .map((s) => `<li class="stat reveal">
      <span class="stat-value" data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix || '')}">0</span>
      <span class="stat-label">${esc(s.label)}</span>
    </li>`).join('');

  el('scene-legend-chain').innerHTML = SYSTEM_CHAIN
    .map((label) => `<span class="chain-node">${esc(label)}</span>`)
    .join('<span class="chain-arrow">→</span>');
}

/* ---------- 01 problem ---------- */

function renderProblem() {
  el('problem-inputs').innerHTML = problemInputs
    .map((p, i) => `<li class="chaos-item reveal" style="--d:${i * 45}ms">${esc(p)}</li>`).join('');
  el('discovery-methods').innerHTML = discoveryMethods
    .map((d, i) => `<div class="method-card glass reveal" style="--d:${i * 70}ms">
      <h3 class="method-name">${esc(d.name)}</h3>
      <p class="method-note">${esc(d.note)}</p>
    </div>`).join('');
}

/* ---------- 02 stakeholders ---------- */

function renderStakeholders() {
  const list = el('stake-list');
  const detail = el('stake-detail');
  if (!list || !detail) return;

  list.innerHTML = `<li class="stake-hub">Business Analyst</li>` + stakeholders
    .map((s) => `<li><button type="button" class="stake-btn" data-stake="${esc(s.id)}">${esc(s.name)}</button></li>`)
    .join('');

  const show = (id) => {
    const s = stakeholders.find((x) => x.id === id) || stakeholders[0];
    detail.innerHTML = `
      <h3 class="stake-name">${esc(s.name)}</h3>
      <dl class="stake-facts">
        <div><dt>Needs</dt><dd>${esc(s.needs)}</dd></div>
        <div><dt>Provides</dt><dd>${esc(s.provides)}</dd></div>
        <div><dt>Decides</dt><dd>${esc(s.decides)}</dd></div>
      </dl>`;
    list.querySelectorAll('.stake-btn').forEach((b) =>
      b.classList.toggle('is-on', b.dataset.stake === s.id));
  };

  // Pointer and keyboard both work: hover previews, click/focus commits.
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.stake-btn');
    if (b) show(b.dataset.stake);
  });
  list.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.stake-btn');
    if (b) show(b.dataset.stake);
  });
  list.addEventListener('focusin', (e) => {
    const b = e.target.closest('.stake-btn');
    if (b) show(b.dataset.stake);
  });

  show(stakeholders[0].id);
  el('elicitation').innerHTML = elicitation.map((x) => `<li class="chip">${esc(x)}</li>`).join('');
}

/* ---------- 03 requirements ---------- */

function renderRequirements() {
  el('clarity-ladder').innerHTML = clarityLadder
    .map((step, i) => `<li class="ladder-step reveal" style="--d:${i * 90}ms"><span>${esc(step)}</span></li>`)
    .join('');
  el('requirement-types').innerHTML = requirementTypes
    .map((r, i) => `<div class="req-card reveal" style="--d:${i * 45}ms">
      <h3 class="req-name">${esc(r.name)}</h3>
      <p class="req-note">${esc(r.note)}</p>
    </div>`).join('');
  el('deliv-grid').innerHTML = (resume.deliverables || [])
    .map((d, i) => `<li class="deliv-item reveal" style="--d:${i * 30}ms">
      <span class="deliv-tick" aria-hidden="true"></span>${esc(d)}
    </li>`).join('');
}

/* ---------- 05 delivery ---------- */

function renderBoardExtras() {
  el('ceremonies').innerHTML = board.ceremonies
    .map((c, i) => `<div class="ceremony glass reveal" style="--d:${i * 60}ms">
      <h3 class="ceremony-name">${esc(c.name)}</h3>
      <p class="ceremony-note">${esc(c.note)}</p>
    </div>`).join('');
  el('retro').innerHTML = board.retro
    .map((r, i) => `<div class="retro-col reveal" style="--d:${i * 70}ms">
      <h3 class="retro-head">${esc(r.heading)}</h3>
      <ul>${r.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>`).join('');
}

/* ---------- 06 data ---------- */

function renderPipeline() {
  el('pipeline').innerHTML = pipeline
    .map((p, i) => `<li class="pipe-step reveal" style="--d:${i * 55}ms">
      <span class="pipe-index">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="pipe-stage">${esc(p.stage)}</h3>
      <p class="pipe-note">${esc(p.note)}</p>
    </li>`).join('');
  el('data-controls').innerHTML = dataControls.map((c) => `<li class="chip">${esc(c)}</li>`).join('');
}

/* ---------- 07 AI ---------- */

function renderAI() {
  el('ai-stance').textContent = ai.stance;
  el('ai-loop').innerHTML = ai.loop
    .map((s, i) => `<li class="ai-step reveal" style="--d:${i * 60}ms">
      <span class="ai-index">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="ai-step-name">${esc(s.step)}</h3>
      <p class="ai-step-note">${esc(s.note)}</p>
    </li>`).join('');
  el('ai-practices').innerHTML = ai.practices
    .map((p, i) => `<div class="ai-practice glass reveal" style="--d:${i * 60}ms">
      <h3 class="ai-practice-name">${esc(p.name)}</h3>
      <p class="ai-practice-note">${esc(p.note)}</p>
    </div>`).join('');
  el('ai-grounding').innerHTML = `${esc(ai.grounding)}<br /><span class="ai-transfer">${esc(ai.transfer)}</span>`;
}

/* ---------- 08 validation ---------- */

function renderUAT() {
  el('uat-chain').innerHTML = uatChain
    .map((u, i) => `<li class="uat-step reveal" style="--d:${i * 50}ms">
      <span class="uat-index">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="uat-name">${esc(u.step)}</h3>
      <p class="uat-note">${esc(u.note)}</p>
    </li>`).join('');
}

/* ---------- 09 experience ---------- */

function renderExperience() {
  el('timeline').innerHTML = (resume.experience || [])
    .map((r, i) => {
      const current = String(r.end).toLowerCase() === 'present';
      return `<article class="tl-item reveal" style="--d:${i * 80}ms">
        <div class="tl-marker"><span class="tl-dot${current ? ' is-live' : ''}"></span></div>
        <div class="tl-card glass tilt">
          <header class="tl-head">
            <div>
              <h3 class="tl-role">${esc(r.role)}</h3>
              <p class="tl-company">${esc(r.company)}${r.location ? ` · ${esc(r.location)}` : ''}</p>
            </div>
            <span class="tl-dates${current ? ' is-current' : ''}">${esc(r.start)} — ${esc(r.end)}</span>
          </header>
          ${r.summary ? `<p class="tl-summary">${esc(r.summary)}</p>` : ''}
          ${r.achievements?.length ? `<ul class="tl-list">${r.achievements.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
          ${r.tools?.length ? `<div class="chips">${r.tools.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
        </div>
      </article>`;
    }).join('');
}

/* ---------- 10 case studies ---------- */

function renderCases() {
  el('case-list').innerHTML = caseStudies
    .map((c, i) => `<details class="case glass reveal" id="${esc(c.id)}" style="--d:${i * 70}ms"${i === 0 ? ' open' : ''}>
      <summary class="case-summary">
        <span class="case-org">${esc(c.org)}</span>
        <h3 class="case-title">${esc(c.title)}</h3>
        <span class="case-period">${esc(c.period)}</span>
        <div class="chips chips-sm">${c.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      </summary>
      <ol class="case-stages">
        ${c.stages.map((s) => {
          const gap = s.v.includes('[ADD');
          return `<li class="case-stage${gap ? ' is-gap' : ''}">
            <span class="case-n">${esc(s.n)}</span>
            <span class="case-k">${esc(s.k)}</span>
            <span class="case-v">${esc(s.v)}</span>
          </li>`;
        }).join('')}
      </ol>
    </details>`).join('');
}

/* ---------- 12 impact ---------- */

function renderImpact() {
  el('impact-grid').innerHTML = impact
    .map((m, i) => `<li class="impact-card glass reveal" style="--d:${i * 60}ms">
      <span class="impact-value">${esc(m.value)}</span>
      <span class="impact-label">${esc(m.label)}</span>
      <p class="impact-note">${esc(m.note)}</p>
    </li>`).join('');
}

function renderFinale() {
  el('converge').innerHTML = convergence
    .map((c, i) => `<li class="converge-item reveal" style="--d:${i * 80}ms">${esc(c)}</li>`).join('');
}

/* ---------- 13 ask ---------- */

function renderAsk() {
  const form = el('ask-form');
  const input = el('ask-input');
  const out = el('ask-answer');
  const sugg = el('ask-suggested');
  if (!form || !input || !out) return;

  sugg.innerHTML = SUGGESTED
    .map((q) => `<button type="button" class="ask-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('');

  const render = (a) => {
    if (!a) { out.innerHTML = ''; return; }
    out.innerHTML = `<div class="ask-card${a.unmatched ? ' is-unmatched' : ''}">
      <h3 class="ask-title">${esc(a.title)}</h3>
      <ul class="ask-lines">${a.lines.map((l) => l ? `<li>${esc(l)}</li>` : '<li class="ask-gap"></li>').join('')}</ul>
      ${a.sources?.length ? `<p class="ask-sources">Sources: ${a.sources.map((s) => esc(s)).join(' · ')}</p>` : ''}
    </div>`;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    render(answer(input.value));
  });
  sugg.addEventListener('click', (e) => {
    const b = e.target.closest('.ask-chip');
    if (!b) return;
    input.value = b.dataset.q;
    render(answer(b.dataset.q));
  });
}

/* ---------- 14 resume (ATS) ---------- */

function renderATS() {
  const m = resume.meta;
  const block = (h, body) => `<section class="ats-block"><h3>${esc(h)}</h3>${body}</section>`;

  el('ats').innerHTML = `
    <header class="ats-head">
      <h2>${esc(m.name)}</h2>
      <p>${esc(m.role)} — ${esc(m.location)}</p>
      <p>${esc(m.email)} · ${esc(m.phone)} · ${esc(m.linkedin)}</p>
    </header>
    ${block('Professional summary', `<p>${esc(resume.about.headline)}</p>${resume.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}`)}
    ${block('Experience', (resume.experience || []).map((r) => `
      <div class="ats-role">
        <h4>${esc(r.role)} — ${esc(r.company)}${r.location ? `, ${esc(r.location)}` : ''}</h4>
        <p class="ats-dates">${esc(r.start)} – ${esc(r.end)}</p>
        <ul>${(r.achievements || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>`).join(''))}
    ${block('Skills', `<p>${(resume.skills || []).flatMap((g) => g.items.map((i) => i.name)).map(esc).join(', ')}</p>`)}
    ${block('Projects', caseStudies.map((c) => `<p><strong>${esc(c.title)}</strong> — ${esc(c.org)}, ${esc(c.period)}</p>`).join(''))}
    ${block('Education', (resume.education || []).map((e) => `<p>${esc(e.degree)} — ${esc(e.school)}, ${esc(e.start)}–${esc(e.end)}</p>`).join(''))}
    ${block('Certifications', `<ul>${(resume.certifications || []).map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join('')}${(resume.awards || []).map((a) => `<li>Award: ${esc(a.name)} — ${esc(a.issuer)}</li>`).join('')}</ul>`)}
  `;

  const dl = el('resume-download');
  if (m.resumePdf) {
    dl.href = m.resumePdf;
    dl.setAttribute('download', 'Abdulbasit-Momin-Business-Analyst.pdf');
  } else {
    dl.hidden = true;
  }
  el('resume-print')?.addEventListener('click', () => window.print());
}

/* ---------- contact ---------- */

function renderContact() {
  const m = resume.meta;
  el('contact-sub').textContent = `${m.name} — Business Analyst, ${m.location}. ${m.availability}`;
  const links = [
    m.email && { label: 'Email', href: `mailto:${m.email}`, text: m.email },
    m.linkedin && { label: 'LinkedIn', href: m.linkedin, text: 'in/abmomin1' },
    m.resumePdf && { label: 'Resume', href: m.resumePdf, text: 'Download PDF' },
    m.github && { label: 'GitHub', href: m.github, text: 'AbdulBasitMomin' },
  ].filter(Boolean);
  el('contact-links').innerHTML = links
    .map((l) => `<a class="contact-link magnetic" href="${esc(l.href)}"${l.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>
      <span class="contact-link-label">${esc(l.label)}</span>
      <span class="contact-link-text">${esc(l.text)}</span>
    </a>`).join('');
}

/* ==================== interaction ==================== */

export function initReveal() {
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
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
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
      const p = Math.min((now - start) / 1300, 1);
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

export function initTilt({ reducedMotion = false } = {}) {
  if (reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
  const MAX = 6;
  for (const card of document.querySelectorAll('.tilt')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateZ(5px)`;
      card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
      card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }
}

/** Magnetic buttons: a small pull toward the cursor. Pointer devices only. */
export function initMagnetic({ reducedMotion = false } = {}) {
  if (reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
  for (const b of document.querySelectorAll('.magnetic')) {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.transform = `translate(${dx * 7}px, ${dy * 7}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  }
}

/**
 * Drives nav state, the chapter rail and the scroll bar, and reports page
 * progress to the WebGL journey. Reads are batched into one rAF.
 */
export function initScrollSync(onProgress) {
  const nav = el('nav');
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const railLinks = [...document.querySelectorAll('[data-rail]')];
  const railIds = new Set(railLinks.map((l) => l.dataset.rail));
  const bar = el('scroll-bar');
  let queued = false;

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    const p = max > 0 ? Math.min(y / max, 1) : 0;
    onProgress(p);
    nav.classList.toggle('is-stuck', y > 40);
    if (bar) bar.style.transform = `scaleX(${p})`;

    const line = y + window.innerHeight * 0.35;
    let active = '';
    let activeRail = '';
    for (const s of document.querySelectorAll('main section[id]')) {
      if (s.offsetTop > line) continue;
      active = s.id;
      // Sections without a chapter number are absent from the rail; tracking
      // them here would blank the highlight instead of holding the last one.
      if (railIds.has(s.id)) activeRail = s.id;
    }
    navLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === active));
    railLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.rail === activeRail));
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
