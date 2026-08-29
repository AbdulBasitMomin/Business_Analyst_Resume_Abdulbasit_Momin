import pw from '/opt/node22/lib/node_modules/playwright/index.js';
import { PNG } from 'pngjs';
const { chromium } = pw;
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const lum = (r, g, b_) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b_); };
const ratio = (a, c) => (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);

let worst = { r: 99 };
for (const [w, h] of [[1440, 900], [1920, 1080], [1680, 1050], [1280, 800], [1024, 800], [768, 1024], [430, 932], [390, 844], [375, 667]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  await p.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);

  // Every text run, with its colour and box, then the same frame with the copy
  // hidden so the box can be sampled against what is actually behind it.
  const runs = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.relative.z-10 *').forEach((el) => {
      const kids = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (!kids) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const cs = getComputedStyle(el);
      out.push({ text: el.textContent.trim().slice(0, 28), color: cs.color, size: cs.fontSize, weight: cs.fontWeight,
                 x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height });
    });
    return out;
  });
  await p.evaluate(() => { document.querySelector('.relative.z-10').style.visibility = 'hidden'; });
  await p.waitForTimeout(400);
  const png = PNG.sync.read(await p.screenshot());

  let vpWorst = { r: 99 };
  for (const run of runs) {
    const m = run.color.match(/[\d.]+/g).map(Number);
    const alpha = m[3] ?? 1;
    // Translucent white over the frame: composite it before measuring.
    let brightest = 0, at = null;
    const x0 = Math.floor(run.x), y0 = Math.floor(run.y);
    const x1 = Math.min(png.width - 1, Math.ceil(run.x + run.w)), y1 = Math.min(png.height - 1, Math.ceil(run.y + run.h));
    for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
      const i = (png.width * y + x) << 2;
      const L = lum(png.data[i], png.data[i + 1], png.data[i + 2]);
      if (L > brightest) { brightest = L; at = [x, y]; }
    }
    // Text colour composited over the brightest pixel it covers.
    const bg = png.data[(png.width * (at ? at[1] : 0) + (at ? at[0] : 0)) << 2];
    const fg = m.slice(0, 3).map(c => c * alpha + bg * (1 - alpha));
    const r = ratio(lum(fg[0], fg[1], fg[2]), brightest);
    const big = parseFloat(run.size) >= 24 || (parseFloat(run.size) >= 18.66 && Number(run.weight) >= 700);
    const floor = big ? 3 : 4.5;
    if (r < worst.r) worst = { r, floor, big, ...run, vp: `${w}x${h}` };
    if (r < vpWorst.r) vpWorst = { r, floor, ...run };
    if (r < floor) console.log(`FAIL ${r.toFixed(2)} (needs ${floor})  ${w}x${h}  ${run.size} ${run.color}  "${run.text}"`);
  }
  console.log(`  ${w}x${h}: worst ${vpWorst.r.toFixed(2)}:1 (floor ${vpWorst.floor}) "${vpWorst.text}"`);
  await p.close();
}
await b.close();
console.log(`\nworst run: ${worst.r.toFixed(2)}:1 (AA floor ${worst.floor}) at ${worst.vp}`);
console.log(`  ${worst.size} ${worst.color} "${worst.text}"`);
console.log(worst.r >= worst.floor ? 'PASS: every text run clears WCAG AA over the scene' : 'FAIL');
