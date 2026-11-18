const config = require('../config/env')
const { serverError } = require('../utils/httpError')
const { isNonEmptyString } = require('../utils/validate')

const searchKoha = async (req, res) => {
  try {
    const { q } = req.query
    if (!isNonEmptyString(q)) return res.status(400).json({ message: 'Search query required' })

    const kohaUrl = config.KOHA_URL
    const kohaUser = config.KOHA_USER
    const kohaPass = config.KOHA_PASS

    if (!kohaUrl) {
      return res.status(503).json({ message: 'Koha integration is not configured' })
    }

    const credentials = Buffer.from(`${kohaUser || ''}:${kohaPass || ''}`).toString('base64')

    const response = await fetch(
      `${kohaUrl}/api/v1/biblios?q=${encodeURIComponent(q)}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // do not hang forever if Koha is down
      }
    )

    if (!response.ok) {
      return res.status(502).json({ message: 'Koha API error' })
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    if (error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error('[error] searchKoha: Koha request timed out')
      return res.status(504).json({ message: 'Koha did not respond in time' })
    }
    serverError(res, error, 'searchKoha')
  }
}

module.exports = { searchKoha }