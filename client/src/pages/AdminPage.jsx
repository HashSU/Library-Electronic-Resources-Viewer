import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { getStatsOverview } from '../services/statsService'
import styles from './AdminPage.module.css'

function AdminPage() {
  const { admin } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getStatsOverview()
        setStats(data)
      } catch (err) {
        setError('Failed to load library statistics.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Helper to extract count for specific type from aggregation
  const getTypeCount = (type) => {
    if (!stats?.byType) return 0
    const found = stats.byType.find((item) => item._id === type)
    return found ? found.count : 0
  }

  return (
    <AdminLayout
      title="Library Dashboard & Analytics"
      subtitle={`System status and real-time overview for ${admin?.name || 'Administrator'}`}
    >
      {/* Quick Action Navigation Grid */}
      <div className={styles.actions}>
        <div className={styles.actionCard} onClick={() => navigate('/admin/upload')}>
          <span className={styles.actionIcon}>📤</span>
          <div>
            <div className={styles.actionLabel}>Upload New Resource</div>
            <div className={styles.actionDesc}>Ingest an eBook, eThesis, or eJournal</div>
          </div>
        </div>
        <div className={styles.actionCard} onClick={() => navigate('/admin/resources')}>
          <span className={styles.actionIcon}>📚</span>
          <div>
            <div className={styles.actionLabel}>Manage Resources</div>
            <div className={styles.actionDesc}>Update metadata, view files, or deactivate</div>
          </div>
        </div>
        <div className={styles.actionCard} onClick={() => navigate('/admin/categories')}>
          <span className={styles.actionIcon}>🗂️</span>
          <div>
            <div className={styles.actionLabel}>Manage Categories</div>
            <div className={styles.actionDesc}>Organize academic subjects & branches</div>
          </div>
        </div>
        {admin?.role === 'superadmin' && (
          <div className={styles.actionCard} onClick={() => navigate('/admin/users')}>
            <span className={styles.actionIcon}>👤</span>
            <div>
              <div className={styles.actionLabel}>Manage Staff Users</div>
              <div className={styles.actionDesc}>Create & manage administrator accounts</div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Section */}
      <h2 className={styles.sectionTitle}>Library Metrics</h2>

      {loading && <div className={styles.loading}>Loading analytics data...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && stats && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Cataloged Resources</span>
              <span className={styles.metricValue}>{stats.totalResources ?? 0}</span>
              <span className={styles.metricHint}>Active digital documents</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Views Recorded</span>
              <span className={styles.metricValue}>{stats.totalViews ?? 0}</span>
              <span className={styles.metricHint}>Unique anonymized views</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>eBooks</span>
              <span className={styles.metricValue}>{getTypeCount('ebook')}</span>
              <span className={styles.metricHint}>Books & monographs</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>eTheses & Dissertations</span>
              <span className={styles.metricValue}>{getTypeCount('ethesis')}</span>
              <span className={styles.metricHint}>Institutional research</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>eJournals & Articles</span>
              <span className={styles.metricValue}>{getTypeCount('ejournal')}</span>
              <span className={styles.metricHint}>Periodicals & papers</span>
            </div>
          </div>

          {/* Top Resources Leaderboard */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>🔥 Top 5 Most Accessed Resources</h3>
              <Link to="/admin/resources" className={styles.viewAllLink}>
                View all in catalog →
              </Link>
            </div>

            {stats.topResources && stats.topResources.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Type</th>
                      <th>Total Reads</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topResources.map((item) => (
                      <tr key={item._id}>
                        <td className={styles.resourceTitle}>{item.title}</td>
                        <td>{item.author}</td>
                        <td>
                          <span className={styles.typeBadge}>{item.type}</span>
                        </td>
                        <td className={styles.viewCount}>{item.viewCount ?? 0}</td>
                        <td>
                          <Link
                            to={`/resources/${item._id}`}
                            className={styles.viewBtn}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Read Online
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyNotice}>
                No resources recorded yet. Use the upload tool to add the first item.
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default AdminPage