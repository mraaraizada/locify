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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
