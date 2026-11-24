'use strict'

const { name, topic, intro, contact, works, skillGroups, services } = window.PORTFOLIO
const byId = id => document.getElementById(id)
const element = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}
const iconPaths = {
  play: '<path d="m9 6 10 6-10 6z" fill="currentColor" stroke="none"/>',
  expand: '<path d="M8 16 16 8M8 8h8v8"/>',
  spark: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z"/>',
  tool: '<rect x="5" y="9" width="14" height="11" rx="2"/><path d="M9 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M5 14h14m-9 0v2m4-2v2"/>',
  qq: '<path d="M12 3c-2.8 0-4.7 2.1-4.7 5.6 0 1.6-.6 3-1.8 4.6-.8 1.2-.4 2.5 1.1 2.2l.4-.1a7.3 7.3 0 0 0 1.2 2.9c-1 .2-1.6.9-1.6 1.5 0 .9 1.4 1.3 2.6 1.3 1 0 2-.2 2.8-.7.8.5 1.8.7 2.8.7 1.2 0 2.6-.4 2.6-1.3 0-.6-.6-1.3-1.6-1.5a7.3 7.3 0 0 0 1.2-2.9l.4.1c1.5.3 1.9-1 1.1-2.2a7.5 7.5 0 0 1-1.8-4.6C16.7 5.1 14.8 3 12 3Z"/><path d="M10 8.8h.1m3.8 0h.1m-3 3h2"/>',
  wechat: '<path d="M11 17c-1.2.1-2.4 0-3.5-.4L4 18l.8-2.8C3 14 2 12.3 2 10.3 2 6.8 5.4 4 9.5 4c3.7 0 6.8 2.2 7.4 5.1M22 15c0 2.9-2.7 5-5.7 5-1 0-2-.2-2.8-.6l-2.9 1.1.7-2.3a4.6 4.6 0 0 1-1.3-3.3c0-2.8 2.7-5 6-5s6 2.2 6 5.1Z"/><path d="M7 9.5h.1m4.8 0h.1m2.3 4.8h.1m3.6 0h.1"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M8 4H5a1 1 0 0 0-1 1c0 8 7 15 15 15a1 1 0 0 0 1-1v-3l-4-2-2 2c-3-1-5-3-6-6l2-2-2-4Z"/>'
}
function icon(key, className) {
  const node = element('span', className)
  const path = iconPaths[key]
  if (path) node.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>'
  return node
}

document.title = name + ' · 个人主页'
document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = name })
document.querySelector('[data-topic]').textContent = topic
document.querySelector('[data-intro]').textContent = intro

const dialog = byId('project-dialog')
const mediaContainer = byId('project-media')
let opener
function openMedia(work, source) {
  opener = source
  byId('project-title').textContent = work.title
  byId('project-description').textContent = (work.description || '') + (work.example ? ' · 作品示例' : '')
  let video
  if (work.type === 'video') {
    video = element('video')
    video.controls = true
    video.playsInline = true
    video.preload = 'metadata'
    video.poster = work.cover
    video.src = work.media
    video.addEventListener('error', () => {
      const link = element('a', 'button quiet', '打开视频文件')
      link.href = work.media
      mediaContainer.replaceChildren(element('p', '', '当前浏览器无法播放此视频。'), link)
    }, { once: true })
    mediaContainer.replaceChildren(video)
  } else {
    const img = element('img', work.qr ? 'contact-qr' : '')
    img.src = work.media
    img.alt = work.alt
    mediaContainer.replaceChildren(img)
  }
  dialog.showModal()
  document.body.classList.add('dialog-open')
  byId('close-dialog').focus()
  video?.play().catch(() => {})
}
byId('close-dialog').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
dialog.addEventListener('close', () => {
  mediaContainer.querySelector('video')?.pause()
  mediaContainer.replaceChildren()
  document.body.classList.remove('dialog-open')
  opener?.focus()
})

function makeCover(work, featured = false) {
  const video = work.type === 'video'
  const cover = element('button', 'media-cover' + (featured ? ' featured-cover' : ''))
  cover.type = 'button'
  cover.setAttribute('aria-label', (video ? '播放视频 ' : '查看图片 ') + work.title)
  const img = element('img')
  img.src = work.cover
  img.alt = work.alt
  img.loading = 'lazy'
  img.decoding = 'async'
  cover.append(img, icon(video ? 'play' : 'expand', 'media-action'))
  cover.addEventListener('click', () => openMedia(work, cover))
  return cover
}
const metaText = work => work.category + (work.example ? ' · 示例' : '')
function makeCard(work) {
  const card = element('article', 'media-card')
  card.dataset.reveal = ''
  const info = element('div', 'media-meta')
  info.append(element('h3', '', work.title), element('span', '', metaText(work)))
  card.append(makeCover(work), info)
  return card
}
const videos = works.filter(work => work.type === 'video')
const featured = videos.find(work => work.featured) || videos[0]
if (featured) {
  const feature = element('article', 'video-feature')
  feature.dataset.reveal = ''
  const details = element('div', 'feature-details')
  details.append(element('span', 'feature-category', metaText(featured)), element('h3', '', featured.title),
    element('p', '', featured.description))
  feature.append(makeCover(featured, true), details)
  byId('video-list').append(feature)
  byId('video-count').textContent = videos.length + ' 部视频'
  if (videos.length > 1) {
    const more = element('div', 'more-videos')
    more.append(...videos.filter(work => work !== featured).map(makeCard))
    byId('video-list').append(more)
  }
} else byId('video-list').append(element('p', 'section-note', '视频作品将更新在这里。'))
const photos = works.filter(work => work.type === 'image')
byId('photo-list').append(...photos.map(makeCard))
if (photos.length === 0) byId('photos').hidden = true

for (const group of skillGroups) {
  const article = element('article', 'skill-group')
  article.dataset.reveal = ''
  const header = element('div', 'skill-head')
  header.append(icon(group.icon, 'skill-icon'), element('h3', '', group.title))
  const tags = element('ul', 'skill-tags')
  for (const item of group.items) tags.append(element('li', '', item))
  article.append(header, tags)
  byId('toolkit').append(article)
}
for (const service of services) {
  const item = element('article', 'service-item')
  item.append(element('h4', '', service.title), element('p', '', service.description))
  byId('service-list').append(item)
}

function profileUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  } catch { return '' }
}
const links = byId('contact-links')
function addContact(label, key, description, href, action) {
  const node = element(href ? 'a' : action ? 'button' : 'div', 'contact-card')
  if (href) {
    node.href = href
    if (href.startsWith('https://')) { node.target = '_blank'; node.rel = 'noopener noreferrer' }
  } else if (action) {
    node.type = 'button'
    node.addEventListener('click', () => action(node))
  }
  if (!href && !action) { node.classList.add('pending'); node.setAttribute('aria-disabled', 'true') }
  const text = element('span', 'contact-text')
  text.append(element('strong', '', label), element('small', '', description))
  node.append(icon(key, 'contact-icon'), text)
  if (href || action) node.append(icon('expand', 'contact-arrow'))
  links.append(node)
}
const qq = profileUrl(contact.qqUrl)
const wechat = profileUrl(contact.wechatUrl)
addContact('QQ', 'qq', qq ? '打开 QQ 主页或会话' : '主页待添加', qq)
if (wechat) addContact('微信', 'wechat', '打开微信主页', wechat)
else if (contact.wechatQr) addContact('微信', 'wechat', '查看微信二维码', '', source => {
  openMedia({ type: 'image', title: '微信二维码', qr: true, media: contact.wechatQr,
    alt: '用于添加联系人的微信二维码', description: '用微信扫一扫打开。' }, source)
})
else if (contact.wechat) addContact('微信', 'wechat', '复制微信号', '', async source => {
  const note = source.querySelector('small')
  try {
    await navigator.clipboard.writeText(contact.wechat)
    note.textContent = '微信号已复制'
  } catch {
    note.textContent = contact.wechat
  }
  byId('copy-status').textContent = note.textContent
})
else addContact('微信', 'wechat', '主页待添加', '')
if (contact.email) addContact('邮件', 'email', contact.email, 'mailto:' + contact.email)
if (contact.phone) addContact('电话', 'phone', contact.phone, 'tel:' + contact.phone.replace(/[^\d+]/g, ''))

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
let revealObserver
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue
      target.classList.remove('reveal-pending')
      revealObserver.unobserve(target)
    }
  }, { rootMargin: '0px 0px 10px 0px' })
  document.querySelectorAll('[data-reveal]').forEach(target => {
    target.classList.add('reveal-pending')
    revealObserver.observe(target)
  })
}
const progress = document.querySelector('.reading-progress')
const hero = document.querySelector('.hero')
const stage = document.querySelector('.hero-stage')
const nav = [...document.querySelectorAll('nav a[href^="#"]')].map(link => [link, document.querySelector(link.hash)])
let scrollFrame = 0
let previousScene = -1
function updateScroll() {
  scrollFrame = 0
  const height = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  const ratio = Math.max(0, Math.min(1, scrollY / height))
  const travel = Math.max(1, hero.offsetHeight - stage.offsetHeight)
  const scene = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, scrollY / travel))
  let current = nav[0][0]
  for (const [link, section] of nav.slice(1)) {
    if (section.getBoundingClientRect().top <= Math.min(225, innerHeight * .34)) current = link
  }
  if (ratio >= .995) {
    const anchored = nav.find(([link, section]) => {
      const box = section.getBoundingClientRect()
      return link.hash === location.hash && box.top < innerHeight && box.bottom > 0
    })
    current = anchored?.[0] || nav.at(-1)[0]
  }
  progress.style.transform = 'scaleX(' + ratio + ')'
  if (scene !== previousScene) {
    previousScene = scene
    hero.style.setProperty('--scene-inset', (scene * 3) + '%')
    hero.style.setProperty('--scene-round', (scene * 14) + 'px')
    hero.style.setProperty('--scene-zoom', 1.025 + scene * .18)
    hero.style.setProperty('--scene-dark', scene * .36)
    hero.style.setProperty('--scene-shift', (-scene * 27) + 'px')
  }
  for (const [link] of nav) {
    if (link === current) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  }
}
function scheduleScroll() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll)
}
addEventListener('scroll', scheduleScroll, { passive: true })
addEventListener('resize', scheduleScroll)
addEventListener('hashchange', scheduleScroll)
reducedMotion.addEventListener?.('change', event => {
  if (!event.matches) return
  revealObserver?.disconnect()
  document.documentElement.classList.remove('motion', 'opening')
  document.querySelectorAll('.reveal-pending').forEach(node => node.classList.remove('reveal-pending'))
  scheduleScroll()
})
if ('ResizeObserver' in window) new ResizeObserver(scheduleScroll).observe(document.body)
scheduleScroll()
