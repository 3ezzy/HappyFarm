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
  },

  // Change password (requires the current password)
  updatePassword: async ({ currentPassword, password, passwordConfirmation }) => {
    const response = await apiClient.put(AUTH_ENDPOINTS.UPDATE_PASSWORD, {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation
    })
    return response.data
  },

  // Request a password reset link. Backend always returns the same
  // generic message whether or not the email is registered.
  forgotPassword: async (email) => {
    const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email })
    return response.data
  },

  // Complete a password reset with the token/email from the emailed link.
  resetPassword: async ({ token, email, password, passwordConfirmation }) => {
    const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation
    })
    return response.data
  }
}
