import axios from 'axios'

// Set VITE_API_URL in client/.env (see client/.env.example) for production builds.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Server root without the trailing /api (used for file URLs)
export const SERVER_URL = API_URL.replace(/\/api\/?$/, '')

const api = axios.create({
  baseURL: API_URL
})

export default api
