import apiClient from './client.js'
import { ANIMAL_ENDPOINTS, WEIGHT_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const animalService = {
  // Get all animals for the user's farm, optionally filtered by ?search=
  // (partial match against tag or name, handled server-side)
  getAll: async (search) => {
    const response = await apiClient.get(ANIMAL_ENDPOINTS.LIST, {
      params: search ? { search } : undefined,
    })
    return response.data
  },

  // Get specific animal by ID
  getById: async (id) => {
    const response = await apiClient.get(ANIMAL_ENDPOINTS.DETAILS(id))
    return response.data
  },

  // Create new animal
  create: async (animalData) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.CREATE, animalData)
    return response.data
  },

  // Feed an animal
  feed: async (id) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.FEED(id))
    return response.data
  },

  // Groom an animal
  groom: async (id) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.GROOM(id))
    return response.data
  },

  // Sacrifice an animal
  sacrifice: async (id) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.SACRIFICE(id))
    return response.data
  },

  // Weight history
  getWeights: async (id) => {
    const response = await apiClient.get(ANIMAL_ENDPOINTS.WEIGHTS(id))
    return response.data
  },

  addWeight: async (id, weightData) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.WEIGHTS(id), weightData)
    return response.data
  },

  updateWeight: async (weightId, weightData) => {
    const response = await apiClient.put(WEIGHT_ENDPOINTS.UPDATE(weightId), weightData)
    return response.data
  },

  deleteWeight: async (weightId) => {
    const response = await apiClient.delete(WEIGHT_ENDPOINTS.DELETE(weightId))
    return response.data
  }
}
