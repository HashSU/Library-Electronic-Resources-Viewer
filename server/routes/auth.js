const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const { login, getMe } = require('../controllers/authController')
const { protect } = require('../middleware/auth')

// Slow down password guessing: 10 failed attempts per 15 minutes per IP.
// Successful logins do not count against the limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' }
})

router.post('/login', loginLimiter, login)
router.get('/me', protect, getMe)

module.exports = router
