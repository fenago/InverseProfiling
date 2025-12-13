import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for Node.js globals used by levelgraph
      include: ['process', 'util', 'buffer', 'stream', 'events'],
      globals: {
        process: true,
        global: true,
        Buffer: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'QMU.io - Privacy-First Digital Twin',
        short_name: 'QMU.io',
        description: 'Privacy-preserving psychological profiling that runs 100% on your device',
        theme_color: '#4f46e5',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache strategies for different resource types
        runtimeCaching: [
          {
            // Cache the AI model files (large, immutable)
            urlPattern: /\.(?:wasm|bin|onnx)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ai-models',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache static assets
            urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache fonts
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        // Pre-cache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Don't cache models during build (too large), but do cache at runtime
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
      },
      devOptions: {
        enabled: true, // Enable PWA in development for testing
        type: 'module'
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@aspect-build/aspect-sqlite'],
    include: ['levelgraph', 'level', 'level-js'],
  },
  worker: {
    format: 'es'
  },
  resolve: {
    alias: {
      // Alias for browser-compatible modules
      stream: 'stream-browserify',
    },
  },
})
