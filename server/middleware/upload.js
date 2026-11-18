const multer = require('multer')
const path = require('path')
const fs = require('fs')
const config = require('../config/env')

const FOLDERS = {
  ebook: 'ebooks',
  ethesis: 'etheses',
  ejournal: 'ejournals'
}

// Make sure the upload folders exist (multer does not create them)
Object.values(FOLDERS).forEach((folder) => {
  fs.mkdirSync(path.join(config.UPLOAD_DIR, folder), { recursive: true })
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // NOTE: the form must send the "type" field BEFORE the file field (the admin upload page does)
    const folder = FOLDERS[req.body.type]
    if (!folder) return cb(new Error('Invalid resource type'), '')
    cb(null, path.join(config.UPLOAD_DIR, folder))
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname).toLowerCase())
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.epub', '.jpg', '.jpeg', '.png', '.tiff']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
})

module.exports = upload
module.exports.FOLDERS = FOLDERS
