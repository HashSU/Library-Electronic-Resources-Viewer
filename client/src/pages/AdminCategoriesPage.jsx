import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/categoryService'
import styles from './AdminCategoriesPage.module.css'

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New Category Form State
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit Modal State
  const [editingCat, setEditingCat] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Notification
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    try {
      setCreating(true)
      setFeedback({ type: '', message: '' })
      await createCategory({ name: newName.trim(), description: newDesc.trim() })
      setFeedback({ type: 'success', message: `Category "${newName}" created.` })
      setNewName('')
      setNewDesc('')
      loadCategories()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create category.'
      })
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (cat) => {
    setEditingCat(cat)
    setEditName(cat.name)
    setEditDesc(cat.description || '')
  }

  const closeEditModal = () => {
    setEditingCat(null)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingCat || !editName.trim()) return

    try {
      setSavingEdit(true)
      await updateCategory(editingCat._id, {
        name: editName.trim(),
        description: editDesc.trim()
      })
      setFeedback({ type: 'success', message: `Category "${editName}" updated.` })
      closeEditModal()
      loadCategories()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update category.'
      })
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) {
      return
    }

    try {
      await deleteCategory(cat._id)
      setFeedback({ type: 'success', message: `Category "${cat.name}" deleted.` })
      loadCategories()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete category.'
      })
    }
  }

  return (
    <AdminLayout
      title="Manage Categories"
      subtitle="Organize resources into academic disciplines and classifications"
    >
      <div className={styles.layout}>
        {/* Left Column: Create Form */}
        <div className={styles.createCard}>
          <h3 className={styles.cardHeader}>+ Add New Category</h3>
          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science & IT"
                className={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                rows={3}
                placeholder="Scope or disciplines covered..."
                className={styles.textarea}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={creating}
            >
              {creating ? 'Adding...' : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Categories Table */}
        <div className={styles.listCard}>
          <h3 className={styles.cardHeader}>
            Existing Classifications ({categories.length})
          </h3>

          {feedback.message && (
            <div
              className={
                feedback.type === 'success' ? styles.successAlert : styles.errorAlert
              }
            >
              {feedback.message}
            </div>
          )}

          {loading && <div className={styles.loading}>Loading categories...</div>}
          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.emptyCell}>
                        No categories defined yet. Create your first one on the left.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat._id}>
                        <td className={styles.catName}>{cat.name}</td>
                        <td className={styles.catDesc}>
                          {cat.description || '—'}
                        </td>
                        <td>
                          <div className={styles.actionRow}>
                            <button
                              className={styles.editBtn}
                              onClick={() => openEditModal(cat)}
                              title="Edit Category"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(cat)}
                              title="Delete Category"
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
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingCat && (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Edit Category</h3>
              <button className={styles.closeBtn} onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
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
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminCategoriesPage
