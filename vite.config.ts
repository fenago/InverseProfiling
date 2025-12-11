import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

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
