/**
 * Functional audit. Run against a served copy and the standalone build, at
 * desktop and two mobile widths.
 *
 *   npx http-server -p 8123 -s .
 *   node tools/audit.mjs
 *
 * Checks the things that have actually broken before: a silently dead WebGL
 * layer (reported as a warning, so warnings count as failures here), anchors
 * that resolve nowhere, controls that are unreachable by real taps, and the
 * two measurable design regressions -- page length and uppercase volume.
 */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

const fails = [];
let passed = 0;
const check = (name, cond, detail = '') => {
  if (cond) passed++;
  else fails.push(`${name}${detail ? ' :: ' + detail : ''}`);
};

async function run(label, url, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('console', (m) => {
    if (/error|warning/.test(m.type()) && !/fonts|ERR_CONNECTION_RESET/.test(m.text())) {
      errs.push(m.type() + ': ' + m.text().slice(0, 120));
    }
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(4200);
  const P = `[${label}]`;

  // Instant scrolling for the run. The sheet scrolls smoothly, and a sticky
  // element under a smooth scroll never settles inside Playwright's
  // actionability window: the project card's disclosure toggle timed out while
  // being, by hit test, the topmost element at its own centre. Nothing here
  // asserts smoothness, and instant scrolling makes every position check
  // deterministic rather than a race.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  // Measured on arrival, before this script expands anything: the number that
  // matters is the page a recruiter actually lands on.
  const landingHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  check(`${P} no JS errors or warnings`, errs.length === 0, errs.slice(0, 2).join(' | '));

  const webgl = await page.evaluate(() => ({
    has: document.body.classList.contains('has-webgl'),
    no: document.body.classList.contains('no-webgl'),
  }));
  check(`${P} WebGL backdrop initialised`, webgl.has && !webgl.no, JSON.stringify(webgl));
  check(`${P} loader dismissed`, await page.evaluate(() => document.getElementById('loader').classList.contains('is-done')));
  check(`${P} no horizontal overflow`,
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    String(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)));

  // --- resume content is present ---
  const content = await page.evaluate(() => ({
    roles: document.querySelectorAll('#timeline > *').length,
    bullets: document.querySelectorAll('.role-list li').length,
    projects: document.querySelectorAll('.proj').length,
    gaps: (document.body.innerText.match(/\[(ADD|TODO|INSERT)/g) || []).length,
    caps: document.querySelectorAll('.ev-chip').length,
    education: document.querySelectorAll('.edu-item').length,
    creds: document.querySelectorAll('.cert-item').length,
    method: document.querySelectorAll('.mf-step').length,
    contactTop: document.querySelectorAll('.mast-contact li').length,
  }));
  check(`${P} 3 roles with 12 bullets`, content.roles === 3 && content.bullets === 12, JSON.stringify(content));
  check(`${P} projects, education, credentials present`,
    content.projects === 4 && content.education === 1 && content.creds === 6, JSON.stringify(content));

  // The specific credentials, not just how many: a count passes happily while
  // the wrong certification is on display.
  const creds = await page.evaluate(() => ({
    text: [...document.querySelectorAll('.cert-item')].map((n) => n.innerText.replace(/\s+/g, ' ')),
    pending: [...document.querySelectorAll('.cert-item.is-pending')]
      .map((n) => n.innerText.replace(/\s+/g, ' ')),
  }));
  const credText = creds.text.join(' | ');
  check(`${P} AWS certification listed`, /AWS for SAP Cloud ERP Essentials/.test(credText), credText.slice(0, 120));
  check(`${P} retired certification gone`, !/Intro to SQL/.test(credText));
  check(`${P} PMP shown as in progress, not held`,
    creds.pending.length === 1 && /PMP/.test(creds.pending[0]) && /In progress/.test(creds.pending[0]),
    JSON.stringify(creds.pending));
  check(`${P} contact details in masthead`, content.contactTop >= 3, String(content.contactTop));
  // Brief SS3: placeholders are gone for good. Any reappearance is a defect.
  check(`${P} no placeholder text anywhere`, content.gaps === 0, String(content.gaps));

  // --- links ---
  const badAnchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute('href')).filter((h) => h !== '#' && !document.querySelector(h)));
  check(`${P} all in-page anchors resolve`, badAnchors.length === 0, badAnchors.join(','));

  for (const [id, name] of [['hero-resume', 'resume download'], ['nav-resume', 'nav resume'],
                            ['hero-linkedin', 'LinkedIn'], ['hero-email', 'email']]) {
    const a = await page.evaluate((x) => {
      const n = document.getElementById(x);
      return { hidden: n?.hidden, href: (n?.getAttribute('href') || '').slice(0, 42) };
    }, id);
    check(`${P} ${name} link wired`, !a.hidden && a.href && a.href !== '#', JSON.stringify(a));
  }

  // --- interactions, via real taps so overlays are caught ---
  const tap = async (sel, verify, name) => {
    const h = await page.$(sel);
    if (!h) { check(`${P} ${name}`, false, 'selector missing'); return; }
    await h.scrollIntoViewIfNeeded();
    try {
      await (isMobile ? h.tap({ timeout: 4000 }) : h.click({ timeout: 4000 }));
      await page.waitForTimeout(300);
      check(`${P} ${name}`, await page.evaluate(verify));
    } catch (e) { check(`${P} ${name}`, false, e.message.split('\n')[0].slice(0, 80)); }
  };

  await tap('.stake-btn[data-stake="qa"]',
    () => /QA needs/.test(document.querySelector('.stake-facts dt')?.textContent || ''), 'stakeholder select');
  await tap('.ev-filter[data-cat="AI"]',
    () => document.querySelector('.ev-filter.is-on')?.dataset.cat === 'AI', 'skills filter');
  await tap('.ev-chip', () => !!document.querySelector('.ev-title'), 'capability evidence');
  await tap('.ask-chip', () => !!document.querySelector('.ask-title'), 'ask suggestion');
  await tap('.proj-more summary',
    () => document.querySelector('.proj-more')?.open === true, 'project expands');
  await tap('.sprint-card', () => !/^0 of/.test(document.querySelector('.sprint-readout')?.textContent || '')
    || document.querySelectorAll('.sprint-col')[1]?.querySelectorAll('.sprint-card').length !== 2, 'sprint card advances');
  await tap('.lifecycle-rail a[data-stage="st-ai"]',
    () => !!document.getElementById('st-ai'), 'lifecycle rail navigates');

  // --- traceability: the claim-to-evidence chain, in both directions ---
  await tap('.ev-chip:not(.is-on)', () => {
    const cap = document.querySelector('.ev-chip.is-on')?.dataset.cap;
    return !!cap && !document.getElementById('trace-chain').hidden
      && new URLSearchParams(location.search).get('trace') === cap;
  }, 'capability traces to a bullet');
  check(`${P} traced bullets marked`, await page.evaluate(
    () => document.querySelectorAll('.role-list li.is-traced').length > 0));
  check(`${P} every bullet reports its capabilities`, await page.evaluate(() => {
    const b = [...document.querySelectorAll('.trace-btn')];
    return b.length > 0 && b.every((n) => /^\d+ capabilit/.test(n.textContent.trim()));
  }));
  await tap('.trace-btn', () => document.querySelectorAll('.ev-chip.is-traced').length > 0
    && document.querySelectorAll('.role-list li.is-source').length === 1, 'bullet traces back to capabilities');

  // --- the matrix as a graph: present, framed, and labelled ---
  check(`${P} trace graph live`, await page.evaluate(() => {
    const fig = document.getElementById('trace-graph');
    return !!fig && fig.classList.contains('is-live');
  }));
  check(`${P} trace graph counts stated`, await page.evaluate(
    () => /\d+ achievements · \d+ capabilities · \d+ derived links/.test(
      document.getElementById('tg-counts')?.textContent || '')));
  const tg = await page.evaluate(() => {
    const c = document.getElementById('trace-canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const layer = document.getElementById('tg-tags');
    const shown = !!layer && getComputedStyle(layer).display !== 'none';
    const tags = [...document.querySelectorAll('.tg-tag')].map((t) => {
      const b = t.getBoundingClientRect();
      return { in: b.left >= r.left - 1 && b.right <= r.right + 1, w: Math.round(b.width) };
    });
    return { w: Math.round(r.width), h: Math.round(r.height), drawn: c.width > 0, shown, tags };
  });
  check(`${P} trace graph canvas sized`, tg && tg.drawn && tg.h > 200, JSON.stringify(tg && { w: tg.w, h: tg.h }));
  // Below 400px the standing tags are deliberately off: they need more of the
  // canvas than they leave for the graph. Shown, they must fit.
  check(`${P} trace graph tags fit the canvas`,
    tg && (tg.shown
      ? tg.tags.length >= 9 && tg.tags.every((t) => t.in && t.w > 8)
      : tg.tags.every((t) => t.w === 0)),
    JSON.stringify(tg && { shown: tg.shown, bad: tg.tags.filter((t) => tg.shown ? !t.in : t.w > 0).length }));

  // --- command palette: keyboard only, so desktop only ---
  if (!isMobile) {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(250);
    check(`${P} palette opens on Ctrl-K`, await page.evaluate(
      () => !document.getElementById('palette').hidden
        && document.getElementById('palette-list').children.length > 0));
    await page.keyboard.type('reconcil');
    await page.waitForTimeout(200);
    check(`${P} palette filters`, await page.evaluate(
      () => /Reconcil/i.test(document.getElementById('palette-list').textContent)));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    check(`${P} palette closes and acts`, await page.evaluate(
      () => document.getElementById('palette').hidden
        && !!document.querySelector('.ev-chip.is-on')));
    // Each kind of palette result must actually take you somewhere, activated
    // the way a reader does it: by clicking the row. Capability rows used to
    // close the palette and leave the page exactly where it was, because
    // selecting a chip rebuilds the grid and the detached element was the one
    // being scrolled to. Section rows landed their heading under the sticky
    // nav, which looks identical to nothing having happened.
    const settle = () => page.evaluate(() => new Promise((res) => {
      let last = -1, still = 0;
      const tick = () => {
        const y = Math.round(window.scrollY);
        still = y === last ? still + 1 : 0;
        last = y;
        if (still > 20) return res(y);
        requestAnimationFrame(tick);
      };
      tick();
    }));

    for (const [query, kind] of [['lineage', 'Capability'], ['Regulated', 'Project'], ['Education', 'Section']]) {
      // Start from nothing selected. An earlier check leaves a chip active,
      // and an already-active chip skips the click that rebuilds the grid --
      // which is the exact path that was broken, so testing it selected
      // passes on broken code.
      await page.evaluate(() => {
        const on = document.querySelector('.ev-chip.is-on');
        if (on) on.click();
      });
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle();
      await page.click('#palette-open');
      // Wait for the overlay rather than a fixed pause: a bare timeout here
      // reports the failure one step later, on the row that was never drawn.
      await page.waitForSelector('#palette-input', { state: 'visible', timeout: 5000 });
      await page.fill('#palette-input', query);
      await page.waitForSelector('#palette-list li', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(120);
      const row = await page.evaluate(() => {
        const li = document.querySelector('#palette-list li');
        return li ? li.textContent.replace(/\s+/g, ' ').trim() : null;
      });
      await page.click('#palette-list li');
      const y = await settle();
      const landed = await page.evaluate(() => {
        const navH = document.querySelector('.nav').getBoundingClientRect().height;
        // Something meaningful must be visible below the nav, not behind it.
        return [...document.querySelectorAll('.section-title, .proj-title, .ev-chip.is-on')]
          .some((n) => {
            const r = n.getBoundingClientRect();
            return r.top >= navH && r.top < window.innerHeight * 0.8
              && Number(getComputedStyle(n).opacity) > 0.5;
          });
      });
      check(`${P} palette ${kind} row navigates`, y > 0 && landed,
        JSON.stringify({ row: (row || '').slice(0, 30), y, landed }));
    }
  }

  // A closed overlay must not sit over the page swallowing clicks.
  check(`${P} closed overlays do not block`, await page.evaluate(() => {
    const p = document.getElementById('palette');
    return !!p && p.hidden && getComputedStyle(p).display === 'none';
  }));

  await tap('#recruiter-toggle', () => document.body.classList.contains('recruiter-mode'), 'condensed mode on');
  check(`${P} condensed keeps experience + contact`, await page.evaluate(() =>
    getComputedStyle(document.getElementById('experience')).display !== 'none'
    && getComputedStyle(document.getElementById('contact')).display !== 'none'));
  await tap('#recruiter-toggle', () => !document.body.classList.contains('recruiter-mode'), 'condensed mode off');

  // --- the resume download actually downloads ---
  // Found by class, not by file extension: the standalone build inlines the
  // PDF as a data: URL, so an href ending in .pdf finds nothing there.
  const dl = await page.evaluate(() => {
    const a = document.querySelector('#contact-links .contact-link--file');
    return a && {
      download: a.hasAttribute('download'),
      pdf: /\.pdf$|^data:application\/pdf/i.test(a.getAttribute('href') || ''),
    };
  });
  check(`${P} contact resume link downloads`, !!dl && dl.download && dl.pdf, JSON.stringify(dl));
  const tel = await page.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')]
    .map((n) => n.getAttribute('href')));
  check(`${P} tel: URIs are dialable`,
    tel.length > 0 && tel.every((t) => /^tel:\+?\d+$/.test(t)), JSON.stringify(tel));

  // --- no em dash anywhere in the rendered copy ---
  check(`${P} no em dash in visible text`, await page.evaluate(
    () => !document.body.innerText.includes('\u2014')),
    (await page.evaluate(() => {
      const i = document.body.innerText.indexOf('\u2014');
      return i < 0 ? '' : document.body.innerText.slice(Math.max(0, i - 50), i + 50);
    })));

  // --- background artefacts are present and stay behind the page ---
  check(`${P} backdrop canvas sits behind content`, await page.evaluate(() => {
    const c = document.getElementById('bg-canvas');
    const s = getComputedStyle(c);
    return s.pointerEvents === 'none' && Number(s.zIndex) <= 0;
  }));

  // --- theme material and 3D cards ---
  const theme = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card3d')];
    const lit = cards.filter((n) => {
      const cs = getComputedStyle(n);
      return cs.boxShadow.includes('inset') && cs.backgroundImage.includes('gradient');
    });
    return {
      cards: cards.length,
      lit: lit.length,
      ambient: getComputedStyle(document.body, '::before').backgroundImage.includes('gradient'),
      stray: cards.filter((n) => ['--rx', '--ry'].some((v) => n.style.getPropertyValue(v))).length,
    };
  });
  check(`${P} cards carry the lit material`, theme.cards >= 12 && theme.lit === theme.cards,
    JSON.stringify({ cards: theme.cards, lit: theme.lit }));
  check(`${P} ambient light layer present`, theme.ambient);
  // Nothing should be left mid-tilt when no pointer is on it.
  check(`${P} no card holds stale tilt state`, theme.stray === 0, String(theme.stray));

  if (!isMobile) {
    // A tilt has to happen, release cleanly, and never hold two cards at once.
    const card = await page.$('.outcome');
    await card.scrollIntoViewIfNeeded();
    // The sheet sets scroll-behavior: smooth, so the box read straight after a
    // scrollIntoView is a coordinate the card has already left. Settle first,
    // then measure, then move.
    await page.waitForTimeout(700);
    const r = await card.boundingBox();
    await page.mouse.move(r.x + r.width * 0.25, r.y + r.height * 0.3);
    await page.waitForTimeout(220);
    const on = await page.evaluate(() => {
      const n = document.querySelector('.outcome');
      return {
        tilting: n.classList.contains('is-tilting'),
        rx: n.style.getPropertyValue('--rx'),
        count: document.querySelectorAll('.is-tilting').length,
        transformed: getComputedStyle(n).transform !== 'none',
      };
    });
    check(`${P} card tilts towards the pointer`,
      on.tilting && on.transformed && parseFloat(on.rx) > 0 && on.count === 1, JSON.stringify(on));
    await page.mouse.move(2, 2);
    await page.waitForTimeout(400);
    check(`${P} card releases when the pointer leaves`, await page.evaluate(
      () => document.querySelectorAll('.is-tilting').length === 0
        && !document.querySelector('.outcome').style.getPropertyValue('--rx')));
  }

  // --- every text style clears WCAG AA against what is actually behind it ---
  // Sampled from the composited stack, not from the token values: the card
  // faces are translucent over a gradient, so a token's nominal contrast is
  // not the contrast a reader gets. Raising the card opacity once lightened
  // seven muted-ink styles to 4.48:1.
  const lowContrast = await page.evaluate(() => {
    const lum = ([r, g, b]) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const parse = (v) => (v.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const behind = (n) => {
      const layers = [];
      for (let el = n; el && el !== document.documentElement; el = el.parentElement) {
        const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (!m) continue;
        const parts = m[1].split(',').map(Number);
        const a = parts.length > 3 ? parts[3] : 1;
        if (a > 0.001) { layers.push({ c: parts.slice(0, 3), a }); if (a >= 0.999) break; }
      }
      let base = parse(getComputedStyle(document.body).backgroundColor);
      for (let i = layers.length - 1; i >= 0; i--) {
        base = base.map((v, k) => layers[i].c[k] * layers[i].a + v * (1 - layers[i].a));
      }
      return base;
    };
    const seen = new Set();
    const bad = [];
    for (const n of document.querySelectorAll('p, li, span, dt, dd, h1, h2, h3, a, button, figcaption')) {
      if (n.children.length || n.textContent.trim().length < 3) continue;
      const r = n.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(n);
      const key = cs.color + '|' + cs.fontSize + '|' + (n.className || n.tagName);
      if (seen.has(key)) continue;
      seen.add(key);
      const px = parseFloat(cs.fontSize);
      const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
      const [hi, lo] = [lum(parse(cs.color)), lum(behind(n))].sort((a, b) => b - a);
      const cr = (hi + 0.05) / (lo + 0.05);
      if (cr < (large ? 3 : 4.5)) {
        bad.push({ c: String(n.className || n.tagName).split(' ')[0].slice(0, 18), cr: +cr.toFixed(2) });
      }
    }
    return bad;
  });
  check(`${P} all text clears WCAG AA on its real background`,
    lowContrast.length === 0, JSON.stringify(lowContrast.slice(0, 4)));

  // --- nothing a reader must read may fall under 11px ---
  const tiny = await page.evaluate(() => [...document.querySelectorAll('p, li, span, button, a, dt, dd')]
    .filter((n) => !n.children.length && n.textContent.trim().length > 1
      && n.getBoundingClientRect().height > 0)
    .map((n) => ({ px: +parseFloat(getComputedStyle(n).fontSize).toFixed(2),
                   t: n.textContent.trim().slice(0, 24) }))
    .filter((x) => x.px < 11));
  check(`${P} no visible text under 11px`, tiny.length === 0, JSON.stringify(tiny.slice(0, 4)));

  // --- design regressions ---
  const btnH = await page.evaluate(() => [...document.querySelectorAll('.hero-actions .btn')]
    .map((b) => Math.round(b.getBoundingClientRect().height)));
  check(`${P} hero buttons 44-56px`, btnH.every((h) => h >= 44 && h <= 56), JSON.stringify(btnH));

  // A 320px viewport stacks every grid to one column, so the same content is
  // legitimately taller there. The budget scales with that rather than
  // pretending one number fits both.
  const budget = viewport.width < 360 ? 17000 : 15500;
  check(`${P} landing page under ${budget}px`, landingHeight < budget, `${landingHeight}px`);

  const caps = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter((n) => !n.children.length && n.textContent.trim().length > 2)
    .filter((n) => { const s = getComputedStyle(n); return s.textTransform === 'uppercase' && parseFloat(s.letterSpacing) > 1; }).length);
  check(`${P} uppercase+tracked under 15`, caps < 15, `count=${caps}`);

  await ctx.close();
}

await run('desk', 'http://localhost:8123/', { width: 1440, height: 900 }, false);
await run('mob390', 'http://localhost:8123/', { width: 390, height: 844 }, true);
await run('mob320', 'http://localhost:8123/', { width: 320, height: 640 }, true);
await run('standalone', 'file:///home/user/ai-project/dist/resume-standalone.html', { width: 390, height: 844 }, true);

console.log(`\n=============== FAILURES (${fails.length}) ===============`);
fails.forEach((f) => console.log('  x ' + f));
console.log(`\nPASSED: ${passed}`);
await browser.close();
