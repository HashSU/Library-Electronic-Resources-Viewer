// Smoke tests for the hardening changes. No MongoDB needed: the models are replaced
// with small in-memory stubs. Run with:  npm run smoke
const path = require('path')
const fs = require('fs')
const os = require('os')
const http = require('http')

// ---- test environment (set before any app code is loaded) ----
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eres-uploads-'))
process.env.MONGO_URI = 'mongodb://stub/none'
process.env.JWT_SECRET = 'smoke-test-secret-smoke-test-secret-123456'
process.env.IP_HASH_SALT = 'smoke-salt'
process.env.UPLOAD_DIR = uploadDir
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.NODE_ENV = 'test'

// ---- in-memory model stubs ----
const calls = { resourceUpdate: null, viewUpserts: 0, viewInc: 0, resourceFilter: null, userSaved: null }
const ADMIN_ID = '64b000000000000000000001'
const RES_ID = '64b0000000000000000000aa'
const SUPER_ID = '64b000000000000000000002'
const OTHER_ADMIN_ID = '64b000000000000000000003'

const admin = { _id: ADMIN_ID, name: 'A', email: 'a@x.com', role: 'admin', isActive: true }
const selectable = (v) => ({ select: () => Promise.resolve(v) })

const User = {
  findOne: async () => null,
  findById: (id) => {
    if (id === ADMIN_ID) return selectable(admin)
    if (id === OTHER_ADMIN_ID) {
      const u = { _id: id, name: 'B', email: 'b@x.com', role: 'admin', isActive: true, password: 'hash',
        save: async function () { calls.userSaved = { ...this }; return this },
        toObject: function () { return { ...this } } }
      return Promise.resolve(u)
    }
    if (id === SUPER_ID) return selectable({ _id: id, name: 'S', email: 's@x.com', role: 'superadmin', isActive: true })
    return Promise.resolve(null)
  }
}
const resourceDoc = { _id: RES_ID, title: 'T', isActive: true, filePath: 'uploads/ebooks/test.pdf' }
const Resource = {
  countDocuments: async (f) => { calls.resourceFilter = f; return 1 },
  find: (f) => { calls.resourceFilter = f; const done = Promise.resolve([]); const c = { select: () => c, populate: () => c, sort: () => c, skip: () => c, limit: () => Object.assign(Promise.resolve([]), { select: () => done }) }; return c },
  findById: (id) => {
    const doc = global.__resDoc || resourceDoc
    const r = Promise.resolve(id === RES_ID ? doc : null)
    r.select = () => { const p = Promise.resolve(id === RES_ID ? doc : null); p.populate = () => Promise.resolve(id === RES_ID ? doc : null); return p }
    return r
  },
  findByIdAndUpdate: async (id, update) => { calls.resourceUpdate = update; return { _id: id } },
  create: async (d) => ({ _id: RES_ID, ...d }),
  updateOne: async () => { calls.viewInc++; return {} },
  aggregate: async () => []
}
const ViewEvent = {
  updateOne: async () => { calls.viewUpserts++; return { upsertedCount: global.__newView ? 1 : 0 } },
  countDocuments: async () => 7,
  aggregate: async () => []
}
const Category = { find: () => ({ sort: async () => [] }) }

const stub = (rel, exports) => {
  const file = require.resolve(path.join(__dirname, '..', rel))
  require.cache[file] = { id: file, filename: file, loaded: true, exports }
}
stub('models/User.js', User)
stub('models/Resource.js', Resource)
stub('models/ViewEvent.js', ViewEvent)
stub('models/Category.js', Category)

const app = require('../index')
const jwt = require('jsonwebtoken')
const token = jwt.sign({ id: ADMIN_ID }, process.env.JWT_SECRET, { expiresIn: '1h' })
const auth = { Authorization: `Bearer ${token}` }
const superToken = jwt.sign({ id: SUPER_ID }, process.env.JWT_SECRET, { expiresIn: '1h' })
const superAuth = { Authorization: `Bearer ${superToken}` }

let passed = 0
let failed = 0
const check = (name, ok, extra = '') => {
  if (ok) { passed++; console.log(`  PASS  ${name}`) } else { failed++; console.log(`  FAIL  ${name} ${extra}`) }
}

const makePdf = () => Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(2000, 'a')])

const run = async () => {
  const server = http.createServer(app).listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const j = async (url, opts) => { const r = await fetch(base + url, opts); let body = null; try { body = await r.clone().json() } catch {} return { r, body } }
  const jsonOpts = (method, body, headers = {}) => ({ method, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })

  console.log('Auth / input validation')
  let x = await j('/api/stats/overview')
  check('admin stats without token -> 401', x.r.status === 401)
  x = await j('/api/stats/overview', { headers: { Authorization: 'Token abc' } })
  check('malformed auth header -> 401 (does not hang)', x.r.status === 401)
  x = await j('/api/stats/public')
  check('public stats work without login', x.r.status === 200 && x.body.totalResources !== undefined)
  x = await j('/api/auth/login', jsonOpts('POST', { email: { $gt: '' }, password: 'x' }))
  check('NoSQL-injection login body -> 400', x.r.status === 400)
  x = await j('/api/nope')
  check('unknown API route -> JSON 404', x.r.status === 404 && x.body && x.body.message === 'Not found')
  x = await j('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
  check('malformed JSON -> 400', x.r.status === 400)
  check('helmet headers present', x.r.headers.get('x-content-type-options') === 'nosniff' && !x.r.headers.get('x-powered-by'))

  console.log('Search / filters')
  x = await j('/api/resources?type=hack')
  check('invalid type filter -> 400', x.r.status === 400)
  x = await j('/api/resources?category=zzz')
  check('invalid category filter -> 400', x.r.status === 400)
  x = await j('/api/resources?q=' + encodeURIComponent('.*(a+)+$'))
  const rx = calls.resourceFilter && calls.resourceFilter.$or && calls.resourceFilter.$or[0].title.$regex
  check('search text is regex-escaped', x.r.status === 200 && rx === '\\.\\*\\(a\\+\\)\\+\\$', String(rx))
  check('X-Total-Count header set', x.r.headers.get('x-total-count') === '1')

  console.log('Mass assignment')
  x = await j(`/api/resources/${RES_ID}`, jsonOpts('PUT', { title: 'New', filePath: '/etc/passwd', viewCount: 999, uploadedBy: SUPER_ID, isActive: true }, auth))
  const set = calls.resourceUpdate && calls.resourceUpdate.$set
  check('resource update keeps only whitelisted fields', x.r.status === 200 && set && set.title === 'New' && !('filePath' in set) && !('viewCount' in set) && !('uploadedBy' in set), JSON.stringify(set))
  x = await j(`/api/users/${OTHER_ADMIN_ID}`, jsonOpts('PUT', { name: 'Renamed', role: 'superadmin' }, auth))
  check('user update: non-superadmin caller blocked (403)', x.r.status === 403)
  x = await j(`/api/users/${OTHER_ADMIN_ID}`, jsonOpts('PUT', { name: 'Renamed', role: 'superadmin', password: 'short' }, superAuth))
  check('user update: short password rejected (400)', x.r.status === 400)
  x = await j(`/api/users/${OTHER_ADMIN_ID}`, jsonOpts('PUT', { name: 'Renamed', role: 'superadmin' }, superAuth))
  check('user update: role escalation ignored, name changed', x.r.status === 200 && calls.userSaved && calls.userSaved.role === 'admin' && calls.userSaved.name === 'Renamed', JSON.stringify(calls.userSaved))
  x = await j(`/api/users/${SUPER_ID}`, jsonOpts('PUT', { name: 'Hack' }, superAuth))
  check('superadmin account cannot be edited through this route (404)', x.r.status === 404)

  console.log('File serving')
  fs.writeFileSync(path.join(uploadDir, 'ebooks', 'test.pdf'), makePdf())
  x = await j('/uploads/ebooks/test.pdf')
  check('old public /uploads path is gone (404)', x.r.status === 404)
  let r = await fetch(`${base}/api/resources/${RES_ID}/file`)
  check('file route streams the PDF', r.status === 200 && r.headers.get('content-type').includes('pdf'))
  check('inline disposition + frame-ancestors, no X-Frame-Options',
    r.headers.get('content-disposition') === 'inline' && (r.headers.get('content-security-policy') || '').includes('frame-ancestors') && !r.headers.get('x-frame-options'))
  r = await fetch(`${base}/api/resources/${RES_ID}/file`, { headers: { Range: 'bytes=0-99' } })
  check('range requests supported (206)', r.status === 206)
  global.__resDoc = { ...resourceDoc, filePath: '../../../../etc/passwd' }
  r = await fetch(`${base}/api/resources/${RES_ID}/file`)
  check('path traversal blocked (404)', r.status === 404)
  global.__resDoc = { ...resourceDoc, isActive: false }
  r = await fetch(`${base}/api/resources/${RES_ID}/file`)
  check('deactivated resource file not served (404)', r.status === 404)
  global.__resDoc = null
  r = await fetch(`${base}/api/resources/not-an-id/file`)
  check('bad id -> 404 not 500', r.status === 404)

  console.log('Uploads')
  const form = (type, filename, content) => {
    const f = new FormData()
    f.append('title', 'Book'); f.append('author', 'Me'); f.append('type', type)
    f.append('file', new Blob([content]), filename)
    return f
  }
  const countFiles = () => fs.readdirSync(path.join(uploadDir, 'ebooks')).length
  const before = countFiles()
  x = await j('/api/resources', { method: 'POST', headers: auth, body: form('ebook', 'good.pdf', makePdf()) })
  check('valid PDF upload -> 201, stored as uploads/ebooks/...', x.r.status === 201 && /^uploads\/ebooks\/.+\.pdf$/.test(x.body.filePath) && x.body.fileType === 'application/pdf', JSON.stringify(x.body))
  const afterGood = countFiles()
  x = await j('/api/resources', { method: 'POST', headers: auth, body: form('ebook', 'fake.pdf', Buffer.from('<?php echo 1; ?>')) })
  check('fake PDF (wrong content) rejected and file deleted', x.r.status === 400 && countFiles() === afterGood, JSON.stringify(x.body))
  x = await j('/api/resources', { method: 'POST', headers: auth, body: form('nonsense', 'a.pdf', makePdf()) })
  check('invalid type rejected with clean 400', x.r.status === 400 && x.body.message === 'Invalid resource type', JSON.stringify(x.body))
  x = await j('/api/resources', { method: 'POST', headers: auth, body: form('ebook', 'run.exe', makePdf()) })
  check('disallowed extension rejected', x.r.status === 400 && x.body.message === 'File type not allowed', JSON.stringify(x.body))
  check('upload folders created automatically', fs.existsSync(path.join(uploadDir, 'etheses')) && fs.existsSync(path.join(uploadDir, 'ejournals')))
  check('only the valid upload left a file behind', afterGood === before + 1 && countFiles() === afterGood)

  console.log('View tracking')
  calls.viewUpserts = 0; calls.viewInc = 0; global.__newView = true
  await j(`/api/resources/${RES_ID}`)
  check('first view of the day increments the counter', calls.viewUpserts === 1 && calls.viewInc === 1)
  calls.viewInc = 0; global.__newView = false
  await j(`/api/resources/${RES_ID}`)
  check('repeat view the same day does not increment', calls.viewInc === 0)

  console.log('Login rate limit')
  let limited = 0
  for (let i = 0; i < 12; i++) {
    const t = await j('/api/auth/login', jsonOpts('POST', { email: 'nobody@x.com', password: 'wrong-password' }))
    if (t.r.status === 429) limited++
  }
  check('repeated failed logins get rate limited (429)', limited > 0, `limited=${limited}`)

  server.close()
  fs.rmSync(uploadDir, { recursive: true, force: true })
  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
