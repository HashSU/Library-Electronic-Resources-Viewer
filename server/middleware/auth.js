const jwt = require('jsonwebtoken')
const config = require('../config/env')
const User = require('../models/User')

const protect = async (req, res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] })
    const user = await User.findById(decoded.id).select('-password')

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or account deactivated' })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next()
  } else {
    res.status(403).json({ message: 'Not authorized, superadmin only' })
  }
}

module.exports = { protect, requireSuperAdmin }
