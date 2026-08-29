// Vite emits an MPA: dist/index.html plus dist/me/index.html sharing dist/assets.
// That only works if the whole tree is installed together. These pages get
// installed independently -- one of them at the root of a GitHub Pages site --
// so this splits the build into two self-contained directories, each with its
// own index.html and its own assets/.
//
// Only the assets a page actually references are copied. Vite emits a
// modulepreload link for every chunk an entry pulls in, so the markup is an
// accurate manifest, and copying the whole assets/ directory instead would put
// three.js in the reference page's build, which never loads it.
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL as U } from 'node:url';

const here = (p) => fileURLToPath(new U(p, import.meta.url));

const TARGETS = [
  { name: 'landing', html: 'dist/index.html', out: '../landing' },
  { name: 'me', html: 'dist/me/index.html', out: '../me' },
];

for (const { name, html, out } of TARGETS) {
  const dir = here(out);
  const raw = await readFile(here(html), 'utf8');

  const refs = [...new Set([...raw.matchAll(/\.{1,2}\/assets\/([^"']+)/g)].map((m) => m[1]))];
  if (!refs.length) throw new Error(`${name}: no assets referenced -- pack would ship an empty page`);

  await rm(dir, { recursive: true, force: true });
  await mkdir(`${dir}/assets`, { recursive: true });

  let bytes = 0;
  for (const ref of refs) {
    const src = here(`dist/assets/${ref}`);
    bytes += (await stat(src)).size;
    await copyFile(src, `${dir}/assets/${ref}`);
  }

  // Flattened to the directory root, ../assets/ becomes ./assets/.
  const markup = raw.replaceAll('../assets/', './assets/');
  if (markup.includes('../assets/')) throw new Error(`${name}: unrewritten parent path`);
  await writeFile(`${dir}/index.html`, markup);

  const shipped = await readdir(`${dir}/assets`);
  if (shipped.length !== refs.length) throw new Error(`${name}: stale files left in assets/`);
  console.log(`packed ${name} -> ${out}/  (${refs.length} assets, ${(bytes / 1024).toFixed(0)} KB)`);
}
