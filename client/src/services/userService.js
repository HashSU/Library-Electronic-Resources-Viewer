import api from './api'

// Get all admin users (Superadmin only)
export const getUsers = async () => {
  const response = await api.get('/users')
  return response.data
}

// Create a new admin user (Superadmin only)
export const createUser = async (data) => {
  const response = await api.post('/users', data)
  return response.data
}

// Update an admin user (Superadmin only)
export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data)
  return response.data
}

// Deactivate an admin user (Superadmin only)
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`)
  return response.data
}
