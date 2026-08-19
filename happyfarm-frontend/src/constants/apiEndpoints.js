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
  UPDATE: (id) => `/animals/${id}`,
  DELETE: (id) => `/animals/${id}`,
  RESTORE: (id) => `/animals/${id}/restore`,
  EXIT: (id) => `/animals/${id}/exit`,
  FEED: (id) => `/animals/${id}/feed`,
  GROOM: (id) => `/animals/${id}/groom`,
  SACRIFICE: (id) => `/animals/${id}/sacrifice`,
  WEIGHTS: (id) => `/animals/${id}/weights`
}

// Weight record endpoints (edit/delete a single record, by its own id —
// not scoped under /animals/{id} like the list/create routes above)
export const WEIGHT_ENDPOINTS = {
  UPDATE: (id) => `/weights/${id}`,
  DELETE: (id) => `/weights/${id}`
}

// Breed lookup endpoint
export const BREED_ENDPOINTS = {
  LIST: '/breeds'
}

// Breeding cycle endpoints — list/create are scoped under the dam's animal
// id; edit/delete/pregnancy-check/wean act on the cycle's own id.
export const BREEDING_CYCLE_ENDPOINTS = {
  LIST: (animalId) => `/animals/${animalId}/breeding-cycles`,
  CREATE: (animalId) => `/animals/${animalId}/breeding-cycles`,
  UPDATE: (id) => `/breeding-cycles/${id}`,
  DELETE: (id) => `/breeding-cycles/${id}`,
  PREGNANCY_CHECK: (id) => `/breeding-cycles/${id}/pregnancy-check`,
  WEAN: (id) => `/breeding-cycles/${id}/wean`
}

// Birth endpoints — same shape as breeding cycles.
export const BIRTH_ENDPOINTS = {
  LIST: (animalId) => `/animals/${animalId}/births`,
  CREATE: (animalId) => `/animals/${animalId}/births`,
  UPDATE: (id) => `/births/${id}`,
  DELETE: (id) => `/births/${id}`
}

// Health record endpoints — same shape again.
export const HEALTH_RECORD_ENDPOINTS = {
  LIST: (animalId) => `/animals/${animalId}/health-records`,
  CREATE: (animalId) => `/animals/${animalId}/health-records`,
  UPDATE: (id) => `/health-records/${id}`,
  DELETE: (id) => `/health-records/${id}`
}

// Alerts — computed at read time on the farm, no per-animal scoping.
export const ALERT_ENDPOINTS = {
  LIST: '/alerts',
  DISMISS: '/alerts/dismiss'
}

// Complete endpoint URLs
export const getEndpointUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
} 