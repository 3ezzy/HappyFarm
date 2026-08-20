import apiClient from './client.js'
import { BREED_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const breedService = {
  // List breeds, optionally filtered by species. Includes global breeds
  // plus this farm's own custom breeds (each row's farm_id tells them apart).
  getAll: async (species) => {
    const response = await apiClient.get(BREED_ENDPOINTS.LIST, {
      params: species ? { species } : undefined,
    })
    return response.data
  },

  // Create a custom breed owned by the caller's own farm
  create: async ({ species, name }) => {
    const response = await apiClient.post(BREED_ENDPOINTS.CREATE, { species, name })
    return response.data
  },

  // Rename / re-species a custom breed the caller's farm owns
  update: async (id, { species, name }) => {
    const response = await apiClient.put(BREED_ENDPOINTS.UPDATE(id), { species, name })
    return response.data
  },

  // Delete a custom breed the caller's farm owns, if unused
  remove: async (id) => {
    const response = await apiClient.delete(BREED_ENDPOINTS.DELETE(id))
    return response.data
  }
}
