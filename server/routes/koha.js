const express = require('express')
const router = express.Router()
const { searchKoha } = require('../controllers/kohaController')
const { protect } = require('../middleware/auth')

router.get('/search', protect, searchKoha)

module.exports = router