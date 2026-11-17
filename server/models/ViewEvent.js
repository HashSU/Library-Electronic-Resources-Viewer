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
  }
}, { timestamps: true })

module.exports = mongoose.model('ViewEvent', viewEventSchema)