import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const NODE_COUNT = 8

function NetworkNodes() {
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = (i / NODE_COUNT) * 2 * Math.PI
    const radius = 90
    return {
      id: i,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    }
  })

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        {/* Connection lines */}
        {nodes.map((node, i) =>
          nodes.slice(i + 1).map((other, j) => {
            const dist = Math.hypot(node.x - other.x, node.y - other.y)
            if (dist < 110) {
              return (
                <motion.line
                  key={`line-${i}-${j}`}
                  x1={node.x} y1={node.y}
                  x2={other.x} y2={other.y}
                  stroke="url(#lineGrad)"
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.2 }}
                />
              )
            }
            return null
          })
        )}
        {/* Center node */}
        <motion.circle
          cx="100" cy="100" r="8"
          fill="#22C55E"
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Outer glow ring */}
        <motion.circle
          cx="100" cy="100" r="14"
          fill="none"
          stroke="#22C55E"
          strokeWidth="1"
          strokeOpacity="0.3"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Outer nodes */}
        {nodes.map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.x} cy={node.y} r="5"
            fill="#3B82F6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.7, 1, 0.7], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5 + i * 0.15, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
        {/* Traveling packets */}
        {nodes.slice(0, 4).map((node, i) => (
          <motion.circle
            key={`packet-${i}`}
            cx={node.x} cy={node.y} r="3"
            fill="#22C55E"
            animate={{
              cx: [node.x, 100, nodes[(i + 4) % NODE_COUNT].x],
              cy: [node.y, 100, nodes[(i + 4) % NODE_COUNT].y],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          />
        ))}
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default function LoadingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 3200)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#E6F6FF] via-[#F8FAFC] to-[#F0FBFF]">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex items-center gap-2"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#3B82F6] flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <span className="text-3xl font-bold text-[#0F172A] tracking-tight">Locify</span>
      </motion.div>

      {/* Network Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <NetworkNodes />
      </motion.div>

      {/* Status Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-6 text-[#3B82F6] font-semibold text-lg tracking-wide"
      >
        Connecting Secure Channel...
      </motion.p>

      {/* Dot loader */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-2 mt-4"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#22C55E]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-8 text-sm text-[#64748B] font-medium"
      >
        P2P Secure File Sharing
      </motion.p>
    </div>
  )
}
