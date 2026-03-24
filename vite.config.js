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
    include: ['buffer', 'process', 'util', 'simple-peer'],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        // Inject polyfill at the very beginning of the bundle
        banner: `
(function() {
  if (typeof navigator !== 'undefined') {
    var mockGetUserMedia = function() {
      return Promise.reject(new DOMException('getUserMedia not available', 'NotAllowedError'));
    };
    if (!navigator.mediaDevices) navigator.mediaDevices = {};
    if (!navigator.mediaDevices.getUserMedia) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
        writable: false,
        configurable: false
      });
    }
    navigator.getUserMedia = navigator.getUserMedia || mockGetUserMedia;
    navigator.webkitGetUserMedia = navigator.webkitGetUserMedia || mockGetUserMedia;
    navigator.mozGetUserMedia = navigator.mozGetUserMedia || mockGetUserMedia;
  }
})();
        `.trim()
      }
    },
  },
})
