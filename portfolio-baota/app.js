'use strict'

const byId = id => document.getElementById(id)
const motion = matchMedia('(prefers-reduced-motion: no-preference)')
const dialog = byId('project-dialog')
const media = byId('project-media')
const details = byId('project-details')
let opener

function element(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}
function image(src, alt = '') {
  const node = element('img')
  node.src = src
  node.alt = alt
  node.loading = 'lazy'
  return node
}
function link(label, href, className = 'button quiet') {
  const node = element('a', className, label)
  node.href = href
  if (href.startsWith('https://')) { node.target = '_blank'; node.rel = 'noopener noreferrer' }
  return node
}
function download(row, label) {
  return link(label, row.file + '&name=' + encodeURIComponent(row.fileName || row.title))
}
function button(label, handler, className = 'button quiet') {
  const node = element('button', className, label)
  node.type = 'button'
  node.addEventListener('click', () => handler(node))
  return node
}
function open(title, source) {
  opener = source
  byId('project-title').textContent = title
  media.replaceChildren()
  details.replaceChildren()
  dialog.showModal()
  dialog.querySelector('.dialog-close').focus()
}
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close())
dialog.addEventListener('close', () => {
  media.querySelector('video')?.pause()
  media.replaceChildren()
  details.replaceChildren()
  opener?.focus({ preventScroll:true })
})
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return
  const rect = dialog.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close()
})

function contactLinks(contact) {
  const items = []
  if (contact.qqUrl) items.push(link('QQ ↗',contact.qqUrl,'text-link'))
  if (contact.wechatUrl) items.push(link('微信 ↗',contact.wechatUrl,'text-link'))
  if (contact.email) items.push(link(contact.email,'mailto:' + contact.email,'text-link'))
  return items
}
function showContact(contact, source) {
  open('联系我', source)
  const codes = element('div','qr-grid')
  for (const [label, src] of [['微信',contact.wechatQr],['QQ',contact.qqQr]]) {
    if (!src) continue
    const figure = element('figure')
    figure.append(image(src,label + '二维码'),element('figcaption','',label + '扫码联系'))
    codes.append(figure)
  }
  if (codes.childElementCount) media.append(codes)
  const links = contactLinks(contact)
  for (const item of links) details.append(item)
  if (!codes.childElementCount && !links.length) details.append(element('p','','联系方式待补充。'))
}

function showVideo(row, source) {
  open(row.title,source)
  const node = element('video')
  node.controls = true
  node.playsInline = true
  node.preload = 'metadata'
  if (row.cover) node.poster = row.cover
  node.src = row.video
  node.addEventListener('error', () => {
    if (!node.isConnected) return
    media.replaceChildren(link('打开视频文件',row.video))
  },{ once:true })
  media.append(node)
  if (row.description) details.append(element('p','',row.description))
  node.play().catch(() => {})
}

function renderVideos(rows) {
  const track = byId('video-list')
  byId('video-count').textContent = rows.length ? rows.length + ' 部视频' : ''
  if (!rows.length) { track.append(element('p','section-note','视频作品待更新。')); return }
  for (const row of rows) {
    const card = element('article','video-feature')
    const cover = button('',src => showVideo(row,src),'media-cover')
    cover.setAttribute('aria-label','播放视频 ' + row.title)
    if (row.cover) cover.append(image(row.cover))
    cover.append(element('span','play-mark','▶'))
    const copy = element('div','feature-details')
    if (row.category) copy.append(element('p','feature-category',row.category))
    copy.append(element('h3','',row.title))
    if (row.description) copy.append(element('p','',row.description))
    if (!row.cover) cover.append(element('span','no-cover-label',row.title))
    card.append(cover,copy)
    track.append(card)
  }
  if (rows.length < 2) return
  track.tabIndex = 0
  const prev = byId('video-prev')
  const next = byId('video-next')
  const position = byId('video-position')
  const cards = [...track.children]
  let index = 0
  function update() {
    const left = track.getBoundingClientRect().left
    let distance = Infinity
    cards.forEach((card,i) => {
      const gap = Math.abs(card.getBoundingClientRect().left - left)
      if (gap < distance) { distance = gap; index = i }
    })
    const label = (index + 1) + ' / ' + cards.length
    if (position.textContent !== label) position.textContent = label
    prev.disabled = index === 0
    next.disabled = index === cards.length - 1
  }
  function go(step) {
    const card = cards[index + step]
    if (card) track.scrollTo({ left:track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left, behavior:motion.matches ? 'smooth' : 'auto' })
  }
  prev.addEventListener('click',()=>go(-1))
  next.addEventListener('click',()=>go(1))
  track.addEventListener('scroll',update,{ passive:true })
  byId('carousel-controls').hidden = false
  update()
}

function renderHome(data) {
  for (const key of ['topic','intro','services','skills']) byId(key).textContent = key === 'skills' ? data.skillText : data[key]
  const hero = byId('hero-photo')
  if (data.hero) { hero.src = data.hero; hero.alt = data.heroAlt }
  else hero.hidden = true
  const avatar = byId('avatar')
  if (data.avatar) { avatar.src = data.avatar; avatar.alt = data.name + '的头像'; avatar.hidden = false }
  const sub = byId('subscription')
  if (data.subscriptionUrl) sub.replaceWith(link(data.subscriptionLabel || 'AI 订阅网站',data.subscriptionUrl,'button quiet'))
  for (const id of ['open-contact','skill-contact']) byId(id).addEventListener('click',event=>showContact(data.contact,event.currentTarget))
  byId('quick-contact').append(...contactLinks(data.contact))
  byId('videos-title').textContent = data.videoTitle
  byId('sku-link').textContent = data.skuTitle
  byId('assets-link').textContent = data.assetTitle
  byId('tools-title').textContent = data.toolsTitle
  renderVideos(data.videos)
  byId('tools').hidden = data.tools.length === 0
  for (const row of data.tools) {
    const card = element('article','tile tool-card')
    card.append(element('h3','',row.title))
    if (row.description) card.append(element('p','',row.description))
    if (row.file) card.append(download(row,'下载文件 ↓'))
    else card.append(button('联系获取 ↗',src=>showContact(data.contact,src)))
    byId('tool-list').append(card)
  }
  if (motion.matches) document.body.classList.add('motion')
}
function renderGallery(data) {
  const sku = /^\/sku(?:\/|$)/.test(location.pathname)
  const title = sku ? data.skuTitle : data.assetTitle
  const rows = sku ? data.sku : data.assets
  document.title = title + ' · ' + data.name
  byId('gallery-title').textContent = title
  byId('gallery-intro').textContent = sku ? data.skuIntro : data.assetIntro
  if (!rows.length) byId('gallery').append(element('p','section-note','作品待更新。'))
  for (const row of rows) {
    const card = button('',source=>{
      open(row.title,source)
      if (row.image) media.append(image(row.image,row.title))
      if (row.description) details.append(element('p','',row.description))
      if (row.prompt) details.append(element('h3','','提示词'),element('pre','prompt',row.prompt))
      if (row.file) details.append(download(row,'下载资产 ↓'))
      if (row.link) details.append(link('打开作品链接 ↗',row.link))
    },'tile gallery-card')
    card.setAttribute('aria-label','查看 ' + row.title)
    if (row.image) card.append(image(row.image))
    const copy = element('span','gallery-caption')
    copy.append(element('strong','',row.title))
    if (row.code || row.category) copy.append(element('small','',row.code || row.category))
    card.append(copy)
    byId('gallery').append(card)
  }
}
async function getContent(path) {
  const response = await fetch(path,{ cache:'no-store', signal:globalThis.AbortSignal?.timeout?.(5000) })
  if (!response.ok) throw Error('读取失败')
  const data = await response.json()
  if (typeof data?.name !== 'string' || !data?.contact ||
    !['videos','sku','assets','tools'].every(key=>Array.isArray(data[key]))) throw Error('内容格式不正确')
  return data
}
async function init() {
  let data
  try { data = await getContent('/xiaoye-api.php?action=content') }
  catch {
    data = await getContent('/defaults.json')
    document.querySelector('main').append(element('p','shell preview-status','当前显示示例内容。'))
  }
  document.title = data.name + ' · 个人主页'
  for (const node of document.querySelectorAll('[data-brand]')) node.textContent = data.name
  if (byId('video-list')) renderHome(data)
  else renderGallery(data)
}
init().catch(()=>document.querySelector('main').append(element('p','shell preview-status','内容暂时无法加载，请刷新页面。')))
