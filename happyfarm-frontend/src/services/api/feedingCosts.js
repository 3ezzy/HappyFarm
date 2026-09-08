import apiClient from './client.js'
import { FEEDING_COST_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const feedingCostService = {
  getAll: async (animalId) => {
    const response = await apiClient.get(FEEDING_COST_ENDPOINTS.LIST(animalId))
    return response.data
  },

  create: async (animalId, payload) => {
    const response = await apiClient.post(FEEDING_COST_ENDPOINTS.CREATE(animalId), payload)
    return response.data
  }
}
