import api from './api'

// Public homepage statistics (no login required)
export const getPublicStats = async () => {
  const response = await api.get('/stats/public')
  return response.data
}

// Get library overview statistics (total resources, total views, resources by type, top resources)
export const getStatsOverview = async () => {
  const response = await api.get('/stats/overview')
  return response.data
}

// Get view trend history grouped by date
export const getViewTrends = async (days = 7) => {
  const response = await api.get('/stats/views', { params: { days } })
  return response.data
}
