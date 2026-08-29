import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { resume } from '../assets/js/data.js';

const T = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = []; const bad = [];
const ck = (n, ok, d) => { res.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); if (!ok) bad.push(n); };

const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(T, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(400);
const text = await page.evaluate(() => document.body.innerText);
const d = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1').innerText.replace(/\n/g, ' '),
  // The two words the headline sets apart. They were the bitmap face until it
  // turned out to render M as H at display size; the distinction is weight now.
  pixel: [...document.querySelectorAll('h1 .font-extrabold')].map(e => e.textContent),
  chips: [...document.querySelectorAll('.bg-\\[\\#0B0B0B\\]')].map(e => ({ t: e.innerText.replace(/\n/g, ' '), title: e.title })),
  navHrefs: [...document.querySelectorAll('nav a')].map(a => a.getAttribute('href')),
  cta: { href: document.querySelector('a[download]')?.getAttribute('href'), text: document.querySelector('a[download]')?.innerText },
  tel: document.querySelector('a[href^="tel:"]')?.getAttribute('href'),
  footRight: document.querySelectorAll('.sm\\:text-right')[0]?.innerText,
  lh: (() => { const c = getComputedStyle(document.querySelector('h1')); return +(parseFloat(c.lineHeight) / parseFloat(c.fontSize)).toFixed(2); })(),
  over: Math.round(document.querySelector('.pb-4').getBoundingClientRect().bottom - document.documentElement.clientHeight),
}));

// --- Nothing on this page may be absent from the resume data. ---
ck('title from data', d.title === `${resume.meta.name} - ${resume.meta.role}`, d.title);
ck('name rendered', text.includes('ABDULBASIT') && text.includes('MOMIN'));
ck('role rendered', text.includes('BUSINESS') && text.includes('ANALYST'));
ck('location from data', text.includes(resume.meta.location), resume.meta.location);
ck('availability from data', text.includes(resume.meta.availability), resume.meta.availability);

const stats = [resume.stats[0], resume.stats[2], resume.stats[3]];
const shorts = ['years', 'dashboards', 'go-lives'];
ck('3 figure chips', d.chips.length === 3, String(d.chips.length));
stats.forEach((s, i) => {
  const want = `${s.value}${s.suffix} ${shorts[i]}`;
  ck(`chip ${i + 1} figure is data.stats[${i}]`, d.chips[i]?.t === want, `${d.chips[i]?.t} | want ${want}`);
  // The short label is a display form, so the chip must still carry the full
  // resume label and the line it came from.
  ck(`chip ${i + 1} carries full label`, d.chips[i]?.title?.includes(s.label), d.chips[i]?.title);
  ck(`chip ${i + 1} cites its source`, d.chips[i]?.title?.includes(s.source), d.chips[i]?.title);
});

ck('footer counts derived', d.footRight === `${resume.experience.length} roles • ${resume.deliverables.length} deliverable types • ${resume.certifications.filter(c => !c.status).length} certifications`, d.footRight);
ck('CTA is the real PDF', d.cta.href === `https://${resume.meta.portfolio}/${resume.meta.resumePdf.replace(/^\.\//, '')}`, d.cta.href);
ck('CTA downloads, not plays', d.cta.text.trim() === 'DOWNLOAD RESUME', d.cta.text.trim());
ck('phone dials digits only', d.tel === `tel:${resume.meta.phone.replace(/[^\d+]/g, '')}`, d.tel);
ck('nav points at real sections', d.navHrefs.slice(1, 7).every(h => /#(summary|experience|projects|skills|method|contact)$/.test(h)), d.navHrefs[1]);

// --- Structure carried over from the reference. ---
ck('headline 0.72 leading', d.lh === 0.72, String(d.lh));
ck('two words set apart in headline', d.pixel.length === 2, d.pixel.join('+'));
ck('fits the viewport at 1440x900', d.over <= 0, `${d.over}px`);

// --- Nothing borrowed from the reference persona. ---
const FORBIDDEN = ['Adam', 'Roberts', 'Grilled Pixels', 'FWA', 'CSSDesignAwards', 'top 1%', 'archive fragments', 'catalog items', 'freelance', 'SHOWREEL', 'WebGL', 'Photography'];
FORBIDDEN.forEach(w => ck(`no borrowed copy: "${w}"`, !text.includes(w)));

await page.screenshot({ path: '/tmp/claude-0/-home-user/3b43ac49-b6a2-5c5a-b397-fa0c3fdd7c7e/scratchpad/shots/me-xl.png' });
await page.close(); await b.close();
console.log(res.join('\n'));
console.log(`\n${res.length - bad.length}/${res.length} checks passed`);
if (bad.length) { console.log('FAILURES:\n' + bad.join('\n')); process.exit(1); }
