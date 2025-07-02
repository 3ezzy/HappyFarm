import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'

// Layout Components
import Layout from './components/common/Layout/Layout.jsx'
import LoadingSpinner from './components/common/UI/LoadingSpinner.jsx'

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

// Page Components
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Animals from './pages/animals/Animals.jsx'
import AnimalDetails from './pages/animals/AnimalDetails.jsx'
import AddAnimal from './pages/animals/AddAnimal.jsx'
import Farm from './pages/farm/Farm.jsx'
import Profile from './pages/profile/Profile.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  const { isLoading, isAuthenticated } = useAuth()

  // Show loading spinner while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Register />
          } 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            {/* Animal Management Routes */}
            <Route path="animals" element={<Animals />} />
            <Route path="animals/add" element={<AddAnimal />} />
            <Route path="animals/:id" element={<AnimalDetails />} />
            
            {/* Farm Management Routes */}
            <Route path="farm" element={<Farm />} />
            
            {/* Profile Routes */}
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App 