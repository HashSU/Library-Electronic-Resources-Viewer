const path = require('path')
const config = require('../config/env')

// Turns the path stored in the database (e.g. "uploads/ebooks/123.pdf") into an
// absolute path inside UPLOAD_DIR. Returns null if the result would fall outside
// UPLOAD_DIR (path traversal guard).
const resolveStoredPath = (storedPath) => {
  if (typeof storedPath !== 'string' || storedPath.length === 0) return null

  const relative = storedPath.replace(/\\/g, '/').replace(/^uploads\//, '')
  const absolute = path.resolve(config.UPLOAD_DIR, relative)
  const root = config.UPLOAD_DIR.endsWith(path.sep) ? config.UPLOAD_DIR : config.UPLOAD_DIR + path.sep

  if (!absolute.startsWith(root)) return null
  return absolute
}

module.exports = { resolveStoredPath }
