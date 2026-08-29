// Vite emits an MPA: dist/index.html plus dist/me/index.html sharing dist/assets.
// That only works if the whole tree is installed together. These pages get
// installed independently -- one of them at the root of a GitHub Pages site --
// so this splits the build into two self-contained directories, each with its
// own index.html and its own assets/.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL as U } from 'node:url';

const here = (p) => fileURLToPath(new U(p, import.meta.url));

const TARGETS = [
  { name: 'landing', html: 'dist/index.html', out: '../landing' },
  { name: 'me', html: 'dist/me/index.html', out: '../me' },
];

for (const { name, html, out } of TARGETS) {
  const dir = here(out);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await cp(here('dist/assets'), `${dir}/assets`, { recursive: true });

  // dist/me/index.html sits one level down, so its asset hrefs are ../assets/.
  // Flattened to the directory root they become ./assets/.
  const markup = (await readFile(here(html), 'utf8')).replaceAll('../assets/', './assets/');
  if (markup.includes('../assets/')) throw new Error(`${name}: unrewritten parent path`);
  await writeFile(`${dir}/index.html`, markup);
  console.log(`packed ${name} -> ${out}/`);
}
