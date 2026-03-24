// Wrapper for simple-peer to handle data-only connections
// This ensures getUserMedia is available before simple-peer initializes

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
import Peer from 'simple-peer'

export default Peer
