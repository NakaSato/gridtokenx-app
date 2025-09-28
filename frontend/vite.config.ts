import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({}),
    react(),
    tailwindcss(),
    viteTsconfigPaths({
      root: resolve(__dirname),
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@project/anchor': resolve(__dirname, '../anchor/src/gridtokenxapp-exports'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
