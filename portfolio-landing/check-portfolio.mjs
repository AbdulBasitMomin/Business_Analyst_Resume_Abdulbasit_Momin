import pw from '/opt/node22/lib/node_modules/playwright/index.js';
import { PNG } from 'pngjs';
import { readFile } from 'node:fs/promises';
const { chromium } = pw;

const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, c) => (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const res = []; const bad = [];
const ck = (n, ok, d) => { res.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); if (!ok) bad.push(n); };

const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('**://*/**', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(4200);

// --- content, all of it from data.js -----------------------------------------
const { resume } = await import('../assets/js/data.js');
const text = await page.evaluate(() => document.body.innerText);
ck('name', text.includes(resume.meta.name), resume.meta.name);
ck('tagline', text.includes(resume.meta.tagline));
ck('availability', text.includes(resume.meta.availability));
ck('email', text.includes(resume.meta.email));
for (const p of resume.projects) ck(`project "${p.name.slice(0, 26)}"`, text.includes(p.name));
for (const m of resume.process) ck(`stage "${m.stage}"`, text.includes(m.stage));
for (const s of [resume.stats[0], resume.stats[2], resume.stats[3]]) {
  ck(`figure ${s.value}${s.suffix} ${s.label.slice(0, 20)}`, text.includes(s.label));
  ck(`  cites "${s.source}"`, text.includes(s.source));
}
// --- the work cards go somewhere, and somewhere that exists ------------------
const evidence = await readFile(new URL('../assets/js/evidence.js', import.meta.url), 'utf8');
const caseIds = [...evidence.matchAll(/id: '(cs-[a-z-]+)'/g)].map(m => m[1]);
// elementFromPoint needs the card on screen, and the page scrolls smoothly, so
// each card is scrolled into view and given a frame before it is hit-tested.
// Measuring without that returns null for every point and reads as "the link
// does not cover the card", which is what it did the first time.
const cardCount = await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  return document.querySelectorAll('#work article').length;
});
const cards = [];
for (let i = 0; i < cardCount; i++) {
  await page.evaluate((n) => document.querySelectorAll('#work article')[n].scrollIntoView({ block: 'center' }), i);
  await page.waitForTimeout(250);
  cards.push(await page.evaluate((n) => {
    const el = document.querySelectorAll('#work article')[n];
    const a = el.querySelector('a[href]');
    const r = el.getBoundingClientRect();
    // Three points, because a link that only covers the caption is not a
    // clickable card -- the artwork is where a reader actually aims.
    const pts = [[r.x + r.width / 2, r.y + r.height / 2], [r.x + r.width / 2, r.y + 100], [r.x + 60, r.bottom - 120]];
    const covered = pts.every(([x, y]) => { const h = document.elementFromPoint(Math.round(x), Math.round(y));
      return !!h && (h === a || h.closest('a') === a); });
    return { title: el.querySelector('h3')?.textContent?.trim(), href: a?.getAttribute('href') || null, hitIsLink: covered };
  }, i));
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
ck('every work card has a link', cards.length > 0 && cards.every(c => c.href),
   cards.map(c => c.href ? 'ok' : `NONE for ${c.title}`).join(', '));
ck('the link covers the card', cards.every(c => c.hitIsLink),
   cards.filter(c => !c.hitIsLink).map(c => c.title).join(', '));
for (const c of cards) {
  const anchor = (c.href || '').split('#')[1];
  ck(`  "${(c.title || '').slice(0, 26)}" -> #${anchor}`, caseIds.includes(anchor),
     caseIds.includes(anchor) ? '' : `not one of ${caseIds.join(', ')}`);
}

const FORBIDDEN = ['Michael', 'Smith', 'Chicago', 'Dribbble', '20+', '95+', '200%', 'Journal',
  'Automotive', 'Urban Architecture', 'Brand Identity', 'Satisfied Clients', 'COLLECTION'];
for (const w of FORBIDDEN) ck(`no borrowed copy: "${w}"`, !text.includes(w));

// --- every figure on the page traces to data.js ------------------------------
const nums = await page.evaluate(() =>
  [...document.querySelectorAll('section, footer')].flatMap(s =>
    // No trailing \b: it can never match after a + or a %, so "50+" was being
    // read as a bare "50" and reported as untraceable.
    (s.innerText.match(/\b\d[\d,]*\+?%?/g) || [])));
const allowed = new Set([
  ...resume.stats.flatMap(s => [`${s.value}${s.suffix}`, String(s.value)]),
  String(resume.deliverables.length), String(resume.experience.length),
  ...resume.projects.flatMap(p => (p.name.match(/\d+\+?/g) || []).concat(p.blurb.match(/\d+\+?/g) || [], p.impact.match(/\d+\+?%?/g) || [])),
  '01', '02', '03', '04', '05', '2022', '50+',
]);
const stray = [...new Set(nums)].filter(n => !allowed.has(n));
ck('every figure traces to data.js', stray.length === 0, stray.join(', '));

// --- contrast over whatever is actually behind each run ----------------------
const runs = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return;
    out.push({ text: el.textContent.trim().slice(0, 26), color: cs.color, size: cs.fontSize,
               weight: cs.fontWeight, x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height });
  });
  return out;
});
// Hiding the glyphs rather than the elements keeps every background in place.
await page.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important}' });
await page.waitForTimeout(300);
const png = PNG.sync.read(await page.screenshot());

let worst = { r: 99 };
for (const run of runs) {
  const m = run.color.match(/[\d.]+/g).map(Number);
  const alpha = m[3] ?? 1;
  let brightest = 0, at = [0, 0];
  const x1 = Math.min(png.width - 1, Math.ceil(run.x + run.w)), y1 = Math.min(png.height - 1, Math.ceil(run.y + run.h));
  for (let y = Math.floor(run.y); y <= y1; y += 2) for (let x = Math.floor(run.x); x <= x1; x += 2) {
    const i = (png.width * y + x) << 2;
    const L = lum(png.data[i], png.data[i + 1], png.data[i + 2]);
    if (L > brightest) { brightest = L; at = [x, y]; }
  }
  const bg = png.data[(png.width * at[1] + at[0]) << 2];
  const fg = m.slice(0, 3).map(c => c * alpha + bg * (1 - alpha));
  const r = ratio(lum(fg[0], fg[1], fg[2]), brightest);
  const big = parseFloat(run.size) >= 24 || (parseFloat(run.size) >= 18.66 && Number(run.weight) >= 700);
  const floor = big ? 3 : 4.5;
  if (r - floor < worst.r - (worst.floor ?? 0)) worst = { r, floor, ...run };
  if (r < floor) console.log(`  low ${r.toFixed(2)} (needs ${floor})  ${run.size} ${run.color}  "${run.text}"`);
}
ck(`contrast: tightest run clears AA`, worst.r >= worst.floor,
   `${worst.r.toFixed(2)}:1 vs ${worst.floor} — ${worst.size} "${worst.text}"`);

await b.close();
console.log(res.join('\n'));
console.log(`\n${res.length - bad.length}/${res.length} passed`);
if (bad.length) { console.log('FAILURES:\n' + bad.join('\n')); process.exit(1); }
