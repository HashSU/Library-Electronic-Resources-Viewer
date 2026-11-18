// Central place for environment configuration.
// Loads server/.env, validates required values, and exports one config object.
const path = require('path')
const crypto = require('crypto')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const isProduction = process.env.NODE_ENV === 'production'
const problems = []
const warnings = []

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) problems.push('MONGO_URI is not set')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  problems.push('JWT_SECRET is not set')
} else if (JWT_SECRET.length < 32) {
  const msg = 'JWT_SECRET should be at least 32 characters long'
  if (isProduction) problems.push(msg)
  else warnings.push(msg)
}

// Salt used when hashing visitor IPs for view tracking.
let IP_HASH_SALT = process.env.IP_HASH_SALT
if (!IP_HASH_SALT) {
  if (isProduction) {
    problems.push('IP_HASH_SALT is not set')
  } else {
    IP_HASH_SALT = crypto.randomBytes(16).toString('hex')
    warnings.push('IP_HASH_SALT is not set - using a random value for this run only')
  }
}

if (problems.length > 0) {
  console.error('Configuration error:')
  problems.forEach((p) => console.error(`  - ${p}`))
  console.error('Copy server/.env.example to server/.env and fill in the values.')
  process.exit(1)
}
warnings.forEach((w) => console.warn(`Config warning: ${w}`))

// TRUST_PROXY = number of reverse proxies in front of the app (0 = none).
// Only trust X-Forwarded-For when this is > 0, otherwise clients can spoof their IP.
const trustProxy = parseInt(process.env.TRUST_PROXY || '0', 10)

module.exports = {
  isProduction,
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI,
  JWT_SECRET,
  IP_HASH_SALT,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')),
  TRUST_PROXY: Number.isNaN(trustProxy) ? 0 : trustProxy,
  KOHA_URL: process.env.KOHA_URL,
  KOHA_USER: process.env.KOHA_USER,
  KOHA_PASS: process.env.KOHA_PASS,
  SUPERADMIN_NAME: process.env.SUPERADMIN_NAME || 'Super Admin',
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD,
}
