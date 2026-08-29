import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built page works from any sub-path, which it
  // has to: Pages serves it under /<repo>/landing/, not at a domain root.
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets' },
});
