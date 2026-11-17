import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { createResource } from '../services/resourceService'
import { getCategories } from '../services/categoryService'
import styles from './AdminUploadPage.module.css'

function AdminUploadPage() {
  const navigate = useNavigate()

  // Form State
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [type, setType] = useState('ebook')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [kohaItemId, setKohaItemId] = useState('')
  const [file, setFile] = useState(null)

  // Type-specific metadata fields
  const [typeFields, setTypeFields] = useState({})

  // UI state
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (err) {
        console.error('Could not fetch categories', err)
      }
    }
    loadCategories()
  }, [])

  // When type changes, reset typeFields
  const handleTypeChange = (newType) => {
    setType(newType)
    setTypeFields({})
  }

  const handleTypeFieldChange = (key, val) => {
    setTypeFields((prev) => ({ ...prev, [key]: val }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setFeedback({ type: 'error', message: 'Please select a document file to upload.' })
      return
    }

    try {
      setSubmitting(true)
      setFeedback({ type: '', message: '' })

      const formData = new FormData()
      formData.append('title', title)
      formData.append('author', author)
      formData.append('type', type)
      if (category) formData.append('category', category)
      formData.append('description', description)
      if (kohaItemId) formData.append('kohaItemId', kohaItemId)
      formData.append('typeFields', JSON.stringify(typeFields))
      formData.append('file', file)

      const created = await createResource(formData)

      setFeedback({
        type: 'success',
        message: `Resource "${created.title}" successfully ingested into catalog!`
      })

      // Reset form
      setTitle('')
      setAuthor('')
      setType('ebook')
      setCategory('')
      setDescription('')
      setKohaItemId('')
      setTypeFields({})
      setFile(null)

      // Optionally navigate after short delay
      setTimeout(() => {
        navigate('/admin/resources')
      }, 1800)
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to upload resource. Please check file format and try again.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout
      title="Ingest E-Resource"
      subtitle="Upload digital monographs, theses, or periodicals to the MSU-Main repository"
    >
      <div className={styles.wrapper}>
        {feedback.message && (
          <div
            className={
              feedback.type === 'success' ? styles.successBox : styles.errorBox
            }
          >
            {feedback.type === 'success' ? '✓ ' : '⚠️ '}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Main Attributes */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionHeader}>1. Basic Metadata</h3>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Philippine Environmental Law"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Author / Researcher *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Juan Dela Cruz"
                  className={styles.input}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Resource Type *</label>
                <select
                  className={styles.select}
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="ebook">eBook / Monograph</option>
                  <option value="ethesis">eThesis / Dissertation</option>
                  <option value="ejournal">eJournal / Article</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Academic Category / Subject</label>
                <select
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Abstract / Description</label>
              <textarea
                rows={3}
                placeholder="Brief summary, scope, or abstract of this digital asset..."
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Type-Specific Dynamic Fields */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionHeader}>
              2. Specific Metadata ({type === 'ebook' ? 'eBook' : type === 'ethesis' ? 'eThesis' : 'eJournal'})
            </h3>

            {type === 'ebook' && (
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label className={styles.label}>ISBN</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-0-123456-47-2"
                    className={styles.input}
                    value={typeFields.isbn || ''}
                    onChange={(e) => handleTypeFieldChange('isbn', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. MSU University Press"
                    className={styles.input}
                    value={typeFields.publisher || ''}
                    onChange={(e) => handleTypeFieldChange('publisher', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    className={styles.input}
                    value={typeFields.publicationYear || ''}
                    onChange={(e) => handleTypeFieldChange('publicationYear', e.target.value)}
                  />
                </div>
              </div>
            )}

            {type === 'ethesis' && (
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Degree / Program</label>
                  <input
                    type="text"
                    placeholder="e.g. Master of Science in Information Technology"
                    className={styles.input}
                    value={typeFields.degree || ''}
                    onChange={(e) => handleTypeFieldChange('degree', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Department / College</label>
                  <input
                    type="text"
                    placeholder="e.g. College of Information and Computing Sciences"
                    className={styles.input}
                    value={typeFields.department || ''}
                    onChange={(e) => handleTypeFieldChange('department', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Adviser</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Maria Santos, PhD"
                    className={styles.input}
                    value={typeFields.adviser || ''}
                    onChange={(e) => handleTypeFieldChange('adviser', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Graduation Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025"
                    className={styles.input}
                    value={typeFields.graduationYear || ''}
                    onChange={(e) => handleTypeFieldChange('graduationYear', e.target.value)}
                  />
                </div>
              </div>
            )}

            {type === 'ejournal' && (
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label className={styles.label}>Journal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mindanao Academic Research Journal"
                    className={styles.input}
                    value={typeFields.journalName || ''}
                    onChange={(e) => handleTypeFieldChange('journalName', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Volume & Issue</label>
                  <input
                    type="text"
                    placeholder="e.g. Vol. 14, Issue 2"
                    className={styles.input}
                    value={typeFields.volumeIssue || ''}
                    onChange={(e) => handleTypeFieldChange('volumeIssue', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>ISSN</label>
                  <input
                    type="text"
                    placeholder="e.g. 1908-5432"
                    className={styles.input}
                    value={typeFields.issn || ''}
                    onChange={(e) => handleTypeFieldChange('issn', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Integrated Library System (Koha) Link & File Attachment */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionHeader}>3. Koha ILS Link & Document File</h3>

            <div className={styles.field}>
              <label className={styles.label}>Koha Item / Biblio ID (Optional)</label>
              <input
                type="text"
                placeholder="Optional Koha bibliographic record ID for ILS cross-referencing"
                className={styles.input}
                value={kohaItemId}
                onChange={(e) => setKohaItemId(e.target.value)}
              />
              <span className={styles.fieldHint}>
                Links this digital copy to physical catalog records in Koha.
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Attach Document File *</label>
              <input
                type="file"
                required
                accept=".pdf,.epub,.jpg,.jpeg,.png,.tiff"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
              <span className={styles.fieldHint}>
                Allowed file types: PDF, EPUB, JPG, PNG, TIFF. Maximum file size: 100MB.
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className={styles.actionsBar}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate('/admin/resources')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Uploading & Processing...' : 'Ingest Resource →'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default AdminUploadPage
