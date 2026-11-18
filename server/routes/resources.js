const express = require('express')
const router = express.Router()
const {
  getResources,
  getResource,
  streamResourceFile,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController')
const { protect } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.get('/', getResources)
router.get('/:id/file', streamResourceFile)
router.get('/:id', getResource)
router.post('/', protect, upload.single('file'), createResource)
router.put('/:id', protect, updateResource)
router.delete('/:id', protect, deleteResource)

module.exports = router