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
    content.projects === 4 && content.education === 1 && content.creds === 5, JSON.stringify(content));
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

  await tap('#recruiter-toggle', () => document.body.classList.contains('recruiter-mode'), 'condensed mode on');
  check(`${P} condensed keeps experience + contact`, await page.evaluate(() =>
    getComputedStyle(document.getElementById('experience')).display !== 'none'
    && getComputedStyle(document.getElementById('contact')).display !== 'none'));
  await tap('#recruiter-toggle', () => !document.body.classList.contains('recruiter-mode'), 'condensed mode off');

  // --- design regressions ---
  const btnH = await page.evaluate(() => [...document.querySelectorAll('.hero-actions .btn')]
    .map((b) => Math.round(b.getBoundingClientRect().height)));
  check(`${P} hero buttons 44-56px`, btnH.every((h) => h >= 44 && h <= 56), JSON.stringify(btnH));

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  // A 320px viewport stacks every grid to one column, so the same content is
  // legitimately taller there. The budget scales with that rather than
  // pretending one number fits both.
  const budget = viewport.width < 360 ? 17000 : 15000;
  check(`${P} page under ${budget}px`, height < budget, `${height}px`);

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
