import apiClient from './client.js'
import { INVENTORY_ENDPOINTS } from '../../constants/apiEndpoints.js'

export const inventoryService = {
  // List this farm's inventory items, each with a derived current_stock
  // and is_low_stock — never a stored stock value.
  getAll: async () => {
    const response = await apiClient.get(INVENTORY_ENDPOINTS.LIST)
    return response.data
  },

  create: async ({ name, unit, lowStockThreshold }) => {
    const response = await apiClient.post(INVENTORY_ENDPOINTS.CREATE, {
      name,
      unit,
      low_stock_threshold: lowStockThreshold === '' || lowStockThreshold === undefined ? null : lowStockThreshold,
    })
    return response.data
  },

  update: async (id, { name, unit, lowStockThreshold }) => {
    const response = await apiClient.put(INVENTORY_ENDPOINTS.UPDATE(id), {
      name,
      unit,
      low_stock_threshold: lowStockThreshold === '' || lowStockThreshold === undefined ? null : lowStockThreshold,
    })
    return response.data
  },

  // Only allowed by the backend when the item has zero transactions.
  remove: async (id) => {
    const response = await apiClient.delete(INVENTORY_ENDPOINTS.DELETE(id))
    return response.data
  },

  // Transaction history, newest first.
  getTransactions: async (id) => {
    const response = await apiClient.get(INVENTORY_ENDPOINTS.TRANSACTIONS(id))
    return response.data
  },

  // Append-only: there is no update/remove for a transaction, by design —
  // see InventoryTransactionRequest on the backend for why.
  addTransaction: async (id, { type, quantity, transactionDate, notes }) => {
    const response = await apiClient.post(INVENTORY_ENDPOINTS.ADD_TRANSACTION(id), {
      type,
      quantity,
      transaction_date: transactionDate,
      notes: notes || undefined,
    })
    return response.data
  }
}
