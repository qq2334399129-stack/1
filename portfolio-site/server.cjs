'use strict'

const http = require('node:http')
const fs = require('node:fs/promises')
const { createReadStream, createWriteStream } = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { isIP } = require('node:net')
const { Transform } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const defaults = require('./public/defaults.json')

const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'))
const uploadDir = path.join(dataDir, 'uploads')
const authPath = path.join(dataDir, 'admin.json')
const statePath = path.join(dataDir, 'content.json')
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
const hours = 8 * 60 * 60 * 1000
const mediaId = /^[a-f0-9-]{36}\.(?:jpg|png|webp|gif|mp4|webm|bin)$/
const mime = { jpg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif', svg:'image/svg+xml', mp4:'video/mp4', webm:'video/webm', bin:'application/octet-stream', json:'application/json; charset=utf-8', html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8' }
const staticFiles = new Map([
  ['/','index.html'], ['/index.html','index.html'],
  ['/sku','sku/index.html'], ['/sku/','sku/index.html'], ['/sku/index.html','sku/index.html'],
  ['/assets-library','assets-library/index.html'], ['/assets-library/','assets-library/index.html'], ['/assets-library/index.html','assets-library/index.html'],
  ['/admin','admin/index.html'], ['/admin/','admin/index.html'], ['/admin/index.html','admin/index.html'], ['/admin.html','admin/index.html'],
  ['/style.css','style.css'], ['/app.js','app.js'], ['/admin.js','admin.js'], ['/admin.css','admin.css'],
  ['/defaults.json','defaults.json'],
  ['/assets/mark.svg','assets/mark.svg'], ['/assets/ridge.webp','assets/ridge.webp'], ['/assets/red.webp','assets/red.webp'],
  ['/assets/red-study.mp4','assets/red-study.mp4'], ['/assets/moss.webp','assets/moss.webp']
])
const imageExt = /\.(?:jpg|png|webp|gif|svg)$/
const videoExt = /\.(?:mp4|webm)$/
const sessions = new Map()
let state
let credentials
const loginAttempts = new Map()
let publishedMedia = new Set()
let activeUploads = 0
let saving = Promise.resolve()

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
const fail = (status, message) => { throw new HttpError(status, message) }
const digest = (password, salt) => crypto.scryptSync(password, salt, 64)

async function atomicJson(file, value) {
  const tmp = file + '.' + crypto.randomUUID() + '.tmp'
  try {
    await fs.writeFile(tmp, JSON.stringify(value, null, 2) + '\n', { flag:'wx', mode:0o600 })
    await fs.rename(tmp, file)
  } finally { await fs.rm(tmp, { force:true }) }
}

async function loadJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) }
  catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback
    throw error
  }
}

async function writePassword(overwrite) {
  const password = crypto.randomBytes(18).toString('base64url')
  const salt = crypto.randomBytes(16).toString('hex')
  const record = { salt, hash:digest(password, salt).toString('hex') }
  if (overwrite) await atomicJson(authPath, record)
  else {
    try { await fs.writeFile(authPath, JSON.stringify(record) + '\n', { flag:'wx', mode:0o600 }) }
    catch (error) {
      if (error.code !== 'EEXIST') throw error
      console.log('管理员已初始化。如需重置，执行 npm run reset-password。')
      return
    }
  }
  console.log('管理入口 /admin\n用户名 admin\n一次性显示的登录密码 ' + password)
  if (overwrite) console.log('如网站正在运行，请重启服务以使旧会话失效。')
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' })
  res.end(JSON.stringify(payload))
}

async function readJson(req) {
  if (String(req.headers['content-type']).split(';')[0] !== 'application/json') fail(415, '请求必须使用 JSON。')
  if (Number(req.headers['content-length']) > 1024 * 1024) fail(413, '内容过长。')
  let size = 0
  const chunks = []
  for await (const chunk of req.iterator({ destroyOnReturn:false })) {
    size += chunk.length
    if (size > 1024 * 1024) { req.resume(); fail(413, '内容过长。') }
    chunks.push(chunk)
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString())
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error()
    return value
  } catch { fail(400, '无法读取请求内容。') }
}

function session(req) {
  const token = req.headers.cookie?.match(/(?:^|;\s*)xiaoye_session=([a-f0-9]{64})(?:;|$)/)?.[1]
  const value = token && sessions.get(token)
  if (!value) return null
  if (value.until <= Date.now()) { sessions.delete(token); return null }
  return { ...value, token }
}

function authorize(req, write = false) {
  const value = session(req)
  if (!value) fail(401, '请先登录。')
  if (write && req.headers['x-csrf-token'] !== value.csrf) fail(403, '会话验证失败，请刷新后台。')
  return value
}

function sessionCookie(req, token, maxAge) {
  const secure = process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https'
  return 'xiaoye_session=' + token + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + maxAge + (secure ? '; Secure' : '')
}

async function login(req, res) {
  if (req.headers['x-admin-request'] !== '1') fail(403, '请通过后台登录页面提交。')
  const body = await readJson(req)
  const now = Date.now()
  const remote = req.socket.remoteAddress
  const proxyIp = req.headers['x-real-ip']
  const ip = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote) && isIP(proxyIp || '') ? proxyIp : remote
  for (const [key, entry] of loginAttempts) if (entry.until <= now) loginAttempts.delete(key)
  if (!loginAttempts.has(ip) && loginAttempts.size >= 1000) fail(429, '登录尝试过多，请稍后再试。')
  const attempts = loginAttempts.get(ip) || { count:0, until:now + 10 * 60 * 1000 }
  if (attempts.count >= 10) fail(429, '登录尝试过多，请稍后再试。')
  attempts.count++
  loginAttempts.set(ip,attempts)
  const valid = typeof body.password === 'string' && body.password.length <= 128
    && crypto.timingSafeEqual(digest(body.password, credentials.salt), Buffer.from(credentials.hash, 'hex'))
  if (body.username !== 'admin' || !valid) fail(401, '用户名或密码有误。')
  loginAttempts.delete(ip)
  for (const [token, value] of sessions) if (value.until <= now) sessions.delete(token)
  const previous = session(req)
  if (previous) sessions.delete(previous.token)
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { csrf:crypto.randomBytes(24).toString('hex'), until:now + hours })
  res.setHeader('Set-Cookie', sessionCookie(req, token, hours / 1000))
  json(res, 200, { ok:true })
}

function url(value, schemes = ['https:']) {
  value = text(value, 2048)
  if (!value) return ''
  try {
    const parsed = new URL(value)
    if (schemes.includes(parsed.protocol) && !parsed.username && !parsed.password) return parsed.href
  } catch {}
  fail(400, '链接格式无效，请使用官方 HTTPS 分享链接或对应 App 链接。')
}

function text(value, limit = 160) {
  if (value == null) return ''
  if (typeof value !== 'string' || value.length > limit) fail(400, '字段格式错误或内容过长。')
  return value.trim()
}

function media(value, kind) {
  const ref = text(value, 130)
  if (!ref) return ''
  const builtIn = staticFiles.has('/' + ref) && ref.startsWith('assets/')
  const uploaded = ref.startsWith('/media/') && mediaId.test(ref.slice(7))
  const matches = kind === 'image' ? imageExt.test(ref) : kind === 'video' ? videoExt.test(ref) : ref.endsWith('.bin')
  if ((!builtIn && !uploaded) || !matches) fail(400, '存在无效的媒体文件，请重新上传。')
  return ref
}

function rows(value, fields, required) {
  if (!Array.isArray(value) || value.length > 80) fail(400, '每类最多 80 项。')
  return value.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail(400, '条目格式错误。')
    const result = Object.fromEntries(Object.entries(fields).map(([key, parse]) => [key, parse(row[key])]))
    if (required.some(key => !result[key])) fail(400, '条目缺少标题或必要文件。')
    return result
  })
}

const image = value => media(value, 'image')
const attachment = value => media(value, 'file')
const description = value => text(value, 2500)
function normalize(input) {
  const result = {}
  for (const key of ['name','topic','heroAlt','subscriptionLabel','videoTitle','skuTitle','assetTitle','toolsTitle']) {
    result[key] = text(input[key])
  }
  for (const key of ['intro','services','skillText','skuIntro','assetIntro']) result[key] = description(input[key])
  if (!result.name || !result.videoTitle || !result.skuTitle || !result.assetTitle || !result.toolsTitle) fail(400, '请填写站名和区块标题。')
  result.avatar = image(input.avatar)
  result.hero = image(input.hero)
  result.subscriptionUrl = url(input.subscriptionUrl)
  const contact = input.contact || {}
  const email = text(contact.email, 254)
  if (email && !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) fail(400, '邮箱地址格式不正确。')
  result.contact = {
    email, qqUrl:url(contact.qqUrl, ['https:','mqqapi:','mqqwpa:']),
    wechatUrl:url(contact.wechatUrl, ['https:','weixin:']),
    qqQr:image(contact.qqQr), wechatQr:image(contact.wechatQr)
  }
  result.videos = rows(input.videos, { title:text, category:text, description, cover:image, video:value=>media(value,'video') }, ['title','video'])
  result.sku = rows(input.sku, { title:text, code:text, description, image, link:value=>url(value) }, ['title'])
  result.assets = rows(input.assets, { title:text, category:text, description, image, prompt:description, file:attachment, fileName:text }, ['title'])
  result.tools = rows(input.tools, {
    title:text, description, file:attachment, fileName:text, access:value=>value === 'public' ? 'public' : 'contact'
  }, ['title'])
  return result
}

function publicContent() {
  const content = { ...state.content }
  content.tools = content.tools.map(item => item.access === 'public' ? item : { ...item, file:'', fileName:'' })
  return content
}

function getMediaRefs(content) {
  const fields = [content.avatar, content.hero, content.contact.qqQr, content.contact.wechatQr]
  for (const row of content.videos) fields.push(row.cover, row.video)
  for (const row of content.sku) fields.push(row.image)
  for (const row of content.assets) fields.push(row.image, row.file)
  for (const row of content.tools) fields.push(row.file)
  return new Set(fields.filter(ref => ref?.startsWith('/media/')).map(ref => ref.slice(7)))
}

async function saveContent(req, res) {
  authorize(req, true)
  const payload = await readJson(req)
  const content = normalize(payload.content || {})
  const job = saving.then(async () => {
    if (payload.version !== state.version) fail(409, '内容已在其他窗口更新。请刷新后台后重新编辑。')
    for (const name of getMediaRefs(content)) {
      try { await fs.access(path.join(uploadDir, name)) }
      catch { fail(400, '有媒体文件不存在，请重新上传。') }
    }
    const next = { version:state.version + 1, content }
    await atomicJson(statePath, next)
    state = next
    publishedMedia = getMediaRefs(publicContent())
    return next
  })
  saving = job.catch(() => {})
  json(res, 200, await job)
}

function identify(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) return 'png'
  if (buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP') return 'webp'
  if (['GIF89a','GIF87a'].includes(buffer.toString('ascii',0,6))) return 'gif'
  if (buffer.toString('ascii',4,8) === 'ftyp') return 'mp4'
  if (buffer.subarray(0,4).equals(Buffer.from('1a45dfa3','hex'))) return 'webm'
  return ''
}

async function upload(req, res, kind) {
  authorize(req, true)
  const formats = { image:['jpg','png','webp','gif'], video:['mp4','webm'], file:['bin'] }
  if (!Object.hasOwn(formats,kind)) fail(400, '上传类型无效。')
  const allowed = formats[kind]
  const limit = (kind === 'image' ? 16 : kind === 'video' ? 512 : 256) * 1024 * 1024
  const length = Number(req.headers['content-length'])
  if (!Number.isSafeInteger(length) || length <= 0) fail(411, '文件为空或无法读取。')
  if (length > limit) fail(413, '文件超出大小限制。')
  if (activeUploads >= 3) fail(429, '同时上传的文件过多，请稍后再试。')
  activeUploads++
  const id = crypto.randomUUID()
  const tmp = path.join(uploadDir, id + '.part')
  let count = 0
  try {
    const limiter = new Transform({
      transform(chunk, encoding, done) {
        count += chunk.length
        done(count > limit ? new HttpError(413, '文件超出大小限制。') : null, chunk)
      }
    })
    await pipeline(req, limiter, createWriteStream(tmp, { flags:'wx', mode:0o600 }))
    if (kind !== 'file' && count < 12) fail(400, '无法识别文件。')
    const file = await fs.open(tmp, 'r')
    const signature = Buffer.alloc(16)
    try { await file.read(signature,0,16,0) } finally { await file.close() }
    const ext = kind === 'file' ? 'bin' : identify(signature)
    if (!allowed.includes(ext)) fail(400, kind === 'image' ? '请上传 JPG、PNG、WebP 或 GIF 图片。' : '请上传 MP4 或 WebM 视频。')
    const filename = id + '.' + ext
    await fs.rename(tmp, path.join(uploadDir, filename))
    json(res, 201, { url:'/media/' + filename })
  } finally {
    activeUploads--
    await fs.rm(tmp, { force:true })
  }
}

async function serve(req, res, file, ext, cache) {
  let stat
  try { stat = await fs.stat(file) } catch (error) { if (error.code === 'ENOENT') fail(404, '文件不存在。'); throw error }
  if (!stat.isFile()) fail(404, '文件不存在。')
  const headers = { 'Content-Type':mime[ext] || 'application/octet-stream', 'Cache-Control':cache, 'Accept-Ranges':'bytes' }
  if (ext === 'bin') {
    const requested = new URL(req.url,'http://localhost').searchParams.get('name') || 'download'
    const name = requested.slice(0,140).replace(/[\\/\x00-\x1f\x7f]/g,'_').toWellFormed()
    headers['Content-Disposition'] = "attachment; filename=\"download\"; filename*=UTF-8''" + encodeURIComponent(name).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16))
  }
  let start = 0
  let end = stat.size - 1
  let status = 200
  if (req.headers.range && stat.size > 0) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
    if (match && (match[1] || match[2])) {
      if (match[1]) { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])) }
      else start = Math.max(0, stat.size - Number(match[2]))
      if (start < stat.size && end >= start) {
        status = 206
        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`
      } else {
        res.writeHead(416, { 'Content-Range':'bytes */' + stat.size })
        res.end()
        return
      }
    }
  }
  headers['Content-Length'] = stat.size === 0 ? 0 : end - start + 1
  res.writeHead(status, headers)
  if (req.method === 'HEAD' || stat.size === 0) res.end()
  else await pipeline(createReadStream(file,{ start,end }),res)
}

async function route(req, res) {
  const current = new URL(req.url, 'http://localhost')
  const { pathname } = current
  const method = req.method
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
  if (method === 'GET' && pathname === '/api/health') return json(res,200,{ service:'xiaoye-portfolio', status:'ok' })
  if (method === 'GET' && pathname === '/api/content') return json(res,200,publicContent())
  if (method === 'POST' && pathname === '/api/login') return login(req,res)
  if (method === 'POST' && pathname === '/api/logout') {
    sessions.delete(authorize(req,true).token)
    res.setHeader('Set-Cookie',sessionCookie(req,'',0))
    return json(res,200,{ ok:true })
  }
  if (method === 'GET' && pathname === '/api/admin') {
    const loginSession = authorize(req)
    return json(res,200,{ ...state, csrf:loginSession.csrf })
  }
  if (method === 'PUT' && pathname === '/api/admin') return saveContent(req,res)
  if (method === 'PUT' && pathname === '/api/upload') return upload(req,res,current.searchParams.get('kind'))
  if (method === 'GET' || method === 'HEAD') {
    const filename = staticFiles.get(pathname)
    if (filename) return serve(req,res,path.join(__dirname,'public',filename),path.extname(filename).slice(1),'no-cache')
    const uploaded = pathname.startsWith('/media/') && pathname.slice(7)
    if (uploaded && mediaId.test(uploaded)) {
      if (!publishedMedia.has(uploaded) && !session(req)) fail(404,'文件不存在。')
      return serve(req,res,path.join(uploadDir,uploaded),path.extname(uploaded).slice(1),'private, no-cache')
    }
  }
  fail(404,'页面不存在。')
}

async function main() {
  await fs.mkdir(uploadDir,{ recursive:true, mode:0o700 })
  if (process.argv.includes('--init') || process.argv.includes('--reset-password')) return writePassword(process.argv.includes('--reset-password'))
  credentials = await loadJson(authPath,null)
  if (!credentials) throw Error('请先在站点目录执行 npm run init，记录后台密码后再启动。')
  state = await loadJson(statePath,{ version:0,content:defaults })
  publishedMedia = getMediaRefs(publicContent())
  const server = http.createServer({ requestTimeout:30 * 60 * 1000 }, (req,res) => {
    route(req,res).catch(error => {
      if (res.destroyed) return
      if (res.headersSent) { res.destroy(); return }
      if (!(error instanceof HttpError)) console.error(error)
      json(res,error.status || 500,{ error:error.status ? error.message : '服务器暂时无法处理请求。' })
    })
  })
  server.listen(port,host,()=>console.log(`作品集运行在 http://${host}:${port} · 后台 /admin`))
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
