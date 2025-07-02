import apiClient from './client.js'
import { ANIMAL_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const animalService = {
  // Get all animals for the user's farm
  getAll: async () => {
    try {
      const response = await apiClient.get(ANIMAL_ENDPOINTS.LIST)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get specific animal by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(ANIMAL_ENDPOINTS.DETAILS(id))
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Create new animal
  create: async (animalData) => {
    try {
      const response = await apiClient.post(ANIMAL_ENDPOINTS.CREATE, animalData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Feed an animal
  feed: async (id) => {
    try {
      const response = await apiClient.post(ANIMAL_ENDPOINTS.FEED(id))
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Groom an animal
  groom: async (id) => {
    try {
      const response = await apiClient.post(ANIMAL_ENDPOINTS.GROOM(id))
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Sacrifice an animal
  sacrifice: async (id) => {
    try {
      const response = await apiClient.post(ANIMAL_ENDPOINTS.SACRIFICE(id))
      return response.data
    } catch (error) {
      throw error
    }
  }
} 