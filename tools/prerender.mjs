/**
 * Bakes the rendered DOM into static HTML.
 *
 * The site renders every section from data.js at runtime, which means a
 * crawler -- or any viewer where scripts are blocked -- sees an empty shell.
 * This drives a real browser, waits for the render, then snapshots the
 * resulting DOM so the resume text is present in the markup.
 *
 * The scripts stay in the snapshot: on load they re-render the same sections
 * from the same data, which is idempotent (each renderer assigns innerHTML
 * wholesale). So the 3D and interactions still attach on top.
 *
 * Usage: node tools/prerender.mjs <url> <output.html>
 */

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node tools/prerender.mjs <url> <output.html>');
  process.exit(1);
}

// Allow an explicit module path, since Playwright is often installed globally.
const pwSpec = process.env.PLAYWRIGHT_MODULE || 'playwright';
let chromium;
try {
  ({ chromium } = await import(pwSpec).then((m) => m.default ?? m));
} catch (err) {
  console.error(`Cannot load Playwright from ${pwSpec}. Install it, or set PLAYWRIGHT_MODULE.`);
  console.error(err.message);
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(url, { waitUntil: 'load' });

// Wait for the render rather than a fixed sleep.
// Wait on rendered experience roles -- the surest sign renderAll() has run.
await page.waitForFunction(() => document.querySelectorAll('#timeline > *').length > 0, { timeout: 20000 });

const html = await page.evaluate(() => {
  // Freeze the page into its "already scrolled through" state, so the static
  // markup is fully visible without the JS that normally reveals it.
  document.getElementById('loader')?.classList.add('is-done');
  document.querySelectorAll('.reveal').forEach((n) => n.classList.add('is-in'));
  document.querySelectorAll('.stat-value').forEach((n) => {
    n.textContent = `${n.dataset.count}${n.dataset.suffix || ''}`;
  });
  // Runtime-only flags must not be baked in -- the snapshot has no WebGL,
  // and a stored Recruiter Mode preference must not become the default page.
  document.body.classList.remove('has-webgl', 'no-webgl', 'recruiter-mode');
  const panel = document.getElementById('recruiter-panel');
  if (panel) panel.hidden = true;
  // Inline canvas opacity from the scroll-driven dim would freeze the backdrop.
  document.getElementById('bg-canvas')?.removeAttribute('style');
  // The trace graph is a live WebGL figure. Baking in its "is-live" class and
  // its projected tag positions would leave a dead box and a scatter of
  // stranded labels in the snapshot, so it goes back to its pre-mount state
  // and is re-enabled by the script if the browser can actually draw it.
  const fig = document.getElementById('trace-graph');
  if (fig) {
    fig.classList.remove('is-live');
    const tags = document.getElementById('tg-tags');
    if (tags) tags.innerHTML = '';
    const label = document.getElementById('tg-label');
    if (label) { label.hidden = true; label.innerHTML = ''; label.removeAttribute('style'); }
    const cvs = document.getElementById('trace-canvas');
    ['width', 'height', 'style', 'data-engine'].forEach((a) => cvs?.removeAttribute(a));
    const counts = document.getElementById('tg-counts');
    if (counts) counts.textContent = '';
  }
  // Selecting a capability is a runtime action; a snapshot must not open with
  // one chosen, a chain panel filled in, and bullets highlighted.
  document.querySelectorAll('.ev-chip.is-on, .ev-chip.is-traced').forEach((n) => n.classList.remove('is-on', 'is-traced'));
  document.querySelectorAll('.role-list li.is-traced, .role-list li.is-source')
    .forEach((n) => n.classList.remove('is-traced', 'is-source'));
  const chain = document.getElementById('trace-chain');
  if (chain) { chain.hidden = true; chain.innerHTML = ''; }
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
});

const { writeFile, mkdir } = await import('node:fs/promises');
const { dirname } = await import('node:path');
await mkdir(dirname(out), { recursive: true });
await writeFile(out, html);
console.log(`prerendered ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

await browser.close();
