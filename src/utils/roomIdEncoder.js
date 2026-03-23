// Room ID encoding/decoding utilities
// Encodes human-readable room IDs to Base64 for URL safety and compactness

export function encodeRoomId(roomId) {
  try {
    // Convert room ID to Base64
    return btoa(roomId)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '') // Remove padding
  } catch (err) {
    console.error('Failed to encode room ID:', err)
    return roomId // Fallback to original
  }
}

export function decodeRoomId(encodedRoomId) {
  try {
    // Restore Base64 padding and special characters
    let base64 = encodedRoomId
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    
    return atob(base64)
  } catch (err) {
    console.error('Failed to decode room ID:', err)
    return encodedRoomId // Fallback to original
  }
}

export function isEncodedRoomId(roomId) {
  // Check if room ID appears to be Base64 encoded
  // Encoded IDs won't have hyphens in the middle (only URL-safe chars)
  return roomId && !roomId.includes('-') && /^[A-Za-z0-9_-]+$/.test(roomId)
}
