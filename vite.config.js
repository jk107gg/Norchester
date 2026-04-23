import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Norchester/',
  plugins: [
    {
      // Correct MIME types for Unity/WebGL assets
      name: 'wasm-unity-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.endsWith('.wasm') || req.url.endsWith('.unityweb')) {
            res.setHeader('Content-Type', 'application/wasm');
          } else if (req.url.endsWith('.data') || req.url.endsWith('.data.unityweb')) {
            res.setHeader('Content-Type', 'application/octet-stream');
          } else if (req.url.endsWith('.js.unityweb') || req.url.endsWith('.framework.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
          next();
        });
      },
    },
  ],
  server: {
    // COOP/COEP removed — 'require-corp' blocks cross-origin images and iframes
    // (TMDB posters, video embeds). Unity SharedArrayBuffer needs these headers
    // but they must be set per-asset on the CDN/S3 side in production, not globally.
  },
  assetsInclude: ['**/*.wasm', '**/*.unityweb', '**/*.data'],
})