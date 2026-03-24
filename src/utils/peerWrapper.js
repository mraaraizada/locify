// Wrapper for simple-peer to handle data-only connections
// This ensures getUserMedia is available before simple-peer initializes

// SSR Protection - only run in browser
if (typeof window === 'undefined') {
  throw new Error('simple-peer can only be used in browser environment')
}

// Comprehensive polyfill for getUserMedia
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  // Create a mock getUserMedia that returns a rejected promise
  const mockGetUserMedia = function(constraints) {
    return Promise.reject(new DOMException('getUserMedia is not available', 'NotAllowedError'))
  }
  
  // Ensure navigator.mediaDevices exists
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {}
  }
  
  // Set getUserMedia on mediaDevices with proper binding
  if (!navigator.mediaDevices.getUserMedia) {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: mockGetUserMedia,
      writable: true,
      configurable: true
    })
  }
  
  // Also set the older prefixed versions
  if (!navigator.getUserMedia) {
    navigator.getUserMedia = mockGetUserMedia
  }
  if (!navigator.webkitGetUserMedia) {
    navigator.webkitGetUserMedia = mockGetUserMedia
  }
  if (!navigator.mozGetUserMedia) {
    navigator.mozGetUserMedia = mockGetUserMedia
  }
  if (!navigator.msGetUserMedia) {
    navigator.msGetUserMedia = mockGetUserMedia
  }
  
  // Ensure enumerateDevices exists
  if (!navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices = function() {
      return Promise.resolve([])
    }
  }
  
  // Ensure getSupportedConstraints exists
  if (!navigator.mediaDevices.getSupportedConstraints) {
    navigator.mediaDevices.getSupportedConstraints = function() {
      return {}
    }
  }
}

// Now import simple-peer after polyfills are in place
import SimplePeer from 'simple-peer'

// Export default (NOT as namespace)
export default SimplePeer
