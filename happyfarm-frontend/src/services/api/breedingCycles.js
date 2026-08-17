import apiClient from './client.js'
import { BREEDING_CYCLE_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const breedingCycleService = {
  getAll: async (animalId) => {
    const response = await apiClient.get(BREEDING_CYCLE_ENDPOINTS.LIST(animalId))
    return response.data
  },

  create: async (animalId, payload) => {
    const response = await apiClient.post(BREEDING_CYCLE_ENDPOINTS.CREATE(animalId), payload)
    return response.data
  },

  update: async (id, payload) => {
    const response = await apiClient.put(BREEDING_CYCLE_ENDPOINTS.UPDATE(id), payload)
    return response.data
  },

  remove: async (id) => {
    const response = await apiClient.delete(BREEDING_CYCLE_ENDPOINTS.DELETE(id))
    return response.data
  },

  pregnancyCheck: async (id, payload) => {
    const response = await apiClient.post(BREEDING_CYCLE_ENDPOINTS.PREGNANCY_CHECK(id), payload)
    return response.data
  },

  wean: async (id, payload) => {
    const response = await apiClient.post(BREEDING_CYCLE_ENDPOINTS.WEAN(id), payload)
    return response.data
  }
}
