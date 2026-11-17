import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { getUsers, createUser, deleteUser } from '../services/userService'
import styles from './AdminUsersPage.module.css'

function AdminUsersPage() {
  const { admin } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New User Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  // Feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const isSuperAdmin = admin?.role === 'superadmin'

  const loadUsers = async () => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      setError('Failed to load administrator accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [isSuperAdmin])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) return

    try {
      setCreating(true)
      setFeedback({ type: '', message: '' })
      await createUser({ name, email, password })
      setFeedback({
        type: 'success',
        message: `Admin account for "${name}" created successfully.`
      })
      setName('')
      setEmail('')
      setPassword('')
      loadUsers()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create admin user.'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate the administrator account for "${user.name}"?`
      )
    ) {
      return
    }

    try {
      await deleteUser(user._id)
      setFeedback({
        type: 'success',
        message: `Account for "${user.name}" has been deactivated.`
      })
      loadUsers()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to deactivate account.'
      })
    }
  }

  return (
    <AdminLayout
      title="Staff User Administration"
      subtitle="Manage library administrative personnel accounts and access permissions"
    >
      {!isSuperAdmin ? (
        <div className={styles.restrictedNotice}>
          <span className={styles.restrictedIcon}>🔒</span>
          <h3>Superadmin Access Required</h3>
          <p>
            User management is strictly restricted to the Superadmin role. Your current account
            ({admin?.email}) has standard administrator permissions.
          </p>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Create User Card */}
          <div className={styles.createCard}>
            <h3 className={styles.cardHeader}>+ Create Staff Admin</h3>
            <form onSubmit={handleCreateUser} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juanita Santos"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jsantos@msumain.edu.ph"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={creating}
              >
                {creating ? 'Creating Account...' : 'Provision Admin Account'}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className={styles.listCard}>
            <h3 className={styles.cardHeader}>Active Library Administrators</h3>

            {feedback.message && (
              <div
                className={
                  feedback.type === 'success' ? styles.successAlert : styles.errorAlert
                }
              >
                {feedback.message}
              </div>
            )}

            {loading && <div className={styles.loading}>Loading accounts...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {!loading && !error && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          No additional staff administrators found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id}>
                          <td className={styles.userName}>{u.name}</td>
                          <td className={styles.userEmail}>{u.email}</td>
                          <td>
                            <span className={styles.roleBadge}>{u.role}</span>
                          </td>
                          <td className={styles.dateCell}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className={styles.deactivateBtn}
                              onClick={() => handleDeactivate(u)}
                              title="Deactivate Admin"
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminUsersPage
