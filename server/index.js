const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/categories')
const resourceRoutes = require('./routes/resources')
const userRoutes = require('./routes/users')
const statsRoutes = require('./routes/stats')
const kohaRoutes = require('./routes/koha')

dotenv.config()

connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/koha', kohaRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Library API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})