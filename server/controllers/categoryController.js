const Category = require('../models/Category')
const Resource = require('../models/Resource')
const { serverError } = require('../utils/httpError')
const { isString, isNonEmptyString, isObjectId } = require('../utils/validate')

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.json(categories)
  } catch (error) {
    serverError(res, error, 'getCategories')
  }
}

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body || {}
    if (!isNonEmptyString(name)) return res.status(400).json({ message: 'Category name is required' })
    if (description !== undefined && !isString(description)) {
      return res.status(400).json({ message: 'Invalid description' })
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      createdBy: req.user._id
    })
    res.status(201).json(category)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' })
    }
    serverError(res, error, 'createCategory')
  }
}

const updateCategory = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'Category not found' })

    const { name, description } = req.body || {}
    const updates = {}
    if (name !== undefined) {
      if (!isNonEmptyString(name)) return res.status(400).json({ message: 'Invalid category name' })
      updates.name = name.trim()
    }
    if (description !== undefined) {
      if (!isString(description)) return res.status(400).json({ message: 'Invalid description' })
      updates.description = description
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json(category)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' })
    }
    serverError(res, error, 'updateCategory')
  }
}

const deleteCategory = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'Category not found' })

    // Refuse to delete a category that active resources still use
    const inUse = await Resource.countDocuments({ category: req.params.id, isActive: true })
    if (inUse > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${inUse} active resource(s) still use this category. Reassign them first.`
      })
    }

    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    // Deactivated resources must not keep pointing at a deleted category
    await Resource.updateMany({ category: req.params.id }, { $set: { category: null } })

    res.json({ message: 'Category deleted' })
  } catch (error) {
    serverError(res, error, 'deleteCategory')
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory }
