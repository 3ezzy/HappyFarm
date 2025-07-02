// Token storage keys
const TOKEN_KEY = 'happyfarm_token'
const USER_KEY = 'happyfarm_user'
const FARM_KEY = 'happyfarm_farm'

// Token management functions
export const saveToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(FARM_KEY)
}

// User data management
export const saveUserData = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export const getUserData = () => {
  const userData = localStorage.getItem(USER_KEY)
  return userData ? JSON.parse(userData) : null
}

// Farm data management
export const saveFarmData = (farm) => {
  if (farm) {
    localStorage.setItem(FARM_KEY, JSON.stringify(farm))
  }
}

export const getFarmData = () => {
  const farmData = localStorage.getItem(FARM_KEY)
  return farmData ? JSON.parse(farmData) : null
}

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken()
  const user = getUserData()
  return !!(token && user)
}

// Complete logout - clear all stored data
export const clearAllData = () => {
  removeToken()
} 