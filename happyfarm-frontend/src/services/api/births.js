import apiClient from './client.js'
import { BIRTH_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const birthService = {
  getAll: async (animalId) => {
    const response = await apiClient.get(BIRTH_ENDPOINTS.LIST(animalId))
    return response.data
  },

  create: async (animalId, payload) => {
    const response = await apiClient.post(BIRTH_ENDPOINTS.CREATE(animalId), payload)
    return response.data
  },

  update: async (id, payload) => {
    const response = await apiClient.put(BIRTH_ENDPOINTS.UPDATE(id), payload)
    return response.data
  },

  remove: async (id) => {
    const response = await apiClient.delete(BIRTH_ENDPOINTS.DELETE(id))
    return response.data
  }
}
