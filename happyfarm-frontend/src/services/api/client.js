import axios from 'axios'
import { API_BASE_URL } from '../../constants/apiEndpoints.js'
import { getToken, removeToken } from '../auth/tokenService.js'
import toast from 'react-hot-toast'
// Not a React component, so no useTranslation() — call the i18next
// instance's t() directly. Safe outside render: i18n.init() runs
// synchronously in src/i18n/index.js before this module is used.
import i18n from '../../i18n/index.js'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - remove token and redirect to login
          removeToken()
          toast.error(i18n.t('errors.sessionExpired'))
          window.location.href = '/login'
          break

        case 403:
          toast.error(i18n.t('errors.noPermission'))
          break

        case 404:
          toast.error(i18n.t('errors.notFound'))
          break

        case 422:
          // Validation errors - let the component handle these
          break

        case 500:
          toast.error(i18n.t('errors.serverError'))
          break

        default:
          if (data?.error) {
            // Server-supplied message (e.g. sacrifice eligibility) — this
            // one genuinely can't be localized client-side; see the phase-1
            // notes on backend-derived text vs. frontend i18n.
            toast.error(data.error)
          } else {
            toast.error(i18n.t('errors.unexpected'))
          }
      }
    } else if (error.request) {
      // Network error
      toast.error(i18n.t('errors.network'))
    } else {
      toast.error(i18n.t('errors.unexpected'))
    }
    
    return Promise.reject(error)
  }
)

export default apiClient 