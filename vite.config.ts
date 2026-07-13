import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for WASM + model
        runtimeCaching: [
          {
            // Cache MediaPipe WASM + model files with CacheFirst strategy
            urlPattern: /\/mediapipe\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Exclude MediaPipe WASM from dependency optimization
    exclude: ['@mediapipe/tasks-vision'],
  },
});
