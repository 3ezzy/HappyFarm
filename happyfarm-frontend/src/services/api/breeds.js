import apiClient from './client.js'
import { BREED_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const breedService = {
  // List breeds, optionally filtered by species
  getAll: async (species) => {
    try {
      const response = await apiClient.get(BREED_ENDPOINTS.LIST, {
        params: species ? { species } : undefined,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
}
