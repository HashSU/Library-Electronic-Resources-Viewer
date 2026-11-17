const dotenv = require('dotenv')
const path = require('path')
const connectDB = require('./config/db')
const User = require('./models/User')

dotenv.config({ path: path.join(__dirname, '.env') })

const seed = async () => {
  await connectDB()

  const existing = await User.findOne({ email: 'superadmin@library.com' })

  if (existing) {
    console.log('Superadmin already exists')
    process.exit()
  }

  await User.create({
    name: 'Super Admin',
    email: 'superadmin@library.com',
    password: 'admin123',
    role: 'superadmin'
  })

  console.log('Superadmin created successfully')
  process.exit()
}

seed()