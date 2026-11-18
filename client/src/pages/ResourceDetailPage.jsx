import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getResourceById } from '../services/resourceService'
import { API_URL } from '../services/api'
import styles from './ResourceDetailPage.module.css'

function ResourceDetailPage() {
  const { id } = useParams()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getResourceById(id)
        setResource(data)
      } catch (err) {
        setError('Resource not found or failed to load.')
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [id])

  if (loading) return <div className={styles.feedback}>Loading resource...</div>
  if (error)   return <div className={styles.feedbackError}>{error}</div>

  return (
    <div className={styles.page}>

      {/* Back Link */}
      <Link to="/browse" className={styles.backLink}>
        ← Back to Browse
      </Link>

      {/* Resource Header */}
      <div className={styles.header}>
        <span className={styles.typeBadge}>{resource.type}</span>
        <h1 className={styles.title}>{resource.title}</h1>
        <p className={styles.author}>by {resource.author}</p>
        {resource.category && (
          <span className={styles.category}>{resource.category.name}</span>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* Metadata Panel */}
        <div className={styles.meta}>
          <h2 className={styles.metaHeading}>About this Resource</h2>
          <p className={styles.description}>
            {resource.description || 'No description available.'}
          </p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Type</span>
              <span className={styles.metaValue}>{resource.type}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Author</span>
              <span className={styles.metaValue}>{resource.author}</span>
            </div>
            {resource.category && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Category</span>
                <span className={styles.metaValue}>{resource.category.name}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Uploaded</span>
              <span className={styles.metaValue}>
                {new Date(resource.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Views</span>
              <span className={styles.metaValue}>{resource.viewCount ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Viewer Panel */}
        <div className={styles.viewer}>
          <h2 className={styles.metaHeading}>Read Online</h2>
          <div className={styles.viewerBox}>
            <iframe
              src={`${API_URL}/resources/${resource._id}/file`}
              title={resource.title}
              className={styles.iframe}
            />
          </div>
        </div>

      </div>

    </div>
  )
}

export default ResourceDetailPage