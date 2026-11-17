const Resource = require('../models/Resource')
const ViewEvent = require('../models/ViewEvent')
const crypto = require('crypto')

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

const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!resource) return res.status(404).json({ message: 'Resource not found' })
    res.json(resource)
  } catch (error) {
    res.status(500).json({ message: error.message })
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