// Base API URL - can be configured via environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/register',
  LOGIN: '/login',
  LOGOUT: '/logout',
  USER: '/user'
}

// Farm management endpoints
export const FARM_ENDPOINTS = {
  DETAILS: '/farm',
  STATISTICS: '/farm/statistics'
}

// Animal management endpoints
export const ANIMAL_ENDPOINTS = {
  LIST: '/animals',
  CREATE: '/animals',
  DETAILS: (id) => `/animals/${id}`,
  FEED: (id) => `/animals/${id}/feed`,
  GROOM: (id) => `/animals/${id}/groom`,
  SACRIFICE: (id) => `/animals/${id}/sacrifice`
}

// Complete endpoint URLs
export const getEndpointUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
} 