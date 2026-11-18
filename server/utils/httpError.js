// Consistent error responses. Details are logged on the server only;
// clients never receive raw error messages or stack traces.
const serverError = (res, error, context = '') => {
  console.error(`[error]${context ? ' ' + context : ''}:`, error)

  if (error && error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier or value' })
  }
  if (error && error.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid input' })
  }
  if (error && error.code === 11000) {
    return res.status(400).json({ message: 'A record with that value already exists' })
  }
  return res.status(500).json({ message: 'Server error' })
}

module.exports = { serverError }
