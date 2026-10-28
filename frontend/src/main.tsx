import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './light-theme.css'
import App from './App.tsx'
import { applyTheme, getTheme } from './lib/theme'

applyTheme(getTheme())

// After a deploy, an open tab (or one served by the previous service worker) can request
// lazy chunks that no longer exist, which leaves a blank page. Reload once to pick up the
// new build; the timestamp guard prevents a reload loop if the chunk is genuinely broken.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  try {
    const last = Number(sessionStorage.getItem('vibe_chunk_reload') || 0)
    if (Date.now() - last < 10000) return
    sessionStorage.setItem('vibe_chunk_reload', String(Date.now()))
  } catch {
    // storage blocked: still reload once
  }
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
