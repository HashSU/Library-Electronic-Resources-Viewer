const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config/env')
const User = require('../models/User')
const { serverError } = require('../utils/httpError')
const { isNonEmptyString } = require('../utils/validate')

const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' })
}

// Used so a login for an unknown email takes about as long as one for a real email
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}

    // Must be plain strings - blocks NoSQL injection such as { "email": { "$gt": "" } }
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.trim().toLowerCase(), isActive: true })

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH)
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    serverError(res, error, 'login')
  }
}

const getMe = async (req, res) => {
  res.json(req.user)
}

module.exports = { login, getMe }
