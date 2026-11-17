import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AdminLayout.module.css'

function AdminLayout({ children, title, subtitle }) {
  const { admin, logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin/login')
  }

  return (
    <div className={styles.container}>
      {/* Admin Subheader Bar */}
      <header className={styles.adminBar}>
        <div className={styles.barLeft}>
          <span className={styles.badge}>Admin Workspace</span>
          <span className={styles.userName}>{admin?.name || admin?.email}</span>
          {admin?.role && (
            <span className={admin.role === 'superadmin' ? styles.superBadge : styles.adminBadge}>
              {admin.role.toUpperCase()}
            </span>
          )}
        </div>
        <div className={styles.barRight}>
          <button className={styles.viewSiteBtn} onClick={() => navigate('/')}>
            ← Public Portal
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.navTabs}>
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => (isActive ? styles.activeTab : styles.tab)}
        >
          📊 Dashboard & Analytics
        </NavLink>
        <NavLink
          to="/admin/upload"
          className={({ isActive }) => (isActive ? styles.activeTab : styles.tab)}
        >
          📤 Upload Resource
        </NavLink>
        <NavLink
          to="/admin/resources"
          className={({ isActive }) => (isActive ? styles.activeTab : styles.tab)}
        >
          📚 Manage Resources
        </NavLink>
        <NavLink
          to="/admin/categories"
          className={({ isActive }) => (isActive ? styles.activeTab : styles.tab)}
        >
          🗂️ Categories
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) => (isActive ? styles.activeTab : styles.tab)}
        >
          👤 Staff Users
        </NavLink>
      </nav>

      {/* Page Title / Subtitle Header */}
      {(title || subtitle) && (
        <div className={styles.pageHeader}>
          {title && <h1 className={styles.pageTitle}>{title}</h1>}
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default AdminLayout
