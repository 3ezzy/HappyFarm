import apiClient from './client.js'
import { FARM_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const farmService = {
  // Get farm details
  getDetails: async () => {
    try {
      const response = await apiClient.get(FARM_ENDPOINTS.DETAILS)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get farm statistics
  getStatistics: async () => {
    try {
      const response = await apiClient.get(FARM_ENDPOINTS.STATISTICS)
      return response.data
    } catch (error) {
      throw error
    }
  }
} 