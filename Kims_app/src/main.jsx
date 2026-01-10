import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.log('PWA service worker registration failed');
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 