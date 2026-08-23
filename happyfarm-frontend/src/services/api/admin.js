import apiClient from './client.js'
import { ADMIN_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const adminService = {
  // List users, optionally filtered by status ('pending' | 'approved' | 'rejected' | 'suspended').
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
  },

  suspendUser: async (id) => {
    const response = await apiClient.post(ADMIN_ENDPOINTS.SUSPEND(id))
    return response.data
  },

  reactivateUser: async (id) => {
    const response = await apiClient.post(ADMIN_ENDPOINTS.REACTIVATE(id))
    return response.data
  }
}
