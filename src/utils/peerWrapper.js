// Custom WebRTC DataChannel implementation
// Replaces simple-peer which has getUserMedia bugs

// SSR Protection
if (typeof window === 'undefined') {
  throw new Error('WebRTC can only be used in browser environment')
}

// Import our custom DataChannel implementation
import DataChannelPeer from './DataChannelPeer'

// Export as default (drop-in replacement for simple-peer)
export default DataChannelPeer
