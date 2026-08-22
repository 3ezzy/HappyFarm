import { createContext, useContext, useReducer, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { authService } from '../services/api/auth.js'
import { getUserData, getFarmData, isAuthenticated, saveFarmData } from '../services/auth/tokenService.js'
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
  SET_FARM: 'SET_FARM',
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
    
    case AUTH_ACTIONS.SET_FARM:
      return {
        ...state,
        farm: { ...state.farm, ...action.payload }
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
  const { t } = useTranslation()
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
      
      toast.success(t('auth.welcomeBackToast', { name: data.user.name }))
      return data
    } catch (error) {
      const errorMessage = error.response?.data?.error || t('errors.unexpected')
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      throw error
    }
  }

  // Register function. A new account starts 'pending' and the backend
  // issues no token (see AuthController::register()) — only dispatch
  // SET_USER when one actually comes back, otherwise this would flip
  // isAuthenticated true with nothing in storage to back it, and the next
  // API call would 401.
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const data = await authService.register(userData)

      if (data.token) {
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: { user: data.user, farm: data.farm }
        })
        toast.success(t('auth.welcomeNewToast', { name: data.user.name }))
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        // Backend-supplied text (same reasoning as sacrifice-eligibility
        // messages elsewhere) — the pending-approval wording is a business
        // decision, not something to duplicate/localize client-side.
        toast.success(data.message)
      }

      return data
    } catch (error) {
      const errorMessage = error.response?.data?.error || t('errors.unexpected')
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success(t('auth.loggedOutToast'))
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

  // Update the cached farm (e.g. after a rename) so every page reading
  // farm data from this context — not just the one that made the
  // request — reflects it without needing a fresh login.
  const updateFarmName = (updatedFarm) => {
    const farm = { ...state.farm, ...updatedFarm }
    saveFarmData(farm)
    dispatch({ type: AUTH_ACTIONS.SET_FARM, payload: farm })
  }

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateFarmName
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