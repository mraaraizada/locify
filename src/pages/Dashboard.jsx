import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { hri } from 'human-readable-ids'
import {
  LogOut, Moon, Sun, ArrowRight, Plus, DoorOpen, Users
} from 'lucide-react'
import { encodeRoomId, decodeRoomId } from '../utils/roomIdEncoder'

export default function Dashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const [roomInput, setRoomInput] = useState('')

  const createRoom = () => {
    // Generate human-readable room ID (e.g., "happy-blue-tiger")
    const roomId = hri.random()
    // Encode for URL
    const encodedRoomId = encodeRoomId(roomId)
    navigate(`/room/${encodedRoomId}`)
  }

  const createPublicRoom = () => {
    // Generate human-readable room ID for public room
    const roomId = hri.random()
    const encodedRoomId = encodeRoomId(roomId)
    navigate(`/public/${encodedRoomId}`)
  }

  const joinRoom = () => {
    if (roomInput.trim()) {
      // Encode room ID if it's not already encoded
      const encodedRoomId = encodeRoomId(roomInput.trim())
      navigate(`/room/${encodedRoomId}`)
    }
  }

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
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <LogOut size={14} /> Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extrabold text-[#0F172A] dark:text-white mb-4">
            Start Sharing Files
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-lg">
            Create a new room or join an existing one to start transferring files
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Create Private Room */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22C55E]/20 to-[#3B82F6]/20 flex items-center justify-center">
              <Plus size={32} className="text-[#22C55E]" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">Private Room</h2>
              <p className="text-[#64748B] dark:text-slate-400 text-sm">
                1-to-1 secure file sharing
              </p>
            </div>
            <button
              onClick={createRoom}
              className="w-full flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Private Room <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* Create Public Room */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-purple-200 dark:border-purple-700 flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Users size={32} className="text-purple-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">Public Room</h2>
              <p className="text-[#64748B] dark:text-slate-400 text-sm">
                Multi-user room (up to 5 users)
              </p>
            </div>
            <button
              onClick={createPublicRoom}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Public Room <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-purple-500/20 flex items-center justify-center">
              <DoorOpen size={32} className="text-[#3B82F6]" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">Join Room</h2>
              <p className="text-[#64748B] dark:text-slate-400 text-sm">
                Enter a room ID to join
              </p>
            </div>
            <input
              type="text"
              placeholder="Enter room ID..."
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
            />
            <button
              onClick={joinRoom}
              disabled={!roomInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Join Room <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-4 gap-4"
        >
          {[
            { label: 'P2P Transfer', desc: 'Direct browser-to-browser', color: 'text-[#22C55E]' },
            { label: 'Private Rooms', desc: '1-to-1 secure sharing', color: 'text-[#3B82F6]' },
            { label: 'Public Rooms', desc: 'Up to 5 users', color: 'text-purple-500' },
            { label: 'Encrypted', desc: 'End-to-end secure', color: 'text-pink-500' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700"
            >
              <div className={`text-lg font-bold ${item.color} mb-1`}>{item.label}</div>
              <div className="text-xs text-[#64748B] dark:text-slate-400">{item.desc}</div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
