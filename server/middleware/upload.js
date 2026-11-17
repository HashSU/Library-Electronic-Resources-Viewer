const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type
    let folder = 'uploads/'
    if (type === 'ebook') folder += 'ebooks'
    else if (type === 'ethesis') folder += 'etheses'
    else if (type === 'ejournal') folder += 'ejournals'
    else folder += 'ebooks'
    cb(null, folder)
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
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