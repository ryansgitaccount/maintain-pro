import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker using vite-plugin-pwa
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available; please refresh.')
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 