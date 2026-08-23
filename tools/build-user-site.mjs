/**
 * Build the deployable bundle for the user site at abdulbasitmomin.github.io.
 *
 *   node tools/build-user-site.mjs [outDir]
 *
 * The resume is one codebase serving two addresses. Everything that names the
 * site's own address is rewritten here for the bare domain, and the resume PDF
 * is regenerated so the URL printed on paper matches the copy the reader came
 * from. Nothing is typed twice: the values come from BASE below.
 *
 * The bundle carries the deploy workflow and tools/, so the user site can
 * prerender and stamp its own URLs on every push exactly as this repository
 * does, rather than being a snapshot that quietly goes stale. It also ships a
 * prerendered index.html so it still serves complete markup if Pages is set to
 * plain branch deployment with no Actions run at all.
 */
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.resolve(ROOT, process.argv[2] || 'dist/user-site');

const BASE = 'https://abdulbasitmomin.github.io/';
const BARE = 'abdulbasitmomin.github.io';
const PDF_NAME = 'Abdulbasit-Momin-Business-Analyst.pdf';
const BUNDLE_PDF = path.join(OUT, PDF_NAME);   // scratch, moved into assets/ below

const run = async (cmd, args) => {
  const { spawn } = await import('node:child_process');
  return new Promise((res, rej) => {
    const c = spawn(cmd, args, { stdio: 'inherit', cwd: ROOT, env: process.env });
    c.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
};

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// ---- 1. the content that names the site's address ----
// data.js carries the portfolio line that gets printed on the PDF, so it has
// to be rewritten before the PDF is built, not after.
const dataPath = path.join(ROOT, 'assets/js/data.js');
const dataOriginal = await readFile(dataPath, 'utf8');
const dataRewritten = dataOriginal.replace(
  /portfolio: '[^']*'/,
  `portfolio: '${BARE}'`,
);
if (dataRewritten === dataOriginal && !dataOriginal.includes(`portfolio: '${BARE}'`)) {
  throw new Error('data.js: portfolio line not found -- update this script');
}

let ok = false;
try {
  await writeFile(dataPath, dataRewritten);

  // ---- 2. build the PDF and the prerendered markup against that content ----
  // The PDF goes to a scratch path, never over this repository's own copy:
  // that one prints the other address and is committed.
  const url = process.env.SITE_URL || 'http://localhost:8123/';
  await run('node', ['tools/build-resume-pdf.mjs', url, BUNDLE_PDF]);
  await run('node', ['tools/prerender.mjs', url, path.join(OUT, 'index.html')]);
  ok = true;
} finally {
  // This repository still serves the other address, so its own copy of data.js
  // must go back exactly as it was whether the build succeeded or not.
  await writeFile(dataPath, dataOriginal);
}
if (!ok) process.exit(1);

// ---- 3. everything the page loads at runtime ----
await cp(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
// Overwrite the copied PDF with the one built for this address.
await cp(BUNDLE_PDF, path.join(OUT, 'assets', PDF_NAME));
await rm(BUNDLE_PDF, { force: true });
// And the copied data.js, which was restored to this repository's own address
// before assets/ was copied. Without this the bundle renders and reprints the
// wrong URL at runtime even though its prerendered markup is right.
await writeFile(path.join(OUT, 'assets/js/data.js'), dataRewritten);
// tools/user-site is the *other* repository's redirect page; it has no business
// being shipped inside this one.
await cp(path.join(ROOT, 'tools'), path.join(OUT, 'tools'), {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}tools${path.sep}user-site`),
});
if (existsSync(path.join(ROOT, '.github'))) {
  await cp(path.join(ROOT, '.github'), path.join(OUT, '.github'), { recursive: true });
}
// No second copy of the source markup: the workflow prerenders from the
// index.html already in the bundle, and prerendering is idempotent.

// ---- 4. addresses ----
const swap = async (name, body) => writeFile(path.join(OUT, name), body);
for (const f of ['robots.txt', 'sitemap.xml']) {
  const src = await readFile(path.join(ROOT, f), 'utf8');
  await swap(f, src.replace(/https:\/\/[a-z0-9.-]+\.github\.io\/[^"<\s]*\//gi, BASE));
}
const html = await readFile(path.join(OUT, 'index.html'), 'utf8');
await swap('index.html', html.replace(/https:\/\/[a-z0-9.-]+\.github\.io\/[^"<\s]*\//gi, BASE));

// Branch-deployed Pages runs Jekyll, which drops underscore-prefixed paths and
// can fail the build outright.
await swap('.nojekyll', '');

const bundledData = await readFile(path.join(OUT, 'assets/js/data.js'), 'utf8');
if (!bundledData.includes(`portfolio: '${BARE}'`)) {
  throw new Error(`bundled data.js does not carry ${BARE}`);
}

const bad = [...(await readFile(path.join(OUT, 'index.html'), 'utf8'))
  .matchAll(/https:\/\/[a-z0-9.-]*\.github\.io[^"<\s]*/gi)].map((m) => m[0]);
const wrong = bad.filter((u) => u !== BASE && u !== BASE.replace(/\/$/, '') && !u.startsWith(BASE));
if (wrong.length) throw new Error('stale addresses left in index.html: ' + wrong.join(', '));

console.log(`\nbundle written to ${path.relative(ROOT, OUT)}`);
console.log(`addresses in index.html: ${[...new Set(bad)].join(', ')}`);
