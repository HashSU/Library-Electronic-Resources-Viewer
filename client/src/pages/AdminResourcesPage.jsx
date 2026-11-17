import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getResources, updateResource, deleteResource } from '../services/resourceService'
import { getCategories } from '../services/categoryService'
import styles from './AdminResourcesPage.module.css'

function AdminResourcesPage() {
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Feedback Notification
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [resData, catData] = await Promise.all([
        getResources({ q: search, type: typeFilter }),
        getCategories()
      ])
      setResources(resData)
      setCategories(catData)
    } catch (err) {
      setError('Failed to fetch resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [typeFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadData()
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setEditTitle(item.title)
    setEditAuthor(item.author)
    setEditCategory(item.category?._id || item.category || '')
    setEditDesc(item.description || '')
  }

  const closeEditModal = () => {
    setEditingItem(null)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      setSavingEdit(true)
      await updateResource(editingItem._id, {
        title: editTitle,
        author: editAuthor,
        category: editCategory || null,
        description: editDesc
      })
      setFeedback({ type: 'success', message: `Updated "${editTitle}" successfully.` })
      closeEditModal()
      loadData()
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update resource.' })
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to deactivate "${item.title}"?`)) {
      return
    }
    try {
      await deleteResource(item._id)
      setFeedback({ type: 'success', message: `Deactivated "${item.title}".` })
      loadData()
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to remove resource.' })
    }
  }

  return (
    <AdminLayout
      title="Manage E-Resources"
      subtitle="View, search, edit metadata, or retire catalog items"
    >
      <div className={styles.topActions}>
        {/* Search & Filter Form */}
        <form onSubmit={handleSearchSubmit} className={styles.filterBar}>
          <input
            type="text"
            placeholder="Filter by title or author..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Resource Types</option>
            <option value="ebook">eBook</option>
            <option value="ethesis">eThesis</option>
            <option value="ejournal">eJournal</option>
          </select>
          <button type="submit" className={styles.searchBtn}>
            Search
          </button>
        </form>

        <Link to="/admin/upload" className={styles.uploadBtn}>
          + Ingest New Resource
        </Link>
      </div>

      {feedback.message && (
        <div
          className={
            feedback.type === 'success' ? styles.successAlert : styles.errorAlert
          }
        >
          {feedback.message}
        </div>
      )}

      {loading && <div className={styles.loading}>Loading repository records...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Views</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No resources found matching criteria.
                    </td>
                  </tr>
                ) : (
                  resources.map((item) => (
                    <tr key={item._id}>
                      <td className={styles.titleCell}>
                        <Link
                          to={`/resources/${item._id}`}
                          className={styles.titleLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td>{item.author}</td>
                      <td>
                        <span className={styles.typeBadge}>{item.type}</span>
                      </td>
                      <td>{item.category?.name || 'Uncategorized'}</td>
                      <td className={styles.viewCell}>{item.viewCount ?? 0}</td>
                      <td className={styles.dateCell}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          <Link
                            to={`/resources/${item._id}`}
                            className={styles.viewAction}
                            target="_blank"
                            rel="noreferrer"
                            title="Read in Document Viewer"
                          >
                            👁️ View
                          </Link>
                          <button
                            className={styles.editAction}
                            onClick={() => openEditModal(item)}
                            title="Edit Metadata"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className={styles.deleteAction}
                            onClick={() => handleDelete(item)}
                            title="Deactivate Resource"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Edit Resource Metadata</h3>
              <button className={styles.closeBtn} onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Author</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <select
                  className={styles.select}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="">-- None / Uncategorized --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description / Abstract</label>
                <textarea
                  rows={3}
                  className={styles.textarea}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminResourcesPage
