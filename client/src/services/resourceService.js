import api from './api'

// Get all resources (with optional filters)
export const getResources = async (params = {}) => {
  const response = await api.get('/resources', { params })
  return response.data
}

// Get a single resource by ID
export const getResourceById = async (id) => {
  const response = await api.get(`/resources/${id}`)
  return response.data
}

// Search resources
export const searchResources = async (query) => {
  const response = await api.get('/resources', { params: { q: query } })
  return response.data
}

// Create a new resource (supports multipart FormData for file uploads)
export const createResource = async (formData) => {
  const response = await api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// Update a resource by ID
export const updateResource = async (id, data) => {
  const response = await api.put(`/resources/${id}`, data)
  return response.data
}

// Soft-delete / deactivate a resource by ID
export const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}`)
  return response.data
}

// Get all categories (kept for compatibility with existing imports)
export const getCategories = async () => {
  const response = await api.get('/categories')
  return response.data
} 