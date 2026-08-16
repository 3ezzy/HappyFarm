import apiClient from './client.js'
import { AUTH_ENDPOINTS } from '../../constants/apiEndpoints.js'
import { saveToken, saveUserData, saveFarmData, clearAllData } from '../auth/tokenService.js'

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, userData)

    // Save token and user data on successful registration
    if (response.data.token) {
      saveToken(response.data.token)
      saveUserData(response.data.user)
      saveFarmData(response.data.farm)
    }

    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials)

    // Save token and user data on successful login
    if (response.data.token) {
      saveToken(response.data.token)
      saveUserData(response.data.user)
      saveFarmData(response.data.farm)
    }

    return response.data
  },

  // Logout user
  logout: async () => {
    try {
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT)
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error('Logout error:', error)
    } finally {
      // Always clear local data
      clearAllData()
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await apiClient.get(AUTH_ENDPOINTS.USER)
    return response.data
  },

  // Refresh user data
  refreshUserData: async () => {
    const response = await apiClient.get(AUTH_ENDPOINTS.USER)
    if (response.data) {
      saveUserData(response.data)
    }
    return response.data
  }
}
