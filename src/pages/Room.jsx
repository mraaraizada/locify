import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  LogOut, Upload, Download, FileText, Film, Image,
  Music, Archive, Moon, Sun, Copy, Check, QrCode as QrCodeIcon,
  Users, Wifi, X, CloudUpload, AlertCircle, Share2
} from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import Avatar from '../components/Avatar'
import DownloadModal from '../components/DownloadModal'
import ImagePreviewModal from '../components/ImagePreviewModal'
import { decodeRoomId } from '../utils/roomIdEncoder'

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return Film
  if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return Music
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive
  return FileText
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}



function TransferItem({ file, progress, maxProgress }) {
  const Icon = getFileIcon(file.name)
  const percentage = maxProgress > 0 ? Math.min((progress / maxProgress) * 100, 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon size={18} className="text-[#3B82F6]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0F172A] dark:text-white truncate max-w-[180px]">
              {file.name}
            </div>
            <div className="text-xs text-[#64748B]">{formatBytes(file.size)}</div>
          </div>
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-[#22C55E] to-[#3B82F6] h-2 rounded-full"
          style={{ width: `${percentage}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#64748B]">
        <span>{percentage >= 100 ? '✓ Complete' : `${Math.round(percentage)}%`}</span>
        <span>{percentage >= 100 ? '' : 'Sending...'}</span>
      </div>
    </motion.div>
  )
}

function ReceivedItem({ file }) {
  const Icon = getFileIcon(file.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Icon size={18} className="text-[#22C55E]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[#0F172A] dark:text-white truncate max-w-[160px]">
            {file.name}
          </div>
          <div className="text-xs text-[#64748B]">
            {new Date(file.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
        <Check size={13} />
        Downloaded
      </div>
    </motion.div>
  )
}

export default function Room() {
  const { roomID } = useParams()
  const navigate = useNavigate()
  const {
    connectionEstablished,
    users,
    currentUser,
    sendingFile,
    sendProgress,
    receivingFile,
    receiveProgress,
    receivedFiles,
    showDownloadModal,
    pendingDownload,
    pastedImage,
    setPastedImage,
    joinRoom,
    sendFile,
    leaveRoom,
    confirmDownload,
    cancelDownload,
  } = useRoom()

  const [darkMode, setDarkMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [decodedRoomId, setDecodedRoomId] = useState('')

  useEffect(() => {
    if (roomID) {
      // Decode the room ID for display
      const decoded = decodeRoomId(roomID)
      setDecodedRoomId(decoded)
      // Join with decoded ID
      joinRoom(decoded)
    }

    return () => {
      leaveRoom()
    }
  }, [roomID])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const onDrop = async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      setPendingFiles((prev) => [...prev, file])
      await sendFile(file)
      setPendingFiles((prev) => prev.filter((f) => f !== file))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const copyRoomId = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareRoom = async () => {
    const shareData = {
      title: 'Join my Locify room',
      text: 'Click to join my file sharing room',
      url: window.location.href
    }

    try {
      if (navigator.share) {
        // Use native Web Share API if available
        await navigator.share(shareData)
      } else {
        // Fallback to copy link
        copyRoomId()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // User cancelled, ignore
        copyRoomId()
      }
    }
  }

  const handleLeave = () => {
    leaveRoom()
    navigate('/home')
  }

  // Display decoded room ID (human-readable)
  const displayRoomId = decodedRoomId || 'Loading...'

  return (
    <div className="min-h-screen bg-page-gradient dark:bg-dark-gradient text-[#0F172A] dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="glass dark:glass-dark rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
            <button onClick={() => navigate('/home')} className="flex items-center gap-2">
              <img src="/logo.png" alt="Locify" className="w-8 h-8 rounded-xl shadow" />
              <span className="font-bold text-[#0F172A] dark:text-white hidden sm:block">Locify</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5">
                <Wifi size={14} className={connectionEstablished ? 'text-[#22C55E]' : 'text-slate-400'} />
                <span className="text-xs font-mono font-semibold text-[#0F172A] dark:text-white">
                  {displayRoomId}
                </span>
                <button onClick={copyRoomId} className="text-slate-400 hover:text-[#3B82F6] transition-colors ml-1">
                  {copied ? <Check size={13} className="text-[#22C55E]" /> : <Copy size={13} />}
                </button>
              </div>
              <button
                onClick={shareRoom}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#22C55E] transition-colors"
                title="Share Room"
              >
                <Share2 size={15} />
              </button>
              <button
                onClick={() => setShowQR((v) => !v)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#3B82F6] transition-colors"
                title="QR Code"
              >
                <QrCodeIcon size={15} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={handleLeave}
                className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 transition-all"
              >
                <LogOut size={14} /> Leave
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-md w-full border border-slate-200 dark:border-slate-700"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
                  Scan to Join Room
                </h3>
                <p className="text-sm text-[#64748B] dark:text-slate-400">
                  Share this QR code or room link with others
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <QRCodeSVG 
                  value={window.location.href}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Room ID */}
              <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
                <p className="text-xs text-[#64748B] dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Room ID
                </p>
                <p className="text-lg font-mono font-bold text-[#3B82F6] break-all">
                  {displayRoomId}
                </p>
              </div>

              {/* URL */}
              <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
                <p className="text-xs text-[#64748B] dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Share Link
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[#0F172A] dark:text-white font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowQR(false)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Connection Status */}
          {!connectionEstablished && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 flex items-center gap-3"
            >
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Waiting for peer to connect...
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Share the room link with someone to start transferring files
                </p>
              </div>
            </motion.div>
          )}

          {/* Online Users - Split Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-md border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                <Users size={16} className="text-[#3B82F6]" />
                Users Online
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-[#22C55E] font-semibold px-2.5 py-0.5 rounded-full">
                {users.length} connected
              </span>
            </div>
            
            {users.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No users connected yet</p>
            ) : (
              <div className="flex justify-between items-center gap-4">
                {/* Other Users - Left Side (Smaller) */}
                <div className="flex flex-wrap gap-4 flex-1">
                  {users.filter(user => user.id !== currentUser?.id).map((user) => (
                    <div key={user.id} className="avatar-small">
                      <Avatar 
                        index={user.name || 1}
                      />
                    </div>
                  ))}
                  {users.filter(user => user.id !== currentUser?.id).length === 0 && (
                    <p className="text-xs text-slate-400">Waiting for others...</p>
                  )}
                </div>
                
                {/* Current User - Right Side (Larger) */}
                {currentUser && (
                  <div className="flex">
                    <Avatar 
                      index={currentUser.name || 1}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            {...getRootProps()}
            className={`
              cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all
              flex flex-col items-center justify-center gap-4
              ${
                isDragActive
                  ? 'border-[#22C55E] bg-green-50 dark:bg-green-900/10 scale-[1.02]'
                  : 'border-slate-300 dark:border-slate-600 bg-[#F9FAFB] dark:bg-slate-800/50 hover:border-[#3B82F6] hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
              }
              ${!connectionEstablished ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} disabled={!connectionEstablished} />
            <motion.div
              animate={isDragActive ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22C55E]/20 to-[#3B82F6]/20 flex items-center justify-center"
            >
              <CloudUpload size={32} className={isDragActive ? 'text-[#22C55E]' : 'text-[#3B82F6]'} />
            </motion.div>
            {isDragActive ? (
              <p className="text-[#22C55E] font-semibold text-lg">Drop to send!</p>
            ) : (
              <>
                <p className="text-[#0F172A] dark:text-white font-semibold text-lg">Drag Files Here</p>
                <p className="text-[#64748B] dark:text-slate-400 text-sm">or</p>
                <button
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-2.5 rounded-full shadow transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!connectionEstablished}
                >
                  <Upload size={16} /> Select File
                </button>
                <p className="text-xs text-[#94A3B8]">
                  {connectionEstablished ? 'Any file type • No size limit' : 'Waiting for connection...'}
                </p>
              </>
            )}
          </motion.div>

          {/* Sending File */}
          {sendingFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-md border border-slate-100 dark:border-slate-700"
            >
              <h3 className="font-semibold text-[#0F172A] dark:text-white flex items-center gap-2 mb-4">
                <Upload size={16} className="text-[#3B82F6]" />
                Sending
              </h3>
              <TransferItem
                file={sendingFile}
                progress={sendProgress}
                maxProgress={Math.floor(sendingFile.size / 65536)}
              />
            </motion.div>
          )}

          {/* Receiving File */}
          {receivingFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-md border border-slate-100 dark:border-slate-700"
            >
              <h3 className="font-semibold text-[#0F172A] dark:text-white flex items-center gap-2 mb-4">
                <Download size={16} className="text-[#22C55E]" />
                Receiving
              </h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Download size={18} className="text-[#22C55E]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0F172A] dark:text-white truncate max-w-[180px]">
                        {receivingFile.name || 'Incoming file...'}
                      </div>
                      <div className="text-xs text-[#64748B]">Receiving...</div>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-[#22C55E] to-[#3B82F6] h-2 rounded-full"
                    style={{
                      width: `${
                        receivingFile.maxChunks > 0
                          ? Math.min((receiveProgress / receivingFile.maxChunks) * 100, 100)
                          : 0
                      }%`,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>
                    {receivingFile.maxChunks > 0
                      ? `${Math.round((receiveProgress / receivingFile.maxChunks) * 100)}%`
                      : '0%'}
                  </span>
                  <span>
                    {receiveProgress} / {receivingFile.maxChunks || 0} chunks
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Room Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-[#22C55E]/10 to-[#3B82F6]/10 border border-slate-200 dark:border-slate-700 rounded-3xl p-5"
          >
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-3">Room Info</h3>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: 'Status',
                  value: connectionEstablished ? 'Connected' : 'Waiting',
                  color: connectionEstablished ? 'text-[#22C55E]' : 'text-yellow-500',
                },
                { label: 'Protocol', value: 'WebRTC P2P', color: 'text-[#3B82F6]' },
                { label: 'Encryption', value: 'E2E Encrypted', color: 'text-purple-500' },
                {
                  label: 'Peers',
                  value: `${users.length} online`,
                  color: 'text-[#0F172A] dark:text-white',
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-[#64748B] dark:text-slate-400">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={copyRoomId}
              className="mt-4 w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium px-4 py-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              {copied ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Room Link'}
            </button>
          </motion.div>

          {/* Received Files */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-md border border-slate-100 dark:border-slate-700 flex-1"
          >
            <h3 className="font-semibold text-[#0F172A] dark:text-white flex items-center gap-2 mb-4">
              <Download size={16} className="text-[#22C55E]" />
              Received ({receivedFiles.length})
            </h3>
            <div className="flex flex-col gap-3">
              {receivedFiles.map((file) => (
                <ReceivedItem key={file.id} file={file} />
              ))}
            </div>
            {receivedFiles.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">No files received yet</div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <DownloadModal
        isOpen={showDownloadModal}
        file={pendingDownload}
        onDownload={confirmDownload}
        onCancel={cancelDownload}
      />
      <ImagePreviewModal
        isOpen={!!pastedImage}
        image={pastedImage}
        onSend={() => {
          sendFile(pastedImage.file)
          setPastedImage(null)
        }}
        onCancel={() => setPastedImage(null)}
      />
    </div>
  )
}
