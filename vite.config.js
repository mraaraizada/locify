import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util/',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['buffer', 'process', 'util'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
})
