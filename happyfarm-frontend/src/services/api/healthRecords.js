import apiClient from './client.js'
import { HEALTH_RECORD_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const healthRecordService = {
  getAll: async (animalId) => {
    const response = await apiClient.get(HEALTH_RECORD_ENDPOINTS.LIST(animalId))
    return response.data
  },

  create: async (animalId, payload) => {
    const response = await apiClient.post(HEALTH_RECORD_ENDPOINTS.CREATE(animalId), payload)
    return response.data
  },

  update: async (id, payload) => {
    const response = await apiClient.put(HEALTH_RECORD_ENDPOINTS.UPDATE(id), payload)
    return response.data
  },

  remove: async (id) => {
    const response = await apiClient.delete(HEALTH_RECORD_ENDPOINTS.DELETE(id))
    return response.data
  }
}
