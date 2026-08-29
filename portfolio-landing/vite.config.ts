import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const resumeData = fileURLToPath(new URL('../assets/js/data.js', import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built pages work from any sub-path, which they
  // have to: Pages serves them under /<repo>/landing/, not at a domain root.
  base: './',
  resolve: {
    // The resume site's single source of truth. Importing it rather than
    // retyping the figures means the landing page cannot drift out of sync
    // with the resume -- edit data.js and both move together.
    alias: { '@resume': resumeData },
  },
  // Sits outside the project root, so Vite's dev server has to be told it may
  // read it.
  server: { fs: { allow: ['..'] } },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        me: fileURLToPath(new URL('./me/index.html', import.meta.url)),
      },
    },
  },
});
