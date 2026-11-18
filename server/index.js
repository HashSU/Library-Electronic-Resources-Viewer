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

connectDB()

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

app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes) 
app.use('/api/categories', categoryRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/koha', kohaRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Library API is running' })
})

const PORT = config.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})