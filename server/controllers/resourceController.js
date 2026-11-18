const Resource = require('../models/Resource')
const ViewEvent = require('../models/ViewEvent')
const crypto = require('crypto')
const { serverError } = require('../utils/httpError')
const { isString, isNonEmptyString, isObjectId, pick } = require('../utils/validate')

const getResources = async (req, res) => {
  try {
    const { type, category, q } = req.query
    const filter = { isActive: true }
    if (type) filter.type = type
    if (category) filter.category = category
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ]
    const resources = await Resource.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
    res.json(resources)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('category', 'name')
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' })
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')
    await ViewEvent.create({ resource: resource._id, ipHash })
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } })
    res.json(resource)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createResource = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const { title, author, type, category, description, typeFields, kohaItemId } = req.body

    let parsedTypeFields = {}
    if (typeFields) {
      try {
        parsedTypeFields = typeof typeFields === 'string' ? JSON.parse(typeFields) : typeFields
      } catch {
        parsedTypeFields = {}
      }
    }

    const normalizedPath = req.file.path.replace(/\\/g, '/')

    const resource = await Resource.create({
      title,
      author,
      type,
      category: category || null,
      description,
      typeFields: parsedTypeFields,
      kohaItemId,
      filePath: normalizedPath,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id
    })
    res.status(201).json(resource)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const RESOURCE_TYPES = ['ebook', 'ethesis', 'ejournal']

// Only these fields can be changed through the update endpoint.
// filePath, fileType, viewCount, uploadedBy etc. can never be set from the request.
const UPDATABLE_RESOURCE_FIELDS = [
  'title', 'author', 'type', 'category', 'description', 'typeFields', 'kohaItemId', 'isActive'
]

const updateResource = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'Resource not found' })

    const updates = pick(req.body, UPDATABLE_RESOURCE_FIELDS)

    if ('title' in updates && !isNonEmptyString(updates.title)) {
      return res.status(400).json({ message: 'Invalid title' })
    }
    if ('author' in updates && !isNonEmptyString(updates.author)) {
      return res.status(400).json({ message: 'Invalid author' })
    }
    if ('type' in updates && !RESOURCE_TYPES.includes(updates.type)) {
      return res.status(400).json({ message: 'Invalid resource type' })
    }
    if ('category' in updates) {
      if (updates.category === '' || updates.category === null) {
        updates.category = null
      } else if (!isObjectId(updates.category)) {
        return res.status(400).json({ message: 'Invalid category' })
      }
    }
    if ('description' in updates && !isString(updates.description)) {
      return res.status(400).json({ message: 'Invalid description' })
    }
    if ('kohaItemId' in updates && !isString(updates.kohaItemId)) {
      return res.status(400).json({ message: 'Invalid kohaItemId' })
    }
    if ('typeFields' in updates) {
      const tf = updates.typeFields
      if (!tf || typeof tf !== 'object' || Array.isArray(tf)) {
        return res.status(400).json({ message: 'Invalid typeFields' })
      }
    }
    if ('isActive' in updates && typeof updates.isActive !== 'boolean') {
      return res.status(400).json({ message: 'Invalid isActive value' })
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    if (!resource) return res.status(404).json({ message: 'Resource not found' })
    res.json(resource)
  } catch (error) {
    serverError(res, error, 'updateResource')
  }
}

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!resource) return res.status(404).json({ message: 'Resource not found' })
    res.json({ message: 'Resource removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getResources, getResource, createResource, updateResource, deleteResource }