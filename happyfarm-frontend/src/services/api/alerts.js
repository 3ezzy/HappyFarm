import apiClient from './client.js'
import { ALERT_ENDPOINTS } from '../../constants/apiEndpoints.js'

// Alerts are computed on the backend at read time (no scheduler/queue) —
// this service just fetches the current list and reports dismissals; it
// never computes due dates or thresholds itself.
export const alertService = {
  getAll: async () => {
    const response = await apiClient.get(ALERT_ENDPOINTS.LIST)
    return response.data
  },

  dismiss: async (key) => {
    const response = await apiClient.post(ALERT_ENDPOINTS.DISMISS, { key })
    return response.data
  }
}
