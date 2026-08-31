import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { C } from './theme/colors.js'
import './i18n/index.js'
import './index.css'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
              position="top-center"
              toastOptions={{
                duration: 2800,
                // react-hot-toast styles its portal via a style object, so
                // these stay inline — but the values come from the palette.
                // Matches the .hf-toast spec: dark ink background, green
                // icon by default, red icon for error toasts.
                style: {
                  background: C.ink900,
                  color: '#fff',
                  fontFamily: "'IBM Plex Sans Arabic', 'Readex Pro', system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: '14px',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 12px rgba(19, 26, 20, .08)',
                },
                success: {
                  iconTheme: { primary: C.meadow500, secondary: C.ink900 },
                },
                error: {
                  iconTheme: { primary: C.dangerFg, secondary: C.ink900 },
                },
              }}
            />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 