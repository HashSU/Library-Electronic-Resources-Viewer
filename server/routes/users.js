const express = require('express')
const router = express.Router()
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController')
const { protect, requireSuperAdmin } = require('../middleware/auth')

router.get('/', protect, requireSuperAdmin, getUsers)
router.post('/', protect, requireSuperAdmin, createUser)
router.put('/:id', protect, requireSuperAdmin, updateUser)
router.delete('/:id', protect, requireSuperAdmin, deleteUser)

module.exports = router