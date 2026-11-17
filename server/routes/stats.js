const express = require('express')
const router = express.Router()
const { getOverview, getViewTrends } = require('../controllers/statsController')
const { protect } = require('../middleware/auth')

router.get('/overview', protect, getOverview)
router.get('/views', protect, getViewTrends)

module.exports = router