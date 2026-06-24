import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
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
                style: {
                  background: '#FBFAF1',
                  color: '#574A30',
                  fontFamily: "'Zilla Slab', serif",
                  fontWeight: 600,
                  fontSize: '15px',
                  border: '3px solid #C7E9D2',
                  borderRadius: '9999px',
                  padding: '10px 18px',
                  boxShadow: '0 10px 20px -3px rgba(107,92,67,0.22)',
                },
                success: {
                  iconTheme: { primary: '#008160', secondary: '#FBFAF1' },
                  style: { border: '3px solid #C7E9D2' },
                },
                error: {
                  iconTheme: { primary: '#D83A3A', secondary: '#FBFAF1' },
                  style: { border: '3px solid #F6CFCB' },
                },
              }}
            />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 