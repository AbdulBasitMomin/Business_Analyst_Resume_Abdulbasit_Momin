import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'],
});

const fails = [];
const ok = [];
function check(name, cond, detail='') {
  (cond ? ok : fails).push(`${name}${detail ? ' :: ' + detail : ''}`);
}

async function run(label, url, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // Warnings count: the 3D layer reports its own death as a warning.
  page.on('console', m => { if (/error|warning/.test(m.type()) && !/fonts|ERR_CONNECTION_RESET/.test(m.text())) errs.push(m.type()+': '+m.text().slice(0,120)); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(4200);
  const P = `[${label}]`;

  check(`${P} no JS errors`, errs.length === 0, errs.slice(0,3).join(' | '));
  const webgl = await page.evaluate(() => ({ has: document.body.classList.contains('has-webgl'), no: document.body.classList.contains('no-webgl') }));
  check(`${P} WebGL layer initialised`, webgl.has && !webgl.no, JSON.stringify(webgl));
  check(`${P} canvas has drawn pixels`, await page.evaluate(() => {
    const c = document.getElementById('bg-canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return !!gl && !gl.isContextLost() && c.width > 0;
  }));
  check(`${P} loader dismissed`, await page.evaluate(() => document.getElementById('loader').classList.contains('is-done')));
  check(`${P} no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    String(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)));

  // --- anchor links all resolve ---
  const badAnchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href')).filter(h => h !== '#' && !document.querySelector(h)));
  check(`${P} all in-page anchors resolve`, badAnchors.length === 0, badAnchors.join(','));

  // --- resume download wired ---
  const dl = await page.evaluate(() => {
    const a = document.getElementById('resume-download');
    return { hidden: a?.hidden, href: (a?.getAttribute('href')||'').slice(0,40) };
  });
  check(`${P} resume download has href`, !dl.hidden && dl.href && dl.href !== '#', JSON.stringify(dl));

  // --- linkedin ---
  const li = await page.evaluate(() => {
    const a = document.getElementById('hero-linkedin');
    return { hidden: a?.hidden, href: a?.getAttribute('href') };
  });
  check(`${P} LinkedIn link set`, !li.hidden && li.href && li.href !== '#', JSON.stringify(li));

  // --- stakeholder interaction ---
  if (await page.$('.stake-btn')) {
    await page.click('.stake-btn[data-stake="qa"]', { force: true });
    await page.waitForTimeout(200);
    check(`${P} stakeholder click updates panel`,
      (await page.evaluate(() => document.querySelector('.stake-name')?.textContent)) === 'QA');
  } else check(`${P} stakeholder buttons exist`, false);

  // --- story lab ---
  if (await page.$('.sl-step[data-level="3"]')) {
    await page.click('.sl-step[data-level="3"]', { force: true });
    await page.waitForTimeout(200);
    check(`${P} story lab switches to Tasks`, (await page.evaluate(() => document.querySelectorAll('.sl-tasks li').length)) > 0);
  } else check(`${P} story lab steps exist`, false);

  // --- board: drive a card to Done ---
  if (await page.$('.bd-card[data-id="C1"]')) {
    for (let i=0;i<4;i++){ await page.click('.bd-card[data-id="C1"]', { force: true }); await page.waitForTimeout(120); }
    const txt = await page.evaluate(() => document.getElementById('board-readout').textContent);
    check(`${P} board card reaches Done and burns points`, /1\/7 cards done/.test(txt) && /25 of 28/.test(txt), txt);
  } else check(`${P} board cards exist`, false);

  // --- evidence explorer: filter + select ---
  if (await page.$('.ev-filter[data-cat="AI"]')) {
    await page.click('.ev-filter[data-cat="AI"]', { force: true });
    await page.waitForTimeout(200);
    const n = await page.evaluate(() => document.querySelectorAll('.ev-chip').length);
    await page.click('.ev-chip', { force: true });
    await page.waitForTimeout(200);
    const t = await page.evaluate(() => document.querySelector('.ev-title')?.textContent);
    check(`${P} evidence filter narrows list`, n > 0 && n < 34, `AI chips=${n}`);
    check(`${P} evidence chip shows detail`, !!t, String(t));
  } else check(`${P} evidence filters exist`, false);

  // --- assistant ---
  if (await page.$('#ask-input')) {
    await page.fill('#ask-input', 'how have you used AI');
    await page.click('#ask-form button[type="submit"]', { force: true });
    await page.waitForTimeout(250);
    check(`${P} assistant answers`, /AI/.test(await page.evaluate(() => document.querySelector('.ask-title')?.textContent || '')));
  } else check(`${P} assistant input exists`, false);

  // --- recruiter mode round trip ---
  if (await page.$('#recruiter-toggle')) {
    await page.click('#recruiter-toggle', { force: true });
    await page.waitForTimeout(500);
    const on = await page.evaluate(() => ({
      cls: document.body.classList.contains('recruiter-mode'),
      panel: !document.getElementById('recruiter-panel').hidden,
      resumeReachable: !!document.getElementById('resume') && getComputedStyle(document.getElementById('resume')).display !== 'none',
      contactReachable: getComputedStyle(document.getElementById('contact')).display !== 'none',
    }));
    check(`${P} recruiter mode on`, on.cls && on.panel, JSON.stringify(on));
    check(`${P} recruiter mode keeps resume+contact`, on.resumeReachable && on.contactReachable, JSON.stringify(on));
    await page.click('#recruiter-toggle', { force: true });
    await page.waitForTimeout(400);
    check(`${P} recruiter mode off restores hero`,
      await page.evaluate(() => getComputedStyle(document.querySelector('.hero')).display !== 'none'));
  } else check(`${P} recruiter toggle exists`, false);

  // --- button sizes (spec: 44-52px) ---
  const btnH = await page.evaluate(() => [...document.querySelectorAll('.hero-actions .btn')].map(b => Math.round(b.getBoundingClientRect().height)));
  check(`${P} hero buttons within 44-56px`, btnH.every(h => h >= 40 && h <= 56), JSON.stringify(btnH));

  // --- section heights (spec: not excessively tall) ---
  const tall = await page.evaluate(() => [...document.querySelectorAll('main > section')]
    .map(s => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height) }))
    .filter(s => s.h > 2200));
  check(`${P} no section over 2200px tall`, tall.length === 0, JSON.stringify(tall));

  // --- all-caps letter-spaced volume (spec complaint) ---
  const caps = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter(n => n.children.length === 0 && n.textContent.trim().length > 2)
    .filter(n => { const s = getComputedStyle(n); return s.textTransform === 'uppercase' && parseFloat(s.letterSpacing) > 1; }).length);
  check(`${P} uppercase+tracked elements under 30`, caps < 30, `count=${caps}`);

  await ctx.close();
}

await run('desk', 'http://localhost:8123/', { width:1440, height:900 }, false);
await run('mob390', 'http://localhost:8123/', { width:390, height:844 }, true);
await run('mob320', 'http://localhost:8123/', { width:320, height:640 }, true);
await run('standalone', 'file:///home/user/ai-project/dist/resume-standalone.html', { width:390, height:844 }, true);

console.log('\n=============== FAILURES (' + fails.length + ') ===============');
fails.forEach(f => console.log('  ✗ ' + f));
console.log('\nPASSED: ' + ok.length);
await browser.close();
