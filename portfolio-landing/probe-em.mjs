import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const EMS = ['1.05em'];
const WIDTHS = [1920, 1600, 1440, 1366, 1280, 1152, 1024, 820, 640, 390, 320];
const grid = {};
for (const w of WIDTHS) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  await p.goto(process.argv[2] + 'me/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => document.fonts.ready);
  grid[w] = await p.evaluate((ems) => {
    const h1 = document.querySelector('h1');
    const spans = [...h1.querySelectorAll('.font-display')];
    const out = {};
    for (const em of ems) {
      spans.forEach(s => (s.style.fontSize = em));
      const natural = h1.getBoundingClientRect().height;
      h1.style.whiteSpace = 'nowrap';
      const four = h1.getBoundingClientRect().height;
      const need = h1.scrollWidth;
      h1.style.whiteSpace = '';
      const avail = h1.clientWidth;
      // Four lines AND nothing running past the column edge.
      out[em] = { lines4: Math.abs(natural - four) < 1, fits: h1.scrollWidth <= avail + 1, slack: Math.round(avail - need) };
    }
    spans.forEach(s => (s.style.fontSize = ''));
    return out;
  }, EMS);
  await p.close();
}
await b.close();
console.log('em'.padEnd(8) + WIDTHS.map(w => String(w).padStart(6)).join(''));
for (const em of EMS) {
  const row = WIDTHS.map(w => {
    const c = grid[w][em];
    return (c.lines4 && c.fits ? '   ok' : c.fits ? ' wrap' : ' OVER').padStart(6);
  }).join('');
  console.log(em.padEnd(8) + row);
}
