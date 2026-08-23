import apiClient from './client.js'
import { ADMIN_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const adminService = {
  // List users, optionally filtered by status ('pending' | 'approved' | 'rejected').
  listUsers: async (status) => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.USERS, {
      params: status ? { status } : undefined,
    })
    return response.data
  },

  approveUser: async (id) => {
    const response = await apiClient.post(ADMIN_ENDPOINTS.APPROVE(id))
    return response.data
  },

  rejectUser: async (id) => {
    const response = await apiClient.post(ADMIN_ENDPOINTS.REJECT(id))
    return response.data
  }
}
