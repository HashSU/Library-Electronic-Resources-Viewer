const Resource = require('../models/Resource')
const ViewEvent = require('../models/ViewEvent')
const { serverError } = require('../utils/httpError')

// Numbers shown on the public homepage (no sensitive data)
const buildOverview = async () => {
  const totalResources = await Resource.countDocuments({ isActive: true })
  const totalViews = await ViewEvent.countDocuments()
  const byType = await Resource.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ])
  const topResources = await Resource.find({ isActive: true })
    .sort({ viewCount: -1 })
    .limit(5)
    .select('title author type viewCount')
  return { totalResources, totalViews, byType, topResources }
}

// Public: used by the homepage for visitors who are not logged in
const getPublicOverview = async (req, res) => {
  try {
    res.json(await buildOverview())
  } catch (error) {
    serverError(res, error, 'getPublicOverview')
  }
}

// Admin: same data today; admin-only extras can be added here later
const getOverview = async (req, res) => {
  try {
    res.json(await buildOverview())
  } catch (error) {
    serverError(res, error, 'getOverview')
  }
}

const getViewTrends = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 365)
    const since = new Date()
    since.setDate(since.getDate() - days)
    const trends = await ViewEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    res.json(trends)
  } catch (error) {
    serverError(res, error, 'getViewTrends')
  }
}

module.exports = { getPublicOverview, getOverview, getViewTrends }
