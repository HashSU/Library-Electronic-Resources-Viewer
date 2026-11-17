import styles from './Footer.module.css'

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.brand}>📚 Library E-Resources Viewer</p>
        <p className={styles.subtext}>
          Providing access to knowledge for students, faculty, and researchers.
        </p>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} MSU-Main University Library. All rights reserved.</p>
        <p>Developed by UL-Information Technology Services Division</p>
      </div>
    </footer>
  )
}

export default Footer