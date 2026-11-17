const express = require('express')
const dotenv = require('dotenv')
const path = require('path')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/categories')
const resourceRoutes = require('./routes/resources')
const userRoutes = require('./routes/users')
const statsRoutes = require('./routes/stats')
const kohaRoutes = require('./routes/koha')

dotenv.config({ path: path.join(__dirname, '.env') })

connectDB()

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})