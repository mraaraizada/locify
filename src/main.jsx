import { Buffer } from 'buffer'
import process from 'process'

// Polyfills for Node.js globals in browser - MUST be set before importing util
window.Buffer = Buffer
window.process = process
window.global = globalThis

// Now import util after process is available
import util from 'util'
window.util = util

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress browser extension errors
const originalError = console.error
console.error = (...args) => {
  // Filter out extension-related errors
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('message port closed') ||
     args[0].includes('Extension context invalidated') ||
     args[0].includes('Receiving end does not exist'))
  ) {
    return // Suppress these errors
  }
  originalError.apply(console, args)
}

// Handle unhandled promise rejections from extensions
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    typeof event.reason.message === 'string' &&
    (event.reason.message.includes('message port closed') ||
     event.reason.message.includes('Extension context invalidated'))
  ) {
    event.preventDefault() // Suppress extension errors
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
