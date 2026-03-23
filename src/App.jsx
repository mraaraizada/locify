import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoadingPage from './pages/LoadingPage'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import Room from './pages/Room'
import PublicRoom from './pages/PublicRoom'
import { RoomProvider } from './context/RoomContext'

export default function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <BrowserRouter>
        <RoomProvider>
          <Routes>
            <Route path="/" element={<LoadingPage />} />
            <Route path="/home" element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/dashboard" element={<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/room/:roomID" element={<Room />} />
            <Route path="/public/:roomID" element={<PublicRoom />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RoomProvider>
      </BrowserRouter>
    </div>
  )
}
