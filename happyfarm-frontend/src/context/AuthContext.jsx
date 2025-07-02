import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/api/auth.js'
import { getUserData, getFarmData, isAuthenticated, clearAllData } from '../services/auth/tokenService.js'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  farm: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        farm: action.payload.farm,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }
    
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (isAuthenticated()) {
          const user = getUserData()
          const farm = getFarmData()
          
          if (user && farm) {
            dispatch({
              type: AUTH_ACTIONS.SET_USER,
              payload: { user, farm }
            })
          } else {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const data = await authService.login(credentials)
      
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: { user: data.user, farm: data.farm }
      })
      
      toast.success(`Welcome back, ${data.user.name}!`)
      return data
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const data = await authService.register(userData)
      
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: { user: data.user, farm: data.farm }
      })
      
      toast.success(`Welcome to HappyFarm, ${data.user.name}!`)
      return data
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Logged out successfully')
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      console.error('Logout error:', error)
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 