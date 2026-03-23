import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import io from 'socket.io-client'
import Peer from 'simple-peer'
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

    return () => {
      cleanup()
      if (workerRef.current) {
        workerRef.current.terminate()
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const handleWorkerMessage = (e) => {
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
    })

    socketRef.current.on('all users', (data) => {
      if (data.usersInThisRoom && data.usersInThisRoom.length > 0) {
        peerRef.current = createPeer(data.usersInThisRoom[0], socketRef.current.id)
      }
    })

    socketRef.current.on('usernames', (userList) => {
      console.log('Received usernames:', userList)
      setUsers(userList)
      const myUser = userList.find(u => u.id === socketRef.current.id)
      if (myUser) {
        setCurrentUser(myUser)
      }
    })

    socketRef.current.on('user joined', (payload) => {
      peerRef.current = addPeer(payload.signal, payload.callerID)
    })

    socketRef.current.on('receiving returned signal', (payload) => {
      peerRef.current.signal(payload.signal)
      setConnectionEstablished(true)
    })

    socketRef.current.on('room full', () => {
      // Room is full - silently handle
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
    })

    socketRef.current.on('all users', (data) => {
      console.log('Public room users:', data)
      
      // Set users list first
      if (data.usersNamesInThisRoom) {
        setUsers(data.usersNamesInThisRoom)
        const myUser = data.usersNamesInThisRoom.find(u => u.id === socketRef.current.id)
        if (myUser) {
          setCurrentUser(myUser)
        }
      }
      
      // Create peer connections to all existing users (mesh network)
      if (data.usersInThisRoom && data.usersInThisRoom.length > 0) {
        const peers = []
        data.usersInThisRoom.forEach(userID => {
          const peer = createPeerForPublicRoom(userID, socketRef.current.id)
          peers.push({
            peerID: userID,
            peer: peer
          })
        })
        peersRef.current = peers
        
        // Set connection established if we have at least one peer
        if (peers.length > 0) {
          setConnectionEstablished(true)
        }
      } else {
        // No other users yet, but we're in the room
        setConnectionEstablished(false)
      }
    })

    socketRef.current.on('usernames', (userList) => {
      console.log('Received usernames:', userList)
      setUsers(userList)
      const myUser = userList.find(u => u.id === socketRef.current.id)
      if (myUser) {
        setCurrentUser(myUser)
      }
    })

    socketRef.current.on('user joined', (payload) => {
      console.log('User joined:', payload.callerID)
      // Add new peer to mesh network
      const peer = addPeerForPublicRoom(payload.signal, payload.callerID)
      
      const peerItem = {
        peerID: payload.callerID,
        peer: peer
      }
      
      peersRef.current.push(peerItem)
      
      // Update connection status
      setConnectionEstablished(true)
      
      // Show username of joined user
      if (payload.username) {
        const avatarInfo = getAvatarInfo(payload.username)
        toast.success(`${avatarInfo.name} joined the room`)
      } else {
        toast.success('New user joined the room')
      }
    })

    socketRef.current.on('receiving returned signal', (payload) => {
      console.log('Receiving returned signal from:', payload.id)
      // Find the peer and signal it
      const item = peersRef.current.find(p => p.peerID === payload.id)
      if (item && item.peer) {
        item.peer.signal(payload.signal)
        setConnectionEstablished(true)
      }
    })

    socketRef.current.on('room full', () => {
      // Room is full - silently handle
    })

    socketRef.current.on('user left', (payload) => {
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
            p.peer.destroy()
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
      connectionEstablished 
    })
    
    if (activePeers.length === 0 || !connectionEstablished) {
      toast.error('No peer connected! Please wait for another user to join.')
      return
    }

    // If no target users specified, send to all
    let peersToSendTo = activePeers
    if (targetUsers && targetUsers.length > 0) {
      peersToSendTo = activePeers.filter(item => {
        const matches = targetUsers.includes(item.peerID)
        console.log('Checking peer:', { peerID: item.peerID, targetUsers, matches })
        return matches
      })
      
      console.log('Filtered peers:', { 
        targetUsers, 
        peersToSendToCount: peersToSendTo.length,
        allPeers: activePeers.map(p => p.peerID),
        connectedPeers: peersToSendTo.map(p => ({ id: p.peerID, connected: p.peer?.connected }))
      })
      
      if (peersToSendTo.length === 0) {
        toast.error('Selected users are not connected!')
        console.error('No matching peers found!', { targetUsers, availablePeers: activePeers.map(p => p.peerID) })
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
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.services.mozilla.com' },
        ]
      }
    })

    peer.on('signal', (signal) => {
      console.log('Sending signal to:', userToSignal)
      socketRef.current.emit('sending signal', { userToSignal, callerID, signal })
    })

    peer.on('connect', () => {
      console.log('Peer connected in public room to:', userToSignal)
      setConnectionEstablished(true)
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })

    peer.on('data', handleReceivingData)

    return peer
  }

  const addPeerForPublicRoom = (incomingSignal, callerID) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.services.mozilla.com' },
        ]
      }
    })

    peer.on('signal', (signal) => {
      console.log('Returning signal to:', callerID)
      socketRef.current.emit('returning signal', { signal, callerID })
    })

    peer.on('connect', () => {
      console.log('Peer connected in public room from:', callerID)
      setConnectionEstablished(true)
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })

    peer.on('data', handleReceivingData)
    peer.signal(incomingSignal)

    return peer
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
