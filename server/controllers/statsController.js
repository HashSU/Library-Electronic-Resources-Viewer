const Resource = require('../models/Resource')
const ViewEvent = require('../models/ViewEvent')

const getOverview = async (req, res) => {
  try {
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
    res.json({ totalResources, totalViews, byType, topResources })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getViewTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7
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
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getOverview, getViewTrends }