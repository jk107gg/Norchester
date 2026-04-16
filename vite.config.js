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
    headers: {
      // Required for SharedArrayBuffer (Unity multithreading)
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  assetsInclude: ['**/*.wasm', '**/*.unityweb', '**/*.data'],
})