import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

function Navbar() {
  const { admin } = useAuth()

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <Link to="/">📚 Library E-Resources</Link>
      </div>
      <div className={styles.navLinks}>
        <Link to="/">Home</Link>
        <Link to="/browse">Browse</Link>
        {admin ? (
          <Link to="/admin" className={styles.adminLink}>
            ⚙️ Admin Panel
          </Link>
        ) : (
          <Link to="/admin/login" className={styles.loginLink}>
            Staff Login
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar