// Creates the first superadmin from environment variables.
//   npm run seed                    -> create the superadmin if none exists
//   npm run seed -- --reset-password -> set a new password on the existing superadmin
const config = require('./config/env')
const connectDB = require('./config/db')
const User = require('./models/User')

const MIN_LENGTH = 12
const resetMode = process.argv.includes('--reset-password')

const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}

const seed = async () => {
  const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = config

  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    fail('Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in server/.env first.')
  }
  if (SUPERADMIN_PASSWORD.length < MIN_LENGTH) {
    fail(`SUPERADMIN_PASSWORD must be at least ${MIN_LENGTH} characters.`)
  }
  if (['admin123', 'password', 'changeme'].includes(SUPERADMIN_PASSWORD.toLowerCase())) {
    fail('SUPERADMIN_PASSWORD is too easy to guess.')
  }

  await connectDB()

  const existing = await User.findOne({ role: 'superadmin' })

  if (existing && !resetMode) {
    console.log(`A superadmin already exists (${existing.email}). Use --reset-password to change its password.`)
    process.exit(0)
  }

  if (existing && resetMode) {
    existing.password = SUPERADMIN_PASSWORD // hashed by the pre('save') hook
    existing.isActive = true
    await existing.save()
    console.log(`Password reset for ${existing.email}`)
    process.exit(0)
  }

  await User.create({
    name: SUPERADMIN_NAME,
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    role: 'superadmin'
  })

  console.log('Superadmin created successfully')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
