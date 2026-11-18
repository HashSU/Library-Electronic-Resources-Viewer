const User = require('../models/User')
const { serverError } = require('../utils/httpError')
const { isNonEmptyString, isObjectId, pick, MIN_PASSWORD_LENGTH } = require('../utils/validate')

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'admin' }).select('-password')
    res.json(users)
  } catch (error) {
    serverError(res, error, 'getUsers')
  }
}

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {}

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() })
    if (existing) return res.status(400).json({ message: 'Email already exists' })

    // Role is always 'admin' here - superadmins are only created through the seed script
    const user = await User.create({
      name: name.trim(),
      email,
      password,
      role: 'admin',
      createdBy: req.user._id
    })
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    })
  } catch (error) {
    serverError(res, error, 'createUser')
  }
}

// Only these fields can be changed. role, createdBy, _id etc. can never be set from the request.
const UPDATABLE_USER_FIELDS = ['name', 'email', 'password', 'isActive']

const updateUser = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'User not found' })

    const user = await User.findById(req.params.id)
    // This route manages admin accounts only; the superadmin account cannot be edited here
    if (!user || user.role !== 'admin') return res.status(404).json({ message: 'User not found' })

    const updates = pick(req.body, UPDATABLE_USER_FIELDS)

    if ('name' in updates) {
      if (!isNonEmptyString(updates.name)) return res.status(400).json({ message: 'Invalid name' })
      user.name = updates.name.trim()
    }
    if ('email' in updates) {
      if (!isNonEmptyString(updates.email)) return res.status(400).json({ message: 'Invalid email' })
      user.email = updates.email
    }
    if ('password' in updates) {
      if (!isNonEmptyString(updates.password) || updates.password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
      }
      user.password = updates.password // hashed by the pre('save') hook
    }
    if ('isActive' in updates) {
      if (typeof updates.isActive !== 'boolean') return res.status(400).json({ message: 'Invalid isActive value' })
      user.isActive = updates.isActive
    }

    await user.save()
    const { password, ...safe } = user.toObject()
    res.json(safe)
  } catch (error) {
    serverError(res, error, 'updateUser')
  }
}

const deleteUser = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'User not found' })

    // Only admin accounts can be deactivated here - never the superadmin
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'admin' },
      { isActive: false },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'Admin account deactivated' })
  } catch (error) {
    serverError(res, error, 'deleteUser')
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser }
