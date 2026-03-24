// Wrapper for simple-peer to handle data-only connections
// This ensures getUserMedia is available before simple-peer initializes

// SSR Protection - only run in browser
if (typeof window === 'undefined') {
  throw new Error('simple-peer can only be used in browser environment')
}

// AGGRESSIVE polyfill - set BEFORE any imports
(function() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
  
  // Create a mock getUserMedia that returns a rejected promise
  const mockGetUserMedia = function(constraints) {
    return Promise.reject(new DOMException('getUserMedia is not available', 'NotAllowedError'))
  }
  
  // Ensure navigator.mediaDevices exists
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {}
  }
  
  // FORCE set getUserMedia with Object.defineProperty
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
    value: mockGetUserMedia,
    writable: false,
    configurable: false,
    enumerable: true
  })
  
  // Set all the prefixed versions
  navigator.getUserMedia = mockGetUserMedia
  navigator.webkitGetUserMedia = mockGetUserMedia
  navigator.mozGetUserMedia = mockGetUserMedia
  navigator.msGetUserMedia = mockGetUserMedia
  
  // Mock other media APIs
  if (!navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices = function() {
      return Promise.resolve([])
    }
  }
  
  if (!navigator.mediaDevices.getSupportedConstraints) {
    navigator.mediaDevices.getSupportedConstraints = function() {
      return {}
    }
  }
  
  // CRITICAL: Mock RTCPeerConnection.prototype.addStream if it doesn't exist
  if (typeof RTCPeerConnection !== 'undefined' && !RTCPeerConnection.prototype.addStream) {
    RTCPeerConnection.prototype.addStream = function() {
      console.warn('addStream is deprecated, using addTrack instead')
    }
  }
})()

// Now import simple-peer after polyfills are in place
import SimplePeer from 'simple-peer'

// Wrap the Peer constructor to catch any errors
class SafePeer extends SimplePeer {
  constructor(opts = {}) {
    try {
      // Ensure we never pass a stream
      const safeOpts = {
        ...opts,
        stream: undefined,
        streams: undefined
      }
      super(safeOpts)
    } catch (err) {
      console.error('Error creating peer:', err)
      throw err
    }
  }
}

// Export the safe wrapper
export default SafePeer
