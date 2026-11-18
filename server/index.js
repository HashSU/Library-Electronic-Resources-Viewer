const config = require('./config/env')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const connectDB = require('./config/db')
const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/categories')
const resourceRoutes = require('./routes/resources')
const userRoutes = require('./routes/users')
const statsRoutes = require('./routes/stats')
const kohaRoutes = require('./routes/koha')

const app = express()

// Only trust X-Forwarded-For when a known number of reverse proxies sit in front (TRUST_PROXY in .env)
app.set('trust proxy', config.TRUST_PROXY)

app.use(helmet())

app.use(cors({
  origin: config.CLIENT_ORIGIN,
  credentials: true,
  exposedHeaders: ['X-Total-Count'],
}))

app.use(express.json({ limit: '100kb' }))

// Uploaded files are NOT served statically. They are streamed through
// GET /api/resources/:id/file so access rules can be enforced.

app.use('/api/auth', authRoutes) 
app.use('/api/categories', categoryRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/koha', kohaRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Library API is running' })
})

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// Central error handler: logs details on the server, sends a safe message to the client
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)

  if (err.name === 'MulterError') {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 100 MB)' : 'Upload error'
    return res.status(status).json({ message })
  }
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' })
  if (err.expose && err.status && err.status < 500) return res.status(err.status).json({ message: err.message })

  console.error('[error] unhandled:', err)
  res.status(500).json({ message: 'Server error' })
})

module.exports = app

if (require.main === module) {
  connectDB().then(() => {
    app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`)
    })
  })
}