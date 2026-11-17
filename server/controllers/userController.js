const User = require('../models/User')

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'admin' }).select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already exists' })
    const user = await User.create({
      name,
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
    res.status(500).json({ message: error.message })
  }
}

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'Admin account deactivated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser }