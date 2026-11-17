const searchKoha = async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ message: 'Search query required' })

    const kohaUrl = process.env.KOHA_URL
    const kohaUser = process.env.KOHA_USER
    const kohaPass = process.env.KOHA_PASS

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
        }
      }
    )

    if (!response.ok) {
      return res.status(502).json({ message: 'Koha API error' })
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { searchKoha }