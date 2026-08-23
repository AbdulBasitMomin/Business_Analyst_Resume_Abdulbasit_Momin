/**
 * Generate the downloadable resume PDF from the site itself.
 *
 * The PDF used to be a separate file exported from a word processor, which
 * meant every content edit had to be made twice and the two drifted: the site
 * listed one set of certifications and the download listed another. Now there
 * is one source (data.js) and the download is built from it, so they cannot
 * disagree.
 *
 *   node tools/build-resume-pdf.mjs <url> <output.pdf>
 *
 * Print styling lives in the @media print block in style.css, so what this
 * writes is exactly what a reader gets from Ctrl-P.
 */
const [url = 'http://localhost:8123/', out = 'assets/Abdulbasit-Momin-Business-Analyst.pdf'] =
  process.argv.slice(2);

const pwSpec = process.env.PLAYWRIGHT_MODULE || 'playwright';
let chromium;
try {
  ({ chromium } = await import(pwSpec).then((m) => m.default ?? m));
} catch {
  console.error(`Cannot load Playwright from ${pwSpec}. Install it, or set PLAYWRIGHT_MODULE.`);
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load' });

// Wait for the render rather than a fixed sleep: the sections come from
// data.js, so an early snapshot would print an empty shell.
await page.waitForFunction(() => document.querySelectorAll('#timeline > *').length > 0,
  { timeout: 20000 });
await page.waitForTimeout(600);

const pdf = await page.pdf({
  format: 'A4',
  printBackground: false,
  preferCSSPageSize: true,
});

// Guard the things that made this file worth generating in the first place.
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(300);
const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

// The masthead prints the site's own address, and the paper copy is the one
// place nothing downstream can correct it. Assert the printed URL is the one
// this build was configured for.
const portfolio = await page.evaluate(() => {
  const m = [...document.querySelectorAll('.mast-contact a')]
    .map((a) => a.getAttribute('href') || '')
    .find((h) => /github\.io/.test(h));
  return m || null;
});

const problems = [];
if (portfolio && !text.includes(portfolio.replace(/^https?:\/\//, ''))) {
  problems.push(`printed URL missing: ${portfolio}`);
}
if (/—/.test(text)) problems.push('em dash in printed copy');
for (const want of ['AWS for SAP Cloud ERP Essentials', 'PMP', 'In progress', 'Abdulbasit Momin']) {
  if (!text.includes(want)) problems.push(`missing from print: ${want}`);
}
if (/Intro to SQL/.test(text)) problems.push('"Intro to SQL" still present');

const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

const { writeFile } = await import('node:fs/promises');
await writeFile(out, pdf);
console.log(`wrote ${out} (${(pdf.length / 1024).toFixed(0)} KB, ${pages} pages)`);
if (problems.length) {
  console.error('FAILED:\n  ' + problems.join('\n  '));
  await browser.close();
  process.exit(1);
}
console.log('content checks passed');
await browser.close();
