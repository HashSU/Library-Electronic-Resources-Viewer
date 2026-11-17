import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../services/authService'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, check if a token exists and validate it
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    // Attach token to all axios requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    getMe()
      .then((data) => setAdmin(data))
      .catch(() => {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      })
      .finally(() => setLoading(false))
  }, [])

  const loginAdmin = (token, userData) => {
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setAdmin(userData)
  }

  const logoutAdmin = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext)
}