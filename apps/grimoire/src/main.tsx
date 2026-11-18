import { StrictMode } from 'react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionProvider } from './contexts/MotionContext.tsx'
import { AnnouncerProvider } from './contexts/AnnouncerContext.tsx'
import './index.css'
import App from './App.tsx'

// Dev-only axe overlay — dynamic import is tree-shaken in production (import.meta.env.DEV === false).
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axeModule) => {
    axeModule.default(React, ReactDOM, 1000)
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    {/* basename lets the app run under a sub-path (e.g. GitHub Pages); it is "/" in dev */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MotionProvider>
        <AnnouncerProvider>
          <App />
        </AnnouncerProvider>
      </MotionProvider>
    </BrowserRouter>
  </StrictMode>,
)
