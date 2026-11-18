const mongoose = require('mongoose')

const viewEventSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  ipHash: {
    type: String,
    required: true
  },
  // UTC date (YYYY-MM-DD). With resource + ipHash it makes one view per visitor per resource per day.
  day: {
    type: String
  }
}, { timestamps: true })

// Unique only for new-style events that have a day (older events without one are left alone)
viewEventSchema.index(
  { resource: 1, ipHash: 1, day: 1 },
  { unique: true, partialFilterExpression: { day: { $type: 'string' } } }
)
viewEventSchema.index({ createdAt: 1 })

module.exports = mongoose.model('ViewEvent', viewEventSchema)