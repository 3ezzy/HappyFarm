import apiClient from './client.js'
import { ANIMAL_ENDPOINTS, WEIGHT_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const animalService = {
  // Get all animals for the user's farm. Accepts either a plain search
  // string (existing call sites) or an options object { search, archived }
  // — archived:true lists only archived animals, the default excludes
  // them entirely (see AnimalController::index).
  getAll: async (searchOrOptions) => {
    const options = typeof searchOrOptions === 'object' && searchOrOptions !== null
      ? searchOrOptions
      : { search: searchOrOptions }

    const params = {}
    if (options.search) params.search = options.search
    if (options.archived) params.archived = 1

    const response = await apiClient.get(ANIMAL_ENDPOINTS.LIST, {
      params: Object.keys(params).length ? params : undefined,
    })
    return response.data
  },

  // Get specific animal by ID (resolves archived animals too, see
  // AnimalController::show)
  getById: async (id) => {
    const response = await apiClient.get(ANIMAL_ENDPOINTS.DETAILS(id))
    return response.data
  },

  // Create new animal
  create: async (animalData) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.CREATE, animalData)
    return response.data
  },

  // Edit an animal's core profile. Species/sex are rejected server-side
  // once animal.breeding_locked is true — see AnimalUpdateRequest.
  update: async (id, animalData) => {
    const response = await apiClient.put(ANIMAL_ENDPOINTS.UPDATE(id), animalData)
    return response.data
  },

  // Archives the animal if it has any history, otherwise deletes it
  // permanently — the response's `action` field says which happened.
  remove: async (id) => {
    const response = await apiClient.delete(ANIMAL_ENDPOINTS.DELETE(id))
    return response.data
  },

  restore: async (id) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.RESTORE(id))
    return response.data
  },

  // Records a death or sale exit — separate from sacrifice(), which keeps
  // its own dedicated eligibility-gated flow untouched.
  recordExit: async (id, { reason, exitDate }) => {
    const response = await apiClient.post(ANIMAL_ENDPOINTS.EXIT(id), { reason, exit_date: exitDate })
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
