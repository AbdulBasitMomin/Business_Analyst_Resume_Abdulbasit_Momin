/**
 * Traceability UI, and a command palette.
 *
 * Selecting a capability marks the resume bullets that evidence it and lists
 * the chain in the panel. Going the other way, each bullet reports how many
 * capabilities it evidences and can highlight them. That is the point of the
 * feature: a claim on this page is never more than one click from the line
 * that supports it, in either direction.
 *
 * Any trace is also a URL (?trace=SQL), so a recruiter can send a colleague
 * the evidence for one specific claim rather than the whole page.
 */
import { buildTrace } from './trace.js';
import { caseStudies, capabilities } from './evidence.js';

const el = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let trace = null;
let graph = null;

export function initTrace() {
  trace = buildTrace();

  // Each bullet advertises how many capabilities it evidences.
  for (const b of trace.bullets) {
    const btn = document.querySelector(`[data-trace-bullet="${b.id}"]`);
    if (!btn) continue;
    const n = trace.byBullet.get(b.id).length;
    if (!n) { btn.remove(); continue; }
    btn.textContent = `${n} ${n === 1 ? 'capability' : 'capabilities'}`;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-trace-bullet]');
    if (btn) { traceFromBullet(btn.dataset.traceBullet); return; }
  });

  // Deep link: ?trace=<capability name>
  const wanted = new URLSearchParams(location.search).get('trace');
  if (wanted) {
    const match = capabilities.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
    if (match) activateCapability(match.name);
  }

  initPalette();
}

/** Called by the evidence explorer whenever a capability is selected. */
export function showTrace(capabilityName) {
  graph?.select(capabilityName);
  document.querySelectorAll('.role-list li.is-traced').forEach((n) => n.classList.remove('is-traced'));
  const panel = el('trace-chain');
  if (!panel) return;

  if (!capabilityName) { panel.innerHTML = ''; panel.hidden = true; return; }
  const entry = trace?.byCapability.get(capabilityName);
  if (!entry) { panel.innerHTML = ''; panel.hidden = true; return; }

  entry.bullets.forEach((b) => {
    document.querySelector(`[data-bullet="${b.id}"]`)?.classList.add('is-traced');
  });

  // Keep the URL shareable without adding history entries per click.
  const url = new URL(location.href);
  url.searchParams.set('trace', capabilityName);
  history.replaceState(null, '', url);

  panel.hidden = false;
  panel.innerHTML = `
    <p class="tc-label">Traces to</p>
    ${entry.bullets.length
      ? `<ol class="tc-chain">${entry.bullets.map((b) => `<li>
          <a href="#experience" data-goto-bullet="${b.id}">${esc(b.company)}</a>
          <span>${esc(b.text)}</span>
        </li>`).join('')}</ol>`
      : `<p class="tc-none">No achievement bullet supports this one. It is shown anyway so the gap is visible rather than hidden.</p>`}
    ${entry.projects.length
      ? `<p class="tc-projects">Project: ${entry.projects.map((p) => `<a href="#${esc(p.id)}">${esc(p.title)}</a>`).join(', ')}</p>`
      : ''}`;

  panel.querySelectorAll('[data-goto-bullet]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const node = document.querySelector(`[data-bullet="${a.dataset.gotoBullet}"]`);
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      node?.classList.add('is-flash');
      setTimeout(() => node?.classList.remove('is-flash'), 1200);
    });
  });
}

/**
 * Select a capability the way a click would, from anywhere.
 * The grid is rebuilt whenever the category filter changes, so a chip is
 * always looked up fresh -- a reference held from earlier is detached.
 */
function chipFor(name) {
  const find = () => [...document.querySelectorAll('.ev-chip')].find((c) => c.dataset.cap === name);
  let chip = find();
  if (!chip) {
    // Filtered out of the grid: clear the filter, then look again.
    document.querySelector('.ev-filter[data-cat="All"]')?.click();
    chip = find();
  }
  return chip;
}

export function activateCapability(name) {
  const chip = chipFor(name);
  if (!chip) return;
  if (!chip.classList.contains('is-on')) chip.click();
  chip.scrollIntoView({ block: 'center' });
}

/** The reverse direction: from an achievement to the capabilities it proves. */
function traceFromBullet(id) {
  const b = trace?.bullets.find((x) => x.id === id);
  const names = trace?.byBullet.get(id) || [];
  if (!b) return;

  // Clear the category filter FIRST: it rebuilds the grid, which would drop
  // any class set before it, and could hide the chips being highlighted.
  const all = document.querySelector('.ev-filter[data-cat="All"]');
  if (all && !all.classList.contains('is-on')) all.click();
  document.querySelectorAll('.ev-chip').forEach((c) =>
    c.classList.toggle('is-traced', names.includes(c.dataset.cap)));

  graph?.select(null);
  document.querySelectorAll('.role-list li.is-traced, .role-list li.is-source')
    .forEach((n) => n.classList.remove('is-traced', 'is-source'));
  document.querySelector(`[data-bullet="${id}"]`)?.classList.add('is-source');

  const panel = el('trace-chain');
  if (panel) {
    panel.hidden = false;
    panel.innerHTML = `
      <p class="tc-label">This achievement evidences</p>
      <blockquote class="tc-quote">${esc(b.text)}</blockquote>
      <ul class="tc-caps">${names.map((n) =>
        `<li><button type="button" class="tc-cap" data-cap-jump="${esc(n)}">${esc(n)}</button></li>`).join('')}</ul>`;
    panel.querySelectorAll('[data-cap-jump]').forEach((btn) =>
      btn.addEventListener('click', () => activateCapability(btn.dataset.capJump)));
  }

  el('skills')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/* ==================== command palette ==================== */

/**
 * Cmd/Ctrl-K jumps to any capability, project or section. A recruiter looking
 * for one specific thing should not have to scroll to find it.
 */
function initPalette() {
  const root = el('palette');
  if (!root) return;
  const input = el('palette-input');
  const list = el('palette-list');

  const items = [
    ...capabilities.map((c) => ({
      label: c.name, kind: 'Capability', run: () => activateCapability(c.name),
    })),
    ...caseStudies.map((p) => ({
      label: p.title, kind: 'Project', run: () => el(p.id)?.scrollIntoView({ block: 'start' }),
    })),
    ...[...document.querySelectorAll('main > section[id]')].map((s) => ({
      label: s.querySelector('.section-title')?.textContent?.trim() || s.id,
      kind: 'Section', run: () => s.scrollIntoView({ block: 'start' }),
    })),
  ].filter((i) => i.label);

  let shown = [];
  let cursor = 0;

  const render = (q) => {
    const needle = q.trim().toLowerCase();
    shown = (needle ? items.filter((i) => i.label.toLowerCase().includes(needle)) : items).slice(0, 9);
    cursor = 0;
    list.innerHTML = shown.length
      ? shown.map((i, n) => `<li${n === 0 ? ' class="is-on"' : ''}>
          <span class="pal-kind">${esc(i.kind)}</span>${esc(i.label)}</li>`).join('')
      : '<li class="pal-empty">Nothing matches that.</li>';
  };

  const move = (d) => {
    if (!shown.length) return;
    cursor = (cursor + d + shown.length) % shown.length;
    [...list.children].forEach((n, i) => n.classList.toggle('is-on', i === cursor));
  };

  const open = () => {
    root.hidden = false;
    input.value = '';
    render('');
    input.focus();
  };
  const close = () => { root.hidden = true; input.blur(); };

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); return; }
    if (root.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    if (e.key === 'Enter' && shown[cursor]) { e.preventDefault(); close(); shown[cursor].run(); }
  });

  input.addEventListener('input', () => render(input.value));
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || li.classList.contains('pal-empty')) return;
    const item = shown[[...list.children].indexOf(li)];
    close();
    item?.run();
  });
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  el('palette-open')?.addEventListener('click', open);
}


/* ==================== the matrix as a graph ==================== */

/**
 * Mount the 3D traceability graph. Loaded on demand and entirely optional:
 * if WebGL is missing or the module fails, the figure is removed and the
 * capability chips -- which carry the same information -- are untouched.
 */
export async function initTraceGraph({ reducedMotion = false } = {}) {
  const fig = el('trace-graph');
  const canvas = el('trace-canvas');
  if (!fig || !canvas || !trace) return;

  const label = el('tg-label');
  const tagLayer = el('tg-tags');

  // Standing tags are DOM, positioned by the render loop. Reused nodes rather
  // than re-created: this runs on every frame the graph is moving.
  let tagNodes = [];
  let measured = 0;
  const placeTags = (list) => {
    if (!tagLayer) return;
    if (tagNodes.length !== list.length) {
      tagLayer.innerHTML = list.map((t) => `<span class="tg-tag tg-tag--${t.side}"></span>`).join('');
      tagNodes = [...tagLayer.children];
      list.forEach((t, i) => { tagNodes[i].textContent = t.text; });
    }
    list.forEach((t, i) => {
      const n = tagNodes[i];
      n.style.opacity = t.at.behind ? 0 : 1;
      n.style.transform = `translate(${t.at.x}px, ${t.at.y}px)`
        + (t.side === 'left' ? ' translate(-100%, -50%)' : ' translate(0, -50%)');
    });

    // Report the space the tags really need, once per size change. Only the
    // DOM knows how wide a name renders at this font and viewport. When the
    // tags are hidden (narrow screens) the answer is zero, and the graph
    // should have that room back rather than holding it empty.
    const widest = (side) => Math.max(0, ...list
      .map((t, i) => (t.side === side ? tagNodes[i].getBoundingClientRect().width : 0)));
    const need = widest('left') + widest('right');
    if (Math.abs(need - measured) > 2) {
      measured = need;
      graph?.setTextReserve(need);
    }
  };
  const showLabel = (node, at) => {
    if (!node || !at || at.behind) { label.hidden = true; return; }
    label.hidden = false;
    label.className = `tg-label tg-label--${node.kind}`;
    label.style.transform = `translate(${at.x}px, ${at.y}px)`;
    label.innerHTML = `<strong>${esc(node.label)}</strong><span>${esc(node.sub)}</span>`;
  };

  try {
    const { createTraceGraph } = await import('./tracegraph.js');
    graph = createTraceGraph(canvas, trace, capabilities, {
      reducedMotion,
      onTags: placeTags,
      onPick: ({ type, node, at }) => {
        if (type === 'select') {
          label.hidden = true;
          if (node.kind === 'bullet') {
            const li = document.querySelector(`[data-bullet="${node.id}"]`);
            li?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            traceFromBullet(node.id);
          } else {
            activateCapability(node.cap);
          }
          return;
        }
        showLabel(node, at);
      },
    });

    const c = graph.counts;
    const counts = el('tg-counts');
    if (counts) {
      counts.textContent = `${c.bullets} achievements · ${c.caps} capabilities · `
        + `${c.links} derived links${c.gaps ? ` · ${c.gaps} with no bullet behind them` : ''}`;
    }

    graph.resize();
    new ResizeObserver(() => { measured = 0; graph.resize(); }).observe(canvas);

    // Only spend frames while the graph is actually on screen.
    new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? graph.start() : graph.stop();
    }, { rootMargin: '120px' }).observe(fig);

    fig.classList.add('is-live');
  } catch (err) {
    // Same reasoning as the backdrop: an error, not a warning, because a
    // silent failure here once shipped a blank rectangle that looked deliberate.
    console.error('Trace graph unavailable; the capability list is unaffected.', err);
    fig.remove();
  }
}
