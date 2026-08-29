import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const T = process.argv[2];
const res = []; const bad = [];
const ck = (n, ok, d) => { res.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); if (!ok) bad.push(n); };

// Two composited frames 700ms apart. Screenshots rather than drawImage off the
// canvas: without preserveDrawingBuffer that reads back blank, which looks
// exactly like a scene that is not animating.
const sample = async (p) => {
  const clip = { x: 700, y: 250, width: 600, height: 380 };
  const a = await p.screenshot({ clip });
  await p.waitForTimeout(700);
  const b = await p.screenshot({ clip });
  return { a, b, same: a.equals(b) };
};

{
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: GL });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  await p.goto(T, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const s = await sample(p);
  ck('scene animates by default', !s.same);
  ck('no <video> left on the page', (await p.locator('video').count()) === 0);
  ck('no cloudfront reference in the bundle', !(await p.content()).includes('cloudfront'));
  ck('canvas is hidden from assistive tech', await p.locator('canvas').getAttribute('aria-hidden') === 'true');
  await b.close();
}
{
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: GL });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await p.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  await p.goto(T, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const s = await sample(p);
  ck('reduced motion: holds a still frame', s.same, s.same ? '' : 'frames differ');
  await b.close();
}
{
  // No WebGL at all: the page must still be complete and readable.
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-webgl', '--disable-webgl2'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(T, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  const txt = await p.evaluate(() => document.body.innerText);
  ck('no WebGL: page still renders its content', txt.includes('MOMIN') && txt.includes('DOWNLOAD RESUME'));
  ck('no WebGL: no uncaught error', errs.length === 0, errs.join(' | '));
  await b.close();
}
console.log(res.join('\n'));
console.log(`\n${res.length - bad.length}/${res.length} passed`);
if (bad.length) process.exit(1);
