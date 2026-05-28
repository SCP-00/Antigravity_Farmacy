import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import * as Sentry from '@sentry/react'
import App from './app'
import { PWAUpdatePrompt } from './components/shared/PWAUpdatePrompt'
import './index.css'

// Sentry — error tracking (solo si SENTRY_DSN está configurado)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.PROD ? 'production' : 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0.0,
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   1000 * 60 * 5,  // 5 minutos
      retry:       1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fff',
            color: '#1A2B23',
            border: '1px solid #D8EBE4',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(15,110,86,0.12)',
          },
          success: { iconTheme: { primary: '#0F6E56', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#A32D2D', secondary: '#fff' } },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <PWAUpdatePrompt />
    </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
)