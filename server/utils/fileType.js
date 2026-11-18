const fs = require('fs')

// Detect a file's real type from its first bytes (the extension and the
// browser-supplied MIME type can both be faked).
const SIGNATURES = [
  { ext: '.pdf',  mime: 'application/pdf',  test: (b) => b.slice(0, 5).toString('latin1') === '%PDF-' },
  { ext: '.epub', mime: 'application/epub+zip', test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
  { ext: '.png',  mime: 'image/png',        test: (b) => b[0] === 0x89 && b.slice(1, 4).toString('latin1') === 'PNG' },
  { ext: '.jpg',  mime: 'image/jpeg',       test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: '.tiff', mime: 'image/tiff',       test: (b) => (b.slice(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) || b.slice(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))) },
]

const detectFileType = (filePath) => {
  const fd = fs.openSync(filePath, 'r')
  try {
    const buf = Buffer.alloc(16)
    const read = fs.readSync(fd, buf, 0, 16, 0)
    if (read < 4) return null
    return SIGNATURES.find((sig) => sig.test(buf)) || null
  } finally {
    fs.closeSync(fd)
  }
}

// Does the detected type match what the file extension claims?
const extensionMatches = (ext, detected) => {
  const e = ext.toLowerCase()
  if (!detected) return false
  if (detected.ext === '.jpg') return e === '.jpg' || e === '.jpeg'
  return e === detected.ext
}

module.exports = { detectFileType, extensionMatches }
