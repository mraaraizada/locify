import React from 'react'
import { motion } from 'framer-motion'
import { getAvatarInfo, getAvatarColor } from '../utils/avatarGen'

const Avatar = ({ index, children, ...other }) => {
  const userInfo = getAvatarInfo(index)
  const color = getAvatarColor(index)

  return (
    <motion.div className="peer-avatar-you" {...other}>
      <div className="flex-col-center-you">
        <motion.img 
          src={userInfo ? userInfo.path : null}
          alt={userInfo ? userInfo.name : 'User'}
          animate={{ y: 0 }} 
          initial={{ y: -200 }}
          className="avatar-img"
          style={{ filter: `drop-shadow(0 4px 6px ${color}40)` }}
          onError={(e) => {
            // Fallback to colored circle with initial
            e.target.style.display = 'none'
            const fallback = document.createElement('div')
            fallback.className = 'avatar-fallback'
            fallback.style.background = color
            fallback.textContent = userInfo.initial
            e.target.parentElement.appendChild(fallback)
          }}
        />
        <motion.div 
          className="user-info-you" 
          animate={{ y: 0 }} 
          initial={{ y: -200 }}
        >
          <h2 className="text-[#0F172A] dark:text-white">{userInfo ? userInfo.name : null}</h2>
          {userInfo ? children : null}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Avatar
