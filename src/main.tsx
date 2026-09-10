import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { App } from '@/app/App'
import { reportClientError } from '@/lib/monitoring/report-client-error'
import '@/styles/globals.css'

window.addEventListener('error', (event) => {
  reportClientError('WINDOW_ERROR', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  reportClientError('UNHANDLED_REJECTION', event.reason)
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz de la aplicación.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
