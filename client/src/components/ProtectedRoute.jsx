import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth()

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Checking access...</div>

  if (!admin) return <Navigate to="/admin/login" replace />

  return children
}

export default ProtectedRoute