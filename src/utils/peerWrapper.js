// Simple wrapper for simple-peer v9.6.2
// This version doesn't have the getUserMedia.call() bug

// SSR Protection
if (typeof window === 'undefined') {
  throw new Error('simple-peer can only be used in browser environment')
}

// Basic polyfill just in case
if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
  navigator.mediaDevices = {
    getUserMedia: function() {
      return Promise.reject(new Error('getUserMedia not available'))
    },
    enumerateDevices: function() {
      return Promise.resolve([])
    },
    getSupportedConstraints: function() {
      return {}
    }
  }
}

// Import simple-peer
import SimplePeer from 'simple-peer'

// Export directly - v9.6.2 works fine for data-only connections
export default SimplePeer
