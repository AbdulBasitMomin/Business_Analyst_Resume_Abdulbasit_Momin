/**
 * Renders every section from `resume` and wires the 2D interaction layer:
 * scroll reveals, count-up stats, pointer-tilt on cards, and nav state.
 * No content is hardcoded here -- it all comes from data.js.
 */

const SECTIONS = [
  ['about', 'About'],
  ['experience', 'Experience'],
  ['process', 'Process'],
  ['skills', 'Skills'],
  ['projects', 'Highlights'],
  ['deliverables', 'Deliverables'],
  ['education', 'Education'],
];

/** Layer names for the traceability backdrop legend. */
const TRACE_CHAIN = ['Business need', 'Requirement', 'User story', 'Acceptance criteria', 'Test case'];

const el = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

export function renderAll(resume, { isPlaceholder = false } = {}) {
  renderMeta(resume.meta);
  renderNav();
  renderHero(resume);
  renderAbout(resume.about);
  renderExperience(resume.experience);
  renderProcess(resume.process);
  renderDeliverables(resume.deliverables, resume.domains);
  renderSceneLegend();
  renderSkills(resume.skills);
  renderProjects(resume.projects);
  renderEducation(resume.education, resume.certifications, resume.awards);
  renderTestimonials(resume.testimonials);
  renderContact(resume.meta);

  if (isPlaceholder) el('draft-banner').hidden = false;
}

/* ---------- head / chrome ---------- */

function renderMeta(meta) {
  // Keep the location in the tab title -- it matches the static <title> and
  // is what recruiters searching by city actually see.
  document.title = `${meta.name} — ${meta.role}${meta.location ? ` | ${meta.location}` : ''}`;
  el('nav-name').textContent = meta.name;
  el('footer-name').textContent = `© ${new Date().getFullYear()} ${meta.name}`;
}

function renderNav() {
  el('nav-links').innerHTML = SECTIONS.map(
    ([id, label]) => `<a href="#${id}" data-nav="${id}">${label}</a>`
  ).join('');
}

function renderHero(resume) {
  const { meta, stats } = resume;
  el('hero-availability').textContent = meta.availability || '';
  el('hero-role').textContent = meta.role;
  el('hero-tagline').textContent = meta.tagline;

  // Split the name so each character can be animated in independently.
  el('hero-name').innerHTML = meta.name
    .split(' ')
    .map(
      (word) =>
        `<span class="word">${word
          .split('')
          .map((ch, i) => `<span class="char" style="--i:${i}">${esc(ch)}</span>`)
          .join('')}</span>`
    )
    .join(' ');

  const resumeBtn = el('hero-resume');
  if (meta.resumePdf) {
    resumeBtn.href = meta.resumePdf;
    resumeBtn.setAttribute('download', 'Abdulbasit-Momin-Business-Analyst.pdf');
  } else {
    resumeBtn.hidden = true;
  }

  el('stats').innerHTML = (stats || [])
    .map(
      (s) => `<li class="stat reveal">
        <span class="stat-value" data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix || '')}">0</span>
        <span class="stat-label">${esc(s.label)}</span>
      </li>`
    )
    .join('');
}

/* ---------- sections ---------- */

function renderAbout(about) {
  el('about-headline').textContent = about.headline;
  el('about-body').innerHTML = (about.paragraphs || [])
    .map((p) => `<p class="reveal">${esc(p)}</p>`)
    .join('');
}

function renderExperience(roles) {
  el('timeline').innerHTML = (roles || [])
    .map((r, i) => {
      const current = String(r.end).toLowerCase() === 'present';
      return `<article class="tl-item reveal" style="--d:${i * 90}ms">
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
          ${
            r.achievements?.length
              ? `<ul class="tl-list">${r.achievements.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`
              : ''
          }
          ${
            r.tools?.length
              ? `<div class="chips">${r.tools.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`
              : ''
          }
        </div>
      </article>`;
    })
    .join('');
}

function renderSceneLegend() {
  const node = el('scene-legend-chain');
  if (!node) return;
  node.innerHTML = TRACE_CHAIN.map(
    (label, i) => `<span class="chain-node" style="--slot:${i}">${esc(label)}</span>`
  ).join('<span class="chain-arrow">→</span>');
}

function renderProcess(stages) {
  const node = el('process-steps');
  if (!node) return;
  node.innerHTML = (stages || [])
    .map(
      (s, i) => `<li class="process-step reveal" data-step="${i}" style="--slot:${i}; --d:${i * 70}ms">
      <span class="process-index">0${i + 1}</span>
      <div class="process-body">
        <h3 class="process-stage">${esc(s.stage)}</h3>
        <p class="process-blurb">${esc(s.blurb)}</p>
        <div class="chips chips-sm">${(s.artifacts || []).map((a) => `<span class="chip">${esc(a)}</span>`).join('')}</div>
      </div>
    </li>`
    )
    .join('');
}

/** Highlights the step the 3D token is currently parked on. */
export function setActiveStep(index) {
  const steps = document.querySelectorAll('.process-step');
  steps.forEach((n) => n.classList.toggle('is-active', Number(n.dataset.step) === index));
}

function renderDeliverables(deliverables, domains) {
  const grid = el('deliv-grid');
  if (grid) {
    grid.innerHTML = (deliverables || [])
      .map(
        (d, i) => `<li class="deliv-item reveal" style="--d:${i * 35}ms">
        <span class="deliv-tick" aria-hidden="true"></span>${esc(d)}
      </li>`
      )
      .join('');
  }

  const list = el('domain-list');
  if (list) {
    list.innerHTML = (domains || [])
      .map(
        (d, i) => `<div class="domain-item glass reveal" style="--slot:${i}; --d:${i * 70}ms">
        <h3 class="domain-name">${esc(d.name)}</h3>
        <p class="domain-detail">${esc(d.detail)}</p>
      </div>`
      )
      .join('');
  }
}

function renderSkills(groups) {
  el('skill-groups').innerHTML = (groups || [])
    .map(
      (g, gi) => `<div class="skill-group reveal" style="--d:${gi * 80}ms">
      <h3 class="skill-group-title">${esc(g.group)}</h3>
      ${(g.items || [])
        .map(
          (s) => `<div class="bar-row">
            <span class="bar-name">${esc(s.name)}</span>
            <span class="bar-track"><span class="bar-fill" data-level="${Number(s.level) || 0}"></span></span>
          </div>`
        )
        .join('')}
    </div>`
    )
    .join('');
}

function renderProjects(projects) {
  el('projects-grid').innerHTML = (projects || [])
    .map(
      (p, i) => `<article class="card glass tilt reveal" style="--d:${i * 80}ms">
      <h3 class="card-title">${esc(p.name)}</h3>
      <p class="card-body">${esc(p.blurb)}</p>
      ${p.impact ? `<p class="card-impact"><span>Impact</span>${esc(p.impact)}</p>` : ''}
      ${p.tags?.length ? `<div class="chips">${p.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
      ${p.link ? `<a class="card-link" href="${esc(p.link)}" target="_blank" rel="noopener">View →</a>` : ''}
    </article>`
    )
    .join('');
}

function renderEducation(education, certs, awards) {
  el('education-list').innerHTML = (education || [])
    .map(
      (e, i) => `<div class="edu-item glass reveal" style="--d:${i * 80}ms">
      <h3 class="edu-degree">${esc(e.degree)}</h3>
      <p class="edu-school">${esc(e.school)}${e.location ? ` · ${esc(e.location)}` : ''}</p>
      <p class="edu-dates">${esc(e.start)} — ${esc(e.end)}</p>
      ${e.detail ? `<p class="edu-detail">${esc(e.detail)}</p>` : ''}
    </div>`
    )
    .join('');

  const credentials = [
    ...(certs || []).map((c) => ({ ...c, kind: 'cert' })),
    ...(awards || []).map((a) => ({ ...a, kind: 'award' })),
  ];

  el('cert-list').innerHTML = credentials
    .map(
      (c, i) => `<div class="cert-item reveal" style="--d:${i * 60}ms">
      <span class="cert-tick">${c.kind === 'award' ? '★' : '✦'}</span>
      <div>
        ${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener" class="cert-name">${esc(c.name)}</a>` : `<span class="cert-name">${esc(c.name)}</span>`}
        <span class="cert-meta">${esc(c.issuer)}${c.year ? ` · ${esc(c.year)}` : ''}</span>
      </div>
    </div>`
    )
    .join('');
}

function renderTestimonials(items) {
  if (!items?.length) return;
  el('testimonials').hidden = false;
  el('testimonial-grid').innerHTML = items
    .map(
      (t, i) => `<blockquote class="card glass reveal" style="--d:${i * 80}ms">
      <p class="quote">“${esc(t.quote)}”</p>
      <footer class="quote-by">${esc(t.author)}<span>${esc(t.role)}</span></footer>
    </blockquote>`
    )
    .join('');
}

function renderContact(meta) {
  el('contact-sub').textContent = meta.availability || `Reach out to ${meta.name}.`;
  const links = [
    meta.email && { label: 'Email', href: `mailto:${meta.email}`, text: meta.email },
    meta.phone && { label: 'Phone', href: `tel:${meta.phone.replace(/\s/g, '')}`, text: meta.phone },
    meta.linkedin && { label: 'LinkedIn', href: meta.linkedin, text: 'in/abmomin1' },
    meta.website && { label: 'Website', href: meta.website, text: meta.website.replace(/^https?:\/\//, '') },
    meta.github && { label: 'GitHub', href: meta.github, text: 'AbdulBasitMomin' },
  ].filter(Boolean);

  el('contact-links').innerHTML = links
    .map(
      (l) => `<a class="contact-link" href="${esc(l.href)}"${l.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>
        <span class="contact-link-label">${esc(l.label)}</span>
        <span class="contact-link-text">${esc(l.text)}</span>
      </a>`
    )
    .join('');
}

/* ---------- interaction layer ---------- */

/** Reveals elements once, then stops observing them. */
export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  targets.forEach((t) => io.observe(t));
}

/** Animates skill bars to their data-level width when scrolled into view. */
export function initBars() {
  const bars = document.querySelectorAll('.bar-fill');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.style.width = `${entry.target.dataset.level}%`;
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.4 }
  );
  bars.forEach((b) => io.observe(b));
}

/** Count-up for hero stats, eased so it decelerates into the final value. */
export function initCounters({ reducedMotion = false } = {}) {
  const nodes = document.querySelectorAll('.stat-value');
  const run = (node) => {
    const target = Number(node.dataset.count) || 0;
    const suffix = node.dataset.suffix || '';
    if (reducedMotion || !target) {
      node.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = `${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.6 }
  );
  nodes.forEach((n) => io.observe(n));
}

/** Pointer-following 3D tilt. Skipped on touch and under reduced motion. */
export function initTilt({ reducedMotion = false } = {}) {
  if (reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
  const MAX = 7;
  for (const card of document.querySelectorAll('.tilt')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateZ(6px)`;
      card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
      card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  }
}

/**
 * Drives nav state and returns page scroll progress to the WebGL scene.
 * Reads are batched into a rAF so scrolling never triggers sync layout.
 */
export function initScrollSync(onProgress) {
  const nav = el('nav');
  const links = [...document.querySelectorAll('[data-nav]')];
  const ids = links.map((l) => l.dataset.nav);
  let queued = false;

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    const progress = max > 0 ? Math.min(y / max, 1) : 0;
    onProgress(progress);
    nav.classList.toggle('is-stuck', y > 40);
    const bar = el('scroll-bar');
    if (bar) bar.style.transform = `scaleX(${progress})`;

    // Active link = last section whose top has passed the 35% viewport mark.
    const line = y + window.innerHeight * 0.35;
    let active = '';
    for (const id of ids) {
      const node = el(id);
      if (node && node.offsetTop <= line) active = id;
    }
    links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === active));
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
