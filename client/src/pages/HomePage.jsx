import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCategories } from '../services/categoryService'
import { getPublicStats } from '../services/statsService'
import styles from './HomePage.module.css'

function HomePage() {
  const navigate = useNavigate()

  // Search form state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')

  // Data state
  const [categories, setCategories] = useState([])
  const [topResources, setTopResources] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true)
        const [cats, statsData] = await Promise.all([
          getCategories().catch(() => []),
          getPublicStats().catch(() => null)
        ])
        setCategories(cats || [])
        if (statsData) {
          setStats(statsData)
          setTopResources(statsData.topResources || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedType) params.set('type', selectedType)
    navigate(`/browse?${params.toString()}`)
  }

  return (
    <div className={styles.homeContainer}>
      {/* 1. Hero Discovery Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.institutionTag}>MSU-Main University Library</span>
          <h1 className={styles.heroTitle}>Digital Institutional Repository</h1>
          <p className={styles.heroSubtitle}>
            Access scholarly publications, digitized monographs, academic theses, dissertations, and research journals online.
          </p>

          {/* Central Search Box */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.inputWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search across title, author, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>
                Search Catalog
              </button>
            </div>

            {/* Quick Type Filter Pills */}
            <div className={styles.typePills}>
              <button
                type="button"
                className={selectedType === '' ? styles.pillActive : styles.pill}
                onClick={() => setSelectedType('')}
              >
                All Materials
              </button>
              <button
                type="button"
                className={selectedType === 'ebook' ? styles.pillActive : styles.pill}
                onClick={() => setSelectedType('ebook')}
              >
                📖 eBooks
              </button>
              <button
                type="button"
                className={selectedType === 'ethesis' ? styles.pillActive : styles.pill}
                onClick={() => setSelectedType('ethesis')}
              >
                🎓 Theses & Dissertations
              </button>
              <button
                type="button"
                className={selectedType === 'ejournal' ? styles.pillActive : styles.pill}
                onClick={() => setSelectedType('ejournal')}
              >
                📰 eJournals
              </button>
            </div>
          </form>

          {/* Repository At-A-Glance Stat Chips */}
          {stats && (
            <div className={styles.heroStats}>
              <div className={styles.heroStatItem}>
                <strong>{stats.totalResources ?? 0}</strong>
                <span>Cataloged Works</span>
              </div>
              <div className={styles.heroStatDivider}>•</div>
              <div className={styles.heroStatItem}>
                <strong>{stats.totalViews ?? 0}</strong>
                <span>Research Views</span>
              </div>
              <div className={styles.heroStatDivider}>•</div>
              <div className={styles.heroStatItem}>
                <strong>{categories.length}</strong>
                <span>Academic Disciplines</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className={styles.mainBody}>
        {/* 2. Three Core Pillars (Floating Collection Cards) */}
        <section className={styles.pillarsSection}>
          <div className={styles.pillarGrid}>
            <Link to="/browse?type=ebook" className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>📖</div>
              <div className={styles.pillarInfo}>
                <h3 className={styles.pillarTitle}>eBooks & Monographs</h3>
                <p className={styles.pillarDesc}>
                  Digital textbooks, faculty monographs, and curriculum reference literature.
                </p>
                <span className={styles.pillarLink}>Explore eBooks →</span>
              </div>
            </Link>

            <Link to="/browse?type=ethesis" className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>🎓</div>
              <div className={styles.pillarInfo}>
                <h3 className={styles.pillarTitle}>Theses & Dissertations</h3>
                <p className={styles.pillarDesc}>
                  Undergraduate senior projects, Master's research, and Doctoral dissertations.
                </p>
                <span className={styles.pillarLink}>Explore Theses →</span>
              </div>
            </Link>

            <Link to="/browse?type=ejournal" className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>📰</div>
              <div className={styles.pillarInfo}>
                <h3 className={styles.pillarTitle}>eJournals & Articles</h3>
                <p className={styles.pillarDesc}>
                  Peer-reviewed university periodicals, conference papers, and research articles.
                </p>
                <span className={styles.pillarLink}>Explore Journals →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* 3. Browse by Academic Discipline / Category */}
        {categories.length > 0 && (
          <section className={styles.categorySection}>
            <div className={styles.sectionHeadingWrapper}>
              <div>
                <h2 className={styles.sectionHeading}>Browse by Subject Discipline</h2>
                <p className={styles.sectionSubtext}>
                  Discover publications and research organized by academic departments
                </p>
              </div>
              <Link to="/browse" className={styles.viewAllCatalog}>
                Full Catalog →
              </Link>
            </div>

            <div className={styles.categoryPillGrid}>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/browse?category=${cat._id}`}
                  className={styles.categoryPill}
                >
                  <span className={styles.catPillIcon}>📁</span>
                  <span className={styles.catPillName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Trending & Popular Research Section */}
        <section className={styles.trendingSection}>
          <div className={styles.sectionHeadingWrapper}>
            <div>
              <h2 className={styles.sectionHeading}>🔥 Most Accessed Research</h2>
              <p className={styles.sectionSubtext}>
                Frequently referenced digital works and popular academic materials
              </p>
            </div>
            <Link to="/browse" className={styles.viewAllCatalog}>
              Browse All Resources →
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingBox}>Loading catalog highlights...</div>
          ) : topResources.length > 0 ? (
            <div className={styles.resourceGrid}>
              {topResources.map((res) => (
                <Link
                  key={res._id}
                  to={`/resources/${res._id}`}
                  className={styles.resourceCard}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.resTypeBadge}>{res.type}</span>
                    <span className={styles.viewBadge}>👁️ {res.viewCount ?? 0} views</span>
                  </div>
                  <h3 className={styles.resTitle}>{res.title}</h3>
                  <p className={styles.resAuthor}>by {res.author}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.readOnlineCta}>Read Online in Viewer →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyFeatured}>
              <p>Explore our wide collection of digital materials in the public catalog.</p>
              <Link to="/browse" className={styles.browseButton}>
                Explore Full Repository
              </Link>
            </div>
          )}
        </section>

        {/* 5. Intellectual Property & Fair Use Banner */}
        <section className={styles.ipNoticeCard}>
          <div className={styles.ipIcon}>⚖️</div>
          <div className={styles.ipText}>
            <h4 className={styles.ipTitle}>
              Philippine Intellectual Property Code (R.A. 8293) & Creative Commons Compliance
            </h4>
            <p className={styles.ipDesc}>
              The digital assets, manuscripts, and e-resources hosted within this repository are bound
              under the Intellectual Property Law of the Philippines and respective Creative Commons
              licensing frameworks. Digital materials are made available exclusively for educational
              instruction, scholarly research, and academic fair use by students, faculty, and authorized
              library patrons.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage