const Category = require('../models/Category')

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body
    const category = await Category.create({
      name,
      description,
      createdBy: req.user._id
    })
    res.status(201).json(category)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' })
    }
    res.status(500).json({ message: error.message })
  }
}

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, description: req.body.description },
      { new: true }
    )
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json({ message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory }