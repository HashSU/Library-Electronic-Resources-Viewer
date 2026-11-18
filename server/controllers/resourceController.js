const Resource = require('../models/Resource')
const ViewEvent = require('../models/ViewEvent')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const config = require('../config/env')
const { resolveStoredPath } = require('../utils/filePaths')
const { serverError } = require('../utils/httpError')
const { detectFileType, extensionMatches } = require('../utils/fileType')
const { FOLDERS } = require('../middleware/upload')
const { isString, isNonEmptyString, isObjectId, pick, escapeRegex } = require('../utils/validate')

const RESOURCE_TYPES = ['ebook', 'ethesis', 'ejournal']

// Query params: type, category, q (search), page (default 1), limit (default/max 500).
// The total number of matches is returned in the X-Total-Count header.
const MAX_PAGE_SIZE = 500

const getResources = async (req, res) => {
  try {
    const { type, category, q } = req.query
    const filter = { isActive: true }

    if (type !== undefined && type !== '') {
      if (!isString(type) || !RESOURCE_TYPES.includes(type)) {
        return res.status(400).json({ message: 'Invalid type filter' })
      }
      filter.type = type
    }
    if (category !== undefined && category !== '') {
      if (!isObjectId(category)) return res.status(400).json({ message: 'Invalid category filter' })
      filter.category = category
    }
    if (q !== undefined && q !== '') {
      if (!isString(q)) return res.status(400).json({ message: 'Invalid search query' })
      const safe = escapeRegex(q.trim().slice(0, 100)) // user input is never used as a raw regex
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { author: { $regex: safe, $options: 'i' } }
      ]
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || MAX_PAGE_SIZE, 1), MAX_PAGE_SIZE)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)

    const total = await Resource.countDocuments(filter)
    const resources = await Resource.find(filter)
      .select('-filePath')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.set('X-Total-Count', String(total))
    res.json(resources)
  } catch (error) {
    serverError(res, error, 'getResources')
  }
}

const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .select('-filePath')
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

// Streams the document file. Files are never served as public static files;
// every read goes through this route so access rules can be enforced here
// (access policies are added in a later phase). Range requests (needed by PDF
// viewers) are handled by res.sendFile.
const streamResourceFile = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'Resource not found' })

    const resource = await Resource.findById(req.params.id).select('filePath isActive')
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' })
    }

    const absolutePath = resolveStoredPath(resource.filePath)
    if (!absolutePath) return res.status(404).json({ message: 'File not found' })

    // Allow only the React app to embed this file in an iframe
    res.removeHeader('X-Frame-Options')
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${config.CLIENT_ORIGIN}`)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'private, no-cache')

    res.sendFile(absolutePath, { dotfiles: 'deny' }, (err) => {
      if (err && !res.headersSent) {
        res.status(err.statusCode === 416 ? 416 : 404).json({ message: 'File not found' })
      }
    })
  } catch (error) {
    serverError(res, error, 'streamResourceFile')
  }
}

const removeUploadedFile = (file) => {
  if (file && file.path) fs.unlink(file.path, () => {})
}

const createResource = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const { title, author, type, category, description, typeFields, kohaItemId } = req.body

    // Validate text fields; delete the already-saved file if anything is wrong
    if (!isNonEmptyString(title) || !isNonEmptyString(author)) {
      removeUploadedFile(req.file)
      return res.status(400).json({ message: 'Title and author are required' })
    }
    if (!RESOURCE_TYPES.includes(type)) {
      removeUploadedFile(req.file)
      return res.status(400).json({ message: 'Invalid resource type' })
    }
    if (category && !isObjectId(category)) {
      removeUploadedFile(req.file)
      return res.status(400).json({ message: 'Invalid category' })
    }

    // Check the real file type from its content, not just the extension
    const detected = detectFileType(req.file.path)
    if (!extensionMatches(path.extname(req.file.originalname), detected)) {
      removeUploadedFile(req.file)
      return res.status(400).json({ message: 'File content does not match its extension' })
    }

    let parsedTypeFields = {}
    if (typeFields) {
      try {
        const parsed = typeof typeFields === 'string' ? JSON.parse(typeFields) : typeFields
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) parsedTypeFields = parsed
      } catch {
        parsedTypeFields = {}
      }
    }

    // Stored as "uploads/<folder>/<filename>" (relative; resolved against UPLOAD_DIR when served)
    const storedPath = path.posix.join('uploads', FOLDERS[type], req.file.filename)

    let resource
    try {
      resource = await Resource.create({
        title: title.trim(),
        author: author.trim(),
        type,
        category: category || null,
        description: isString(description) ? description : '',
        typeFields: parsedTypeFields,
        kohaItemId: isString(kohaItemId) ? kohaItemId : undefined,
        filePath: storedPath,
        fileType: detected.mime,
        uploadedBy: req.user._id
      })
    } catch (err) {
      removeUploadedFile(req.file) // do not leave an orphan file behind
      throw err
    }
    res.status(201).json(resource)
  } catch (error) {
    serverError(res, error, 'createResource')
  }
}

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

module.exports = { getResources, getResource, streamResourceFile, createResource, updateResource, deleteResource }