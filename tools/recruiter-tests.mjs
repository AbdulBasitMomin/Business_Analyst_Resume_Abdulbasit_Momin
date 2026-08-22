/**
 * The twelve recruiter tests from the design brief, run as code.
 *
 *   npx http-server -p 8123 -s .
 *   node tools/recruiter-tests.mjs
 *
 * Each test states what a recruiter must be able to do, and fails loudly if
 * they cannot. "Within N seconds" is interpreted as "without scrolling and
 * without a click", which is the measurable version of the claim.
 */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const URL = 'http://localhost:8123/';
const results = [];
const record = (n, name, pass, detail = '') => results.push({ n, name, pass, detail });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

/* ---------------- desktop pass ---------------- */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load' });

await page.waitForTimeout(4200);

/** Is the element inside the first viewport, visible, and non-empty? */
const aboveFold = (sel) => page.evaluate((s) => {
  const n = document.querySelector(s);
  if (!n) return false;
  const r = n.getBoundingClientRect();
  const cs = getComputedStyle(n);
  return r.top >= 0 && r.top < window.innerHeight && r.height > 0
    && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && n.textContent.trim().length > 0;
}, sel);

// 1 — who is this, in 5 seconds
const t1 = {
  name: await aboveFold('.hero-name'),
  title: await aboveFold('.hero-role'),
  location: await page.evaluate(() => /Toronto/.test(document.querySelector('.mast-contact')?.textContent || '')),
};
record(1, 'Understand who I am without scrolling', t1.name && t1.title && t1.location, JSON.stringify(t1));

// 2 — resume in one click
const t2 = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a[download], a[href$=".pdf"]')];
  const visible = links.filter((a) => {
    const r = a.getBoundingClientRect();
    return r.top >= 0 && r.top < window.innerHeight && r.height > 0 && !a.hidden;
  });
  return { total: links.length, aboveFold: visible.length, hrefs: visible.map((a) => a.getAttribute('href')?.slice(0, 24)) };
});
record(2, 'Resume reachable in one click from the top', t2.aboveFold >= 1, JSON.stringify(t2));

// 3 — strongest capabilities, fast
const t3 = await page.evaluate(() => ({
  chips: document.querySelectorAll('.ev-chip').length,
  categories: document.querySelectorAll('.ev-filter').length,
}));
record(3, 'Capabilities are browsable and categorised', t3.chips >= 30 && t3.categories >= 6, JSON.stringify(t3));

// 4/5/6/7 — evidence for a named skill, via the assistant
async function askProof(n, label, query, mustMention) {
  await page.fill('#ask-input', query);
  await page.click('#ask-form button[type="submit"]');
  await page.waitForTimeout(320);
  const r = await page.evaluate(() => ({
    title: document.querySelector('.ask-title')?.textContent || '',
    rows: document.querySelectorAll('.proof-row').length,
    text: document.querySelector('.ask-card')?.textContent || '',
    hasProject: [...document.querySelectorAll('.proof-project')].some((p) => p.textContent.trim().length > 2),
  }));
  const ok = r.rows > 0 && r.hasProject && mustMention.some((m) => r.text.includes(m));
  record(n, label, ok, `${r.title} · ${r.rows} proof rows`);
}
await askProof(4, 'Evidence for SQL: skill, project and quote', 'Where have you used SQL?', ['Power BI dashboards using SQL']);
await askProof(5, 'Evidence for Agile', 'How have you used Agile?', ['backlog', 'Backlog']);
await askProof(6, 'Evidence for UAT', 'Show me your UAT experience', ['UAT end to end', 'defect']);
await askProof(7, 'AI capabilities are explained and evidenced', 'How have you used AI?', ['rubric', 'rubrics']);

// 8 — actual experience
const t8 = await page.evaluate(() => ({
  roles: document.querySelectorAll('#timeline > *').length,
  bullets: document.querySelectorAll('.role-list li').length,
  dated: [...document.querySelectorAll('.role-dates')].every((d) => /\d{4}/.test(d.textContent)),
}));
record(8, 'Real experience: roles, bullets and dates', t8.roles === 3 && t8.bullets === 12 && t8.dated, JSON.stringify(t8));

// 9 — business impact
const t9 = await page.evaluate(() => ({
  outcomes: document.querySelectorAll('.outcome').length,
  attributed: [...document.querySelectorAll('.outcome-org')].every((o) => o.textContent.trim().length > 2),
}));
record(9, 'Business impact is stated and attributed', t9.outcomes >= 5 && t9.attributed, JSON.stringify(t9));

// 12 — every claim is defensible
const t12 = await page.evaluate(() => {
  const body = document.body.innerText;
  return {
    placeholders: (body.match(/\[(ADD|TODO|INSERT)/g) || []).length,
    metricsWithoutSource: [...document.querySelectorAll('.stat')].filter((s) => !s.querySelector('.stat-source')).length,
    illustrativeLabels: document.querySelectorAll('.illustrative').length,
  };
});
record(12, 'No placeholders; metrics sourced; illustrative content labelled',
  t12.placeholders === 0 && t12.metricsWithoutSource === 0 && t12.illustrativeLabels >= 2, JSON.stringify(t12));
await ctx.close();

/* ---------------- 10 — mobile widths ---------------- */
const widths = [320, 375, 390, 430, 768];
const mob = [];
for (const w of widths) {
  const c = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 700, hasTouch: w < 700 });
  const p = await c.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(3600);
  const r = await p.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    resumeVisible: [...document.querySelectorAll('a[download]')].some((a) => a.getBoundingClientRect().height > 0),
    minFont: Math.min(...[...document.querySelectorAll('p, li, span')]
      .filter((n) => n.textContent.trim().length > 8)
      .map((n) => parseFloat(getComputedStyle(n).fontSize))),
  }));
  mob.push({ w, ...r });
  await c.close();
}
record(10, 'Mobile: no overflow, resume visible, text >= 11px',
  mob.every((m) => m.overflow <= 1 && m.resumeVisible && m.minFont >= 11),
  JSON.stringify(mob));

/* ---------------- 11 — works with no 3D at all ---------------- */
const noJs = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
const np = await noJs.newPage();
await np.goto('file:///home/user/ai-project/dist/resume-standalone.html', { waitUntil: 'load' });
await np.waitForTimeout(4600);
const t11 = await np.evaluate(() => ({
  name: (document.querySelector('.hero-name')?.textContent || '').trim(),
  roles: document.querySelectorAll('#timeline > *').length,
  bullets: document.querySelectorAll('.role-list li').length,
  outcomes: document.querySelectorAll('.outcome').length,
  diagram: !!document.querySelector('.hero-diagram svg'),
  loaderGone: (() => { const l = document.getElementById('loader'); const s = getComputedStyle(l); return s.visibility === 'hidden' || Number(s.opacity) < 0.05; })(),
}));
record(11, 'Fully usable with JS and 3D disabled (2D diagram still shown)',
  !!t11.name && t11.roles === 3 && t11.bullets === 12 && t11.outcomes >= 5 && t11.diagram && t11.loaderGone,
  JSON.stringify(t11));
await noJs.close();
await browser.close();

/* ---------------- report ---------------- */
console.log('\n============ RECRUITER TESTS ============');
for (const r of results.sort((a, b) => a.n - b.n)) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${String(r.n).padStart(2)}. ${r.name}`);
  if (!r.pass) console.log(`        ${r.detail}`);
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exitCode = failed.length ? 1 : 0;
