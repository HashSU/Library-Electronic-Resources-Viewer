const mongoose = require('mongoose')

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ebook', 'ethesis', 'ejournal']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  description: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  typeFields: {
    type: Object,
    default: {}
  },
  kohaItemId: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

// Indexes for the common queries (browse by type/category, newest first, top viewed)
resourceSchema.index({ isActive: 1, type: 1, category: 1, createdAt: -1 })
resourceSchema.index({ isActive: 1, viewCount: -1 })

module.exports = mongoose.model('Resource', resourceSchema)