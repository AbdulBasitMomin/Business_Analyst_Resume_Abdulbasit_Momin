import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
let bad = 0;
for (const [w, h] of [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,800],[1152,800],[1024,800],[820,900],[640,900],[390,844],[320,700]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  await p.goto(process.argv[2] + 'me/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(120);
  const r = await p.evaluate(() => {
    const h1 = document.querySelector('h1');
    const natural = h1.getBoundingClientRect().height;
    h1.style.whiteSpace = 'nowrap';
    const four = h1.getBoundingClientRect().height; const need = h1.scrollWidth;
    h1.style.whiteSpace = '';
    return { four: Math.abs(natural - four) < 1, fits: h1.scrollWidth <= h1.clientWidth + 1, slack: Math.round(h1.clientWidth - need) };
  });
  const ok = r.four && r.fits; if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${String(w).padStart(4)}px  4 lines=${r.four?'yes':'NO '}  fits=${r.fits?'yes':'NO '}  slack ${String(r.slack).padStart(5)}px`);
  await p.close();
}
await b.close();
console.log(bad ? `\n${bad} failing` : '\nall viewports hold');
