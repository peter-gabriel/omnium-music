import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  define: { __VERSION__: JSON.stringify(pkg.version) },
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'omnium-music.js' },
    outDir: 'dist',
    emptyOutDir: true,
  },
  // `npm run dev`: demo with a fake Home Assistant at http://localhost:5183
  server: { host: true, port: 5183, cors: true },
  // `npm run ha`: serves dist/omnium-music.js on the LAN so HA can load it straight from your machine
  preview: { host: true, port: 5184, cors: true },
});
