import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 24px' }}>
      <h1 style={{ fontSize: '4rem', color: '#1a1a2e', margin: '0 0 16px' }}>404</h1>
      <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '32px' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '0.95rem',
        }}
      >
        Go Home
      </Link>
    </div>
  )
}

export default NotFoundPage