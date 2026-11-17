import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getResources, getCategories } from '../services/resourceService'
import styles from './BrowsePage.module.css'

function BrowsePage() {
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchParams, setSearchParams] = useSearchParams()

  // Read filters from URL
  const searchQuery = searchParams.get('q') || ''
  const typeFilter  = searchParams.get('type') || ''
  const catFilter   = searchParams.get('category') || ''

  // Fetch resources whenever filters change
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getResources({
          q: searchQuery,
          type: typeFilter,
          category: catFilter,
        })
        setResources(data)
      } catch (err) {
        setError('Failed to load resources. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [searchQuery, typeFilter, catFilter])

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (err) {
        // non-critical, fail silently
      }
    }
    fetchCategories()
  }, [])

  // Update a single filter in the URL
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next)
  }

  return (
    <div className={styles.page}>

      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Browse Collection</h1>
        <p className={styles.subtitle}>
          {loading ? 'Loading...' : `${resources.length} resource${resources.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by title, author, keyword..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => updateFilter('q', e.target.value)}
        />

        {/* Type Filter */}
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => updateFilter('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="ebook">eBook</option>
          <option value="ethesis">eThesis</option>
          <option value="ejournal">eJournal</option>
        </select>

        {/* Category Filter */}
        <select
          className={styles.select}
          value={catFilter}
          onChange={(e) => updateFilter('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {(searchQuery || typeFilter || catFilter) && (
          <button
            className={styles.clearBtn}
            onClick={() => setSearchParams({})}
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* Content */}
      <div className={styles.content}>

        {loading && (
          <div className={styles.feedback}>Loading resources...</div>
        )}

        {error && (
          <div className={styles.feedbackError}>{error}</div>
        )}

        {!loading && !error && resources.length === 0 && (
          <div className={styles.feedback}>
            No resources found. Try adjusting your filters.
          </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <div className={styles.grid}>
            {resources.map((resource) => (
              <Link
                key={resource._id}
                to={`/resources/${resource._id}`}
                className={styles.card}
              >
                <div className={styles.cardType}>{resource.type}</div>
                <h2 className={styles.cardTitle}>{resource.title}</h2>
                <p className={styles.cardAuthor}>{resource.author}</p>
                {resource.category && (
                  <span className={styles.cardCategory}>
                    {resource.category.name}
                  </span>
                )}
                <p className={styles.cardDesc}>
                  {resource.description
                    ? resource.description.slice(0, 120) + '...'
                    : 'No description available.'}
                </p>
                <span className={styles.cardCta}>View Resource →</span>
              </Link>
            ))}
          </div>
        )}

      </div>

    </div>
  )
}

export default BrowsePage