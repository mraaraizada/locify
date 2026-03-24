import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import io from 'socket.io-client'
import Peer from '../utils/peerWrapper'
import streamSaver from 'streamsaver'
import axios from 'axios'
import { throttle } from 'lodash'
import toast, { Toaster } from 'react-hot-toast'
import { getPublicIP } from '../utils/ipDetection'
import { setupClipboardPaste } from '../utils/clipboardPaste'
import { getAvatarInfo } from '../utils/avatarGen'

const RoomContext = createContext()

export const useRoom = () => {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider')
  }
  return context
}

export const RoomProvider = ({ children }) => {
  const [connectionEstablished, setConnectionEstablished] = useState(false)
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [sendingFile, setSendingFile] = useState(null)
  const [sendProgress, setSendProgress] = useState(0)
  const [receivingFile, setReceivingFile] = useState(null)
  const [receiveProgress, setReceiveProgress] = useState(0)
  const [receivedFiles, setReceivedFiles] = useState([])
  const [roomId, setRoomId] = useState(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [pendingDownload, setPendingDownload] = useState(null)
  const [pastedImage, setPastedImage] = useState(null)
  const [publicIP, setPublicIP] = useState(null)

  const socketRef = useRef()
  const peerRef = useRef()
  const peersRef = useRef([]) // Multiple peers for public rooms
  const chunksRef = useRef([])
  const workerRef = useRef()
  const pendingOpRef = useRef(false)
  const fileNameRef = useRef('')
  const onFileSentCallbackRef = useRef(null)
  const currentSendingFileRef = useRef(null)

  useEffect(() => {
    // Initialize web worker
    try {
      workerRef.current = new Worker('/worker.js')
      workerRef.current.addEventListener('message', handleWorkerMessage)
      workerRef.current.addEventListener('error', (err) => {
        console.error('Worker error:', err)
        toast.error('File processing error')
      })
    } catch (err) {
      console.error('Worker initialization failed:', err)
    }

    // Get public IP
    getPublicIP().then(ip => setPublicIP(ip))

    // Setup clipboard paste
    const cleanup = setupClipboardPaste((blob, dataUrl) => {
      setPastedImage({ file: blob, preview: dataUrl })
      toast.success('Image pasted! Ready to send.')
    })

    // Suppress browser extension errors
    const originalError = console.error
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('message port closed') ||
         args[0].includes('Extension context invalidated'))
      ) {
        return // Suppress extension-related errors
      }
      originalError.apply(console, args)
    }

    return () => {
      cleanup()
      if (workerRef.current) {
        workerRef.current.terminate()
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      console.error = originalError // Restore original console.error
    }
  }, [])

  const handleWorkerMessage = (e) => {
    try {
      if (e.data instanceof Blob) {
        // File assembly complete - show download modal
        setPendingDownload({
          blob: e.data,
          name: fileNameRef.current
        })
        setShowDownloadModal(true)
        setReceivingFile(null)
        setReceiveProgress(0)
      }
    } catch (err) {
      console.error('Error handling worker message:', err)
      toast.error('Error processing received file')
    }
  }

  const confirmDownload = () => {
    if (!pendingDownload) return

    // Use StreamSaver for large files (>50MB)
    if (pendingDownload.blob.size > 50 * 1024 * 1024) {
      const fileStream = streamSaver.createWriteStream(pendingDownload.name, {
        size: pendingDownload.blob.size
      })
      
      const readableStream = pendingDownload.blob.stream()
      
      if (readableStream.pipeTo) {
        readableStream.pipeTo(fileStream)
          .then(() => {
            toast.success('File downloaded successfully!')
            // Add to received files list AFTER download
            setReceivedFiles((prev) => [
              ...prev,
              { id: Date.now(), name: pendingDownload.name, timestamp: new Date() }
            ])
            // Send confirmation to sender
            sendLoadConfirmation()
          })
          .catch(err => toast.error('Download failed: ' + err.message))
      }
    } else {
      // Regular download for smaller files
      const url = URL.createObjectURL(pendingDownload.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pendingDownload.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('File downloaded!')
      
      // Add to received files list AFTER download
      setReceivedFiles((prev) => [
        ...prev,
        { id: Date.now(), name: pendingDownload.name, timestamp: new Date() }
      ])
      
      // Send confirmation to sender
      sendLoadConfirmation()
    }

    setShowDownloadModal(false)
    setPendingDownload(null)
  }

  const sendLoadConfirmation = () => {
    // Send confirmation back to sender
    const allPeers = peersRef.current.length > 0 ? peersRef.current : (peerRef.current ? [{ peer: peerRef.current }] : [])
    allPeers.forEach(item => {
      if (item.peer && item.peer.connected) {
        try {
          item.peer.write(JSON.stringify({ load: true }))
        } catch (err) {
          console.error('Error sending confirmation:', err)
        }
      }
    })
  }

  const cancelDownload = () => {
    setShowDownloadModal(false)
    setPendingDownload(null)
    
    // Send abort signal to sender - check both peer types
    const allPeers = peersRef.current.length > 0 ? peersRef.current : (peerRef.current ? [{ peer: peerRef.current }] : [])
    allPeers.forEach(item => {
      if (item.peer && item.peer.connected) {
        try {
          item.peer.write(JSON.stringify({ wait: true }))
        } catch (err) {
          console.error('Error sending abort signal:', err)
        }
      }
    })
    
    // Clear worker
    if (workerRef.current) {
      workerRef.current.postMessage('abort')
    }
    
    toast('Download cancelled')
  }

  const joinRoom = (roomID) => {
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'
    
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
    }
    
    socketRef.current = io(backendUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketRef.current.emit('join room', roomID, true)
    setRoomId(roomID)

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id)
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      toast.error('Connection failed. Please check your internet.')
    })

    socketRef.current.on('all users', (data) => {
      try {
        if (data.usersInThisRoom && data.usersInThisRoom.length > 0) {
          peerRef.current = createPeer(data.usersInThisRoom[0], socketRef.current.id)
        }
      } catch (err) {
        console.error('Error handling all users:', err)
      }
    })

    socketRef.current.on('usernames', (userList) => {
      try {
        console.log('Received usernames:', userList)
        setUsers(userList)
        const myUser = userList.find(u => u.id === socketRef.current.id)
        if (myUser) {
          setCurrentUser(myUser)
        }
      } catch (err) {
        console.error('Error handling usernames:', err)
      }
    })

    socketRef.current.on('user joined', (payload) => {
      try {
        peerRef.current = addPeer(payload.signal, payload.callerID)
      } catch (err) {
        console.error('Error handling user joined:', err)
      }
    })

    socketRef.current.on('receiving returned signal', (payload) => {
      try {
        if (peerRef.current) {
          peerRef.current.signal(payload.signal)
          setConnectionEstablished(true)
        }
      } catch (err) {
        console.error('Error handling returned signal:', err)
      }
    })

    socketRef.current.on('room full', () => {
      toast.error('Room is full!')
    })

    socketRef.current.on('user left', () => {
      if (pendingOpRef.current) {
        toast.error('User left during transfer!')
        setTimeout(() => window.location.reload(), 2000)
      }
      
      setConnectionEstablished(false)
      setSendingFile(null)
      setReceivingFile(null)
      
      if (workerRef.current) {
        workerRef.current.postMessage('abort')
      }
    })
  }

  const joinPublicRoom = (roomID) => {
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'
    
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
    }
    
    socketRef.current = io(backendUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    // Use 'join room using ip' event for public rooms
    socketRef.current.emit('join room using ip', roomID)
    setRoomId(roomID)

    socketRef.current.on('connect', () => {
      console.log('Socket connected to public room:', socketRef.current.id)
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      toast.error('Connection failed. Please check your internet.')
    })

    socketRef.current.on('all users', (data) => {
      try {
        console.log('Public room users:', data)
        
        // Validate data structure
        if (!data || typeof data !== 'object') {
          console.error('Invalid data received in all users event')
          return
        }
        
        // Set users list first
        if (data.usersNamesInThisRoom && Array.isArray(data.usersNamesInThisRoom)) {
          setUsers(data.usersNamesInThisRoom)
          const myUser = data.usersNamesInThisRoom.find(u => u.id === socketRef.current.id)
          if (myUser) {
            setCurrentUser(myUser)
          }
        }
        
        // Create peer connections to all existing users (mesh network)
        if (data.usersInThisRoom && Array.isArray(data.usersInThisRoom) && data.usersInThisRoom.length > 0) {
          const peers = []
          
          data.usersInThisRoom.forEach(userID => {
            try {
              if (!userID || typeof userID !== 'string') {
                console.warn('Invalid userID:', userID)
                return
              }
              
              // ✅ PREVENT DUPLICATE: Check if peer already exists
              const existingPeer = peersRef.current.find(p => p.peerID === userID)
              if (existingPeer) {
                console.log('Peer already exists for:', userID)
                peers.push(existingPeer)
                return
              }
              
              const peer = createPeerForPublicRoom(userID, socketRef.current.id)
              
              if (peer) {
                peers.push({
                  peerID: userID,
                  peer: peer
                })
              }
            } catch (peerErr) {
              console.error('Error creating peer for user:', userID, peerErr)
            }
          })
          
          peersRef.current = peers
          
          // Don't set connectionEstablished here - wait for peer.on('connect') event
          console.log('Created', peers.length, 'peer(s), waiting for connections...')
        } else {
          // No other users yet, but we're in the room
          setConnectionEstablished(false)
        }
      } catch (err) {
        console.error('Error handling all users:', err)
        toast.error('Error connecting to room')
      }
    })

    socketRef.current.on('usernames', (userList) => {
      try {
        console.log('Received usernames:', userList)
        setUsers(userList)
        const myUser = userList.find(u => u.id === socketRef.current.id)
        if (myUser) {
          setCurrentUser(myUser)
        }
      } catch (err) {
        console.error('Error handling usernames:', err)
      }
    })

    socketRef.current.on('user joined', (payload) => {
      try {
        console.log('User joined:', payload.callerID, 'with signal:', !!payload.signal)
        
        // Validate payload
        if (!payload.signal || !payload.callerID) {
          console.error('Invalid user joined payload:', payload)
          return
        }
        
        // Check for duplicate
        const existingPeer = peersRef.current.find(p => p.peerID === payload.callerID)
        if (existingPeer) {
          console.log('Peer already exists for:', payload.callerID)
          return
        }
        
        // Add new peer to mesh network
        const peer = addPeerForPublicRoom(payload.signal, payload.callerID)
        
        if (!peer) {
          console.error('Failed to create peer for:', payload.callerID)
          return
        }
        
        const peerItem = {
          peerID: payload.callerID,
          peer: peer
        }
        
        peersRef.current.push(peerItem)
        
        // Don't set connectionEstablished here - wait for peer.on('connect')
        console.log('Added peer, total peers:', peersRef.current.length)
        
        // Show username of joined user
        if (payload.username) {
          const avatarInfo = getAvatarInfo(payload.username)
          toast.success(`${avatarInfo.name} joined the room`)
        } else {
          toast.success('New user joined the room')
        }
      } catch (err) {
        console.error('Error handling user joined:', err)
      }
    })

    socketRef.current.on('receiving returned signal', (payload) => {
      try {
        console.log('Receiving returned signal from:', payload.id, 'signal:', !!payload.signal)
        
        // Validate payload
        if (!payload.signal || !payload.id) {
          console.error('Invalid returned signal payload:', payload)
          return
        }
        
        // Find the peer and signal it
        const item = peersRef.current.find(p => p.peerID === payload.id)
        
        if (item && item.peer) {
          console.log('Found peer, signaling back...')
          item.peer.signal(payload.signal)
          // Don't set connectionEstablished here - wait for peer.on('connect')
        } else {
          console.error('Peer not found for returned signal from:', payload.id)
          console.log('Available peers:', peersRef.current.map(p => p.peerID))
        }
      } catch (err) {
        console.error('Error handling returned signal:', err)
      }
    })
        if (item && item.peer) {
          item.peer.signal(payload.signal)
          setConnectionEstablished(true)
        }
      } catch (err) {
        console.error('Error handling returned signal:', err)
      }
    })

    socketRef.current.on('room full', () => {
      toast.error('Room is full!')
    })

    socketRef.current.on('user left', (payload) => {
      try {
        let username = 'A user'
        
        // Use username from payload if available
        if (payload && payload.username) {
          const avatarInfo = getAvatarInfo(payload.username)
          username = avatarInfo.name
        } else if (payload && payload.userID) {
          // Fallback: find from users list
          const leftUser = users.find(u => u.id === payload.userID)
          if (leftUser && leftUser.name) {
            const avatarInfo = getAvatarInfo(leftUser.name)
            username = avatarInfo.name
          }
        }
        
        toast(`${username} left the room`)
        
        // Remove peer from mesh
        if (payload && payload.userID) {
          peersRef.current = peersRef.current.filter(p => {
            if (p.peerID === payload.userID) {
              if (p.peer) p.peer.destroy()
              return false
            }
            return true
          })
        }
        
        // Update connection status
        if (peersRef.current.length === 0) {
          setConnectionEstablished(false)
        }
        
        if (pendingOpRef.current) {
          toast.error('Transfer interrupted!')
        }
      } catch (err) {
        console.error('Error handling user left:', err)
      }
    })
  }

  const createPeer = (userToSignal, callerID) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.services.mozilla.com' },
        ]
      },
      channelConfig: {},
      offerOptions: {
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      }
    })

    peer.on('signal', (signal) => {
      socketRef.current.emit('sending signal', { userToSignal, callerID, signal })
    })

    peer.on('connect', () => {
      console.log('Peer connected')
      setConnectionEstablished(true)
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })

    peer.on('data', handleReceivingData)

    return peer
  }

  const addPeer = (incomingSignal, callerID) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.services.mozilla.com' },
        ]
      },
      channelConfig: {},
      answerOptions: {
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      }
    })

    peer.on('signal', (signal) => {
      socketRef.current.emit('returning signal', { signal, callerID })
    })

    peer.on('connect', () => {
      console.log('Peer connected')
      setConnectionEstablished(true)
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })

    peer.on('data', handleReceivingData)
    peer.signal(incomingSignal)

    return peer
  }

  const handleReceivingData = (data) => {
    const dataString = data.toString()

    if (dataString.includes('maxProgress')) {
      const parsed = JSON.parse(data)
      console.log('setReceivingFile called for:', currentUser?.name, 'maxChunks:', parsed.maxProgress)
      setReceivingFile({ maxChunks: parsed.maxProgress })
      setReceiveProgress(0)
      pendingOpRef.current = true
      toast.loading('Receiving file...', { id: 'receiving' })
    } else if (dataString.includes('done')) {
      const parsed = JSON.parse(data)
      fileNameRef.current = parsed.fileName
      setReceivingFile((prev) => ({ ...prev, name: parsed.fileName }))
      
      // Trigger download
      if (workerRef.current) {
        workerRef.current.postMessage('download')
      }
      
      // Don't add to received files list yet - wait for user to click download
      
      pendingOpRef.current = false
      toast.success('File received!', { id: 'receiving' })
      
      // Don't send confirmation yet - wait for user to click download
    } else if (dataString.includes('load')) {
      // Receiver accepted and downloaded the file
      // Only add to sent files if THIS user was the sender
      if (currentSendingFileRef.current) {
        const fileInfo = {
          name: currentSendingFileRef.current.name,
          size: currentSendingFileRef.current.size,
          id: Date.now(),
          timestamp: new Date()
        }
        
        console.log('File sent successfully, calling callback with:', fileInfo)
        
        // Call callback if set
        if (onFileSentCallbackRef.current) {
          onFileSentCallbackRef.current(fileInfo)
        }
        
        currentSendingFileRef.current = null
        setSendingFile(null)
        setSendProgress(0)
        pendingOpRef.current = false
        toast.success('File downloaded by recipient!', { id: 'sending' })
      } else {
        console.log('Received load confirmation but not the sender, ignoring')
      }
    } else if (dataString.includes('wait')) {
      // Receiver aborted - stop sending
      setSendingFile(null)
      setSendProgress(0)
      pendingOpRef.current = false
      toast.error('Receiver cancelled the download')
    } else {
      // Receiving file chunk - throttled progress update
      if (workerRef.current) {
        workerRef.current.postMessage(data)
      }
      throttle(() => {
        setReceiveProgress((prev) => prev + 1)
      }, 100)()
    }
  }

  const sendFile = async (file, targetUsers = null) => {
    // Check if we have any peer connections
    const activePeers = peersRef.current.length > 0 ? peersRef.current : (peerRef.current ? [{ peer: peerRef.current, peerID: 'single-peer' }] : [])
    
    console.log('sendFile called:', { 
      file: file.name, 
      targetUsers, 
      activePeersCount: activePeers.length,
      peersRefLength: peersRef.current.length,
      hasPeerRef: !!peerRef.current,
      connectionEstablished,
      connectedPeers: activePeers.filter(p => p.peer?.connected).length
    })
    
    // Check for actually connected peers instead of just connectionEstablished flag
    const connectedPeers = activePeers.filter(p => p.peer && p.peer.connected)
    
    if (connectedPeers.length === 0) {
      toast.error('No peer connected! Please wait for another user to join.')
      console.error('No connected peers found!', {
        activePeers: activePeers.length,
        connectedPeers: connectedPeers.length,
        peerStates: activePeers.map(p => ({ 
          id: p.peerID, 
          exists: !!p.peer, 
          connected: p.peer?.connected,
          destroyed: p.peer?.destroyed 
        }))
      })
      return
    }

    // If no target users specified, send to all connected peers
    let peersToSendTo = connectedPeers
    if (targetUsers && targetUsers.length > 0) {
      peersToSendTo = connectedPeers.filter(item => {
        const matches = targetUsers.includes(item.peerID)
        console.log('Checking peer:', { peerID: item.peerID, targetUsers, matches })
        return matches
      })
      
      console.log('Filtered peers:', { 
        targetUsers, 
        peersToSendToCount: peersToSendTo.length,
        allPeers: connectedPeers.map(p => p.peerID),
        connectedPeers: peersToSendTo.map(p => ({ id: p.peerID, connected: p.peer?.connected }))
      })
      
      if (peersToSendTo.length === 0) {
        toast.error('Selected users are not connected!')
        console.error('No matching peers found!', { targetUsers, availablePeers: connectedPeers.map(p => p.peerID) })
        return
      }
    }

    setSendingFile({ name: file.name, size: file.size })
    setSendProgress(0)
    pendingOpRef.current = true
    
    console.log('setSendingFile called for:', currentUser?.name, 'file:', file.name)
    
    // Store file info in ref for later use when 'load' event is received
    currentSendingFileRef.current = { name: file.name, size: file.size }

    const stream = file.stream()
    const reader = stream.getReader()
    const maxChunks = Math.floor(file.size / 65536)

    console.log('Starting file transfer:', { fileName: file.name, size: file.size, maxChunks })

    // Log transfer to backend
    try {
      const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'
      await axios.post(`${backendUrl}/log`, {
        roomID: roomId,
        data: file.size,
        UserID: currentUser?.name || 'unknown',
        PublicIP: publicIP || 'unknown'
      })
    } catch (err) {
      console.error('Failed to log transfer:', err)
    }

    // Send max progress to selected peers
    peersToSendTo.forEach(item => {
      if (item.peer && item.peer.connected) {
        try {
          item.peer.write(JSON.stringify({ maxProgress: maxChunks }))
          console.log('Sent maxProgress to peer:', item.peerID)
        } catch (err) {
          console.error('Error sending maxProgress:', err)
        }
      } else {
        console.warn('Peer not connected:', item.peerID, 'connected:', item.peer?.connected)
      }
    })
    
    const targetCount = peersToSendTo.length
    toast.loading(`Sending file to ${targetCount} user${targetCount > 1 ? 's' : ''}...`, { id: 'sending' })

    let chunkCount = 0

    const readChunk = async () => {
      const { done, value } = await reader.read()

      if (done) {
        console.log('File transfer complete, sending done signal')
        // Send done signal to selected peers
        peersToSendTo.forEach(item => {
          if (item.peer && item.peer.connected) {
            try {
              item.peer.write(JSON.stringify({ done: true, fileName: file.name }))
            } catch (err) {
              console.error('Error sending done signal:', err)
            }
          }
        })
        // Don't clear sending state yet - wait for confirmation
        toast.loading('Waiting for recipient to accept...', { id: 'sending' })
        return
      }

      chunkCount++
      if (chunkCount % 10 === 0) {
        console.log('Sending chunk:', chunkCount, '/', maxChunks)
      }
      throttle(() => {
        setSendProgress(chunkCount)
      }, 100)()
      
      // Send chunk to selected peers
      peersToSendTo.forEach(item => {
        if (item.peer && item.peer.connected) {
          try {
            item.peer.write(value)
          } catch (err) {
            console.error('Error sending chunk:', err)
          }
        }
      })
      
      await readChunk()
    }

    await readChunk()
  }

  const createPeerForPublicRoom = (userToSignal, callerID) => {
    try {
      // ✅ SSR Protection
      if (typeof window === 'undefined') {
        console.error('Cannot create peer in SSR environment')
        return null
      }
      
      // Validate Peer constructor
      if (!Peer || typeof Peer !== 'function') {
        console.error('Peer constructor is not available:', Peer)
        toast.error('WebRTC not available. Please refresh the page.')
        return null
      }
      
      // Validate parameters
      if (!userToSignal || !callerID) {
        console.error('Invalid parameters for peer creation:', { userToSignal, callerID })
        return null
      }

      console.log('Creating peer for:', userToSignal, 'from:', callerID)
      
      const peer = new Peer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun.services.mozilla.com' },
          ]
        },
        channelConfig: {},
        offerOptions: {
          offerToReceiveAudio: false,
          offerToReceiveVideo: false
        }
      })

      peer.on('signal', (signal) => {
        try {
          console.log('Sending signal to:', userToSignal)
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('sending signal', { userToSignal, callerID, signal })
          } else {
            console.error('Socket not connected, cannot send signal')
          }
        } catch (err) {
          console.error('Error sending signal:', err)
        }
      })

      peer.on('connect', () => {
        console.log('✓ Peer connected in public room to:', userToSignal)
        setConnectionEstablished(true)
        toast.success('Connected to peer!')
      })

      peer.on('close', () => {
        console.log('Peer connection closed:', userToSignal)
      })

      peer.on('error', (err) => {
        console.error('Peer error for', userToSignal, ':', err)
        toast.error('Peer connection error: ' + err.message)
      })

      peer.on('data', handleReceivingData)

      return peer
    } catch (err) {
      console.error('Error creating peer:', err)
      console.error('Peer constructor:', Peer)
      console.error('Error stack:', err.stack)
      return null
    }
  }

  const addPeerForPublicRoom = (incomingSignal, callerID) => {
    try {
      // ✅ SSR Protection
      if (typeof window === 'undefined') {
        console.error('Cannot create peer in SSR environment')
        return null
      }
      
      // Validate Peer constructor
      if (!Peer || typeof Peer !== 'function') {
        console.error('Peer constructor is not available:', Peer)
        toast.error('WebRTC not available. Please refresh the page.')
        return null
      }
      
      // Validate parameters
      if (!incomingSignal || !callerID) {
        console.error('Invalid parameters for peer creation:', { incomingSignal, callerID })
        return null
      }

      console.log('Adding peer from:', callerID)
      
      const peer = new Peer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun.services.mozilla.com' },
          ]
        },
        channelConfig: {},
        answerOptions: {
          offerToReceiveAudio: false,
          offerToReceiveVideo: false
        }
      })

      peer.on('signal', (signal) => {
        try {
          console.log('Returning signal to:', callerID)
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('returning signal', { signal, callerID })
          } else {
            console.error('Socket not connected, cannot return signal')
          }
        } catch (err) {
          console.error('Error returning signal:', err)
        }
      })

      peer.on('connect', () => {
        console.log('✓ Peer connected in public room from:', callerID)
        setConnectionEstablished(true)
        toast.success('Connected to peer!')
      })

      peer.on('close', () => {
        console.log('Peer connection closed:', callerID)
      })

      peer.on('error', (err) => {
        console.error('Peer error from', callerID, ':', err)
        toast.error('Peer connection error: ' + err.message)
      })

      peer.on('data', handleReceivingData)
      
      if (incomingSignal) {
        peer.signal(incomingSignal)
      } else {
        console.error('No incoming signal provided for peer from:', callerID)
      }

      return peer
    } catch (err) {
      console.error('Error adding peer:', err)
      console.error('Peer constructor:', Peer)
      console.error('Error stack:', err.stack)
      return null
    }
  }

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    if (peerRef.current) {
      peerRef.current.destroy()
    }
    // Destroy all public room peers
    peersRef.current.forEach(item => {
      if (item.peer) {
        item.peer.destroy()
      }
    })
    peersRef.current = []
    
    setConnectionEstablished(false)
    setUsers([])
    setCurrentUser(null)
    setRoomId(null)
  }

  const setOnFileSentCallback = (callback) => {
    onFileSentCallbackRef.current = callback
  }

  const value = {
    connectionEstablished,
    users,
    currentUser,
    sendingFile,
    sendProgress,
    receivingFile,
    receiveProgress,
    receivedFiles,
    roomId,
    showDownloadModal,
    pendingDownload,
    pastedImage,
    setPastedImage,
    joinRoom,
    joinPublicRoom,
    sendFile,
    sendFileToUsers: (file, targetUserIds) => sendFile(file, targetUserIds),
    leaveRoom,
    confirmDownload,
    cancelDownload,
    setOnFileSentCallback,
  }

  return (
    <RoomContext.Provider value={value}>
      <Toaster position="bottom-center" />
      {children}
    </RoomContext.Provider>
  )
}
