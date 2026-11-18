const mongoose = require('mongoose')

// True only for real strings (blocks objects like { "$ne": null } sent in JSON bodies)
const isString = (v) => typeof v === 'string'

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

const isObjectId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v)

// Copy only the allowed keys from an object
const pick = (obj, keys) => {
  const out = {}
  if (!obj || typeof obj !== 'object') return out
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      out[key] = obj[key]
    }
  }
  return out
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const MIN_PASSWORD_LENGTH = 10

module.exports = { isString, isNonEmptyString, isObjectId, pick, escapeRegex, MIN_PASSWORD_LENGTH }
