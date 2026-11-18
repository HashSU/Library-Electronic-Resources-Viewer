const express = require('express')
const router = express.Router()
const { getPublicOverview, getOverview, getViewTrends } = require('../controllers/statsController')
const { protect } = require('../middleware/auth')

router.get('/public', getPublicOverview)          // homepage numbers, no login needed
router.get('/overview', protect, getOverview)     // admin dashboard
router.get('/views', protect, getViewTrends)      // admin view trends

module.exports = router
