// Native WebRTC DataChannel implementation
// Replaces simple-peer for data-only connections

export default class DataChannelPeer {
  constructor(opts = {}) {
    this.initiator = opts.initiator || false
    this.trickle = opts.trickle !== undefined ? opts.trickle : true
    this.config = opts.config || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
    
    this._pc = null
    this._channel = null
    this._listeners = {}
    this._pendingCandidates = []
    this.connected = false
    this.destroyed = false
    
    this._init()
  }
  
  _init() {
    try {
      // Create RTCPeerConnection
      this._pc = new RTCPeerConnection(this.config)
      
      // Handle ICE candidates
      this._pc.onicecandidate = (event) => {
        if (event.candidate && this.trickle) {
          this._emit('signal', {
            type: 'candidate',
            candidate: event.candidate
          })
        } else if (!event.candidate && !this.trickle) {
          // All candidates gathered, send offer/answer
          this._emit('signal', this._pc.localDescription)
        }
      }
      
      // Handle connection state
      this._pc.onconnectionstatechange = () => {
        if (this._pc.connectionState === 'connected') {
          this.connected = true
          this._emit('connect')
        } else if (this._pc.connectionState === 'failed' || this._pc.connectionState === 'closed') {
          this._emit('close')
        }
      }
      
      // If initiator, create data channel
      if (this.initiator) {
        this._createDataChannel()
        this._createOffer()
      } else {
        // If not initiator, wait for data channel
        this._pc.ondatachannel = (event) => {
          this._channel = event.channel
          this._setupDataChannel()
        }
      }
    } catch (err) {
      this._emit('error', err)
    }
  }
  
  _createDataChannel() {
    this._channel = this._pc.createDataChannel('data', {
      ordered: true
    })
    this._setupDataChannel()
  }
  
  _setupDataChannel() {
    this._channel.binaryType = 'arraybuffer'
    
    this._channel.onopen = () => {
      this.connected = true
      this._emit('connect')
    }
    
    this._channel.onclose = () => {
      this._emit('close')
    }
    
    this._channel.onerror = (err) => {
      this._emit('error', err)
    }
    
    this._channel.onmessage = (event) => {
      this._emit('data', event.data)
    }
  }
  
  async _createOffer() {
    try {
      const offer = await this._pc.createOffer()
      await this._pc.setLocalDescription(offer)
      
      if (!this.trickle) {
        // Wait for ICE gathering to complete
        await new Promise((resolve) => {
          if (this._pc.iceGatheringState === 'complete') {
            resolve()
          } else {
            this._pc.onicegatheringstatechange = () => {
              if (this._pc.iceGatheringState === 'complete') {
                resolve()
              }
            }
          }
        })
        this._emit('signal', this._pc.localDescription)
      } else {
        this._emit('signal', offer)
      }
    } catch (err) {
      this._emit('error', err)
    }
  }
  
  async signal(data) {
    try {
      if (data.type === 'offer') {
        await this._pc.setRemoteDescription(new RTCSessionDescription(data))
        const answer = await this._pc.createAnswer()
        await this._pc.setLocalDescription(answer)
        
        if (!this.trickle) {
          await new Promise((resolve) => {
            if (this._pc.iceGatheringState === 'complete') {
              resolve()
            } else {
              this._pc.onicegatheringstatechange = () => {
                if (this._pc.iceGatheringState === 'complete') {
                  resolve()
                }
              }
            }
          })
          this._emit('signal', this._pc.localDescription)
        } else {
          this._emit('signal', answer)
        }
      } else if (data.type === 'answer') {
        await this._pc.setRemoteDescription(new RTCSessionDescription(data))
      } else if (data.type === 'candidate' || data.candidate) {
        const candidate = data.candidate || data
        if (this._pc.remoteDescription) {
          await this._pc.addIceCandidate(new RTCIceCandidate(candidate))
        } else {
          this._pendingCandidates.push(candidate)
        }
      }
      
      // Add pending candidates after remote description is set
      if (this._pc.remoteDescription && this._pendingCandidates.length > 0) {
        for (const candidate of this._pendingCandidates) {
          await this._pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
        this._pendingCandidates = []
      }
    } catch (err) {
      this._emit('error', err)
    }
  }
  
  send(data) {
    if (!this._channel || this._channel.readyState !== 'open') {
      throw new Error('DataChannel is not open')
    }
    this._channel.send(data)
  }
  
  write(data) {
    // Alias for send (simple-peer compatibility)
    this.send(data)
  }
  
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    
    if (this._channel) {
      this._channel.close()
    }
    if (this._pc) {
      this._pc.close()
    }
    
    this._emit('close')
  }
  
  on(event, listener) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(listener)
  }
  
  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(listener => listener(data))
    }
  }
}
