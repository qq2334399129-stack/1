'use strict'
const byId = id => document.getElementById(id)
const sections = {
  home:{ title:'首页介绍', fields:[
    ['name','站名'],['topic','个人定位'],['intro','个人介绍','area'],['services','开头的服务介绍','area'],
    ['avatar','个人头像','image'],['hero','山景封面','image'],['heroAlt','封面无障碍说明'],['skillText','Skill 与教学说明','area'],
    ['subscriptionLabel','AI 订阅入口文字'],['subscriptionUrl','AI 订阅网站跳转链接','url'],
    ['videoTitle','视频区标题'],['skuTitle','SKU 副页标题'],['skuIntro','SKU 副页介绍','area'],
    ['assetTitle','人物与建筑资产副页标题'],['assetIntro','资产副页介绍','area'],['toolsTitle','工具分享标题']
  ] },
  contact:{ title:'联系方式与链接', help:'QQ 和微信可同时设置直达链接与二维码。邮箱会直接显示在首页。', fields:[
    ['wechatUrl','微信官方分享链接或 App 跳转链接','url'],['wechatQr','微信二维码','image'],
    ['qqUrl','QQ 官方分享链接或 App 跳转链接','url'],['qqQr','QQ 二维码','image'],['email','公开邮箱地址','email']
  ] },
  videos:{ title:'视频管理', item:'视频', fields:[
    ['title','标题'],['category','分类'],['description','简介','area'],['cover','视频封面','image'],['video','视频文件','video']
  ] },
  sku:{ title:'SKU 作品', item:'SKU', fields:[
    ['title','作品标题'],['code','SKU 编号'],['description','作品介绍','area'],['image','作品图片','image'],['link','外部作品链接','url']
  ] },
  assets:{ title:'人物与建筑资产', item:'资产', fields:[
    ['title','标题'],['category','分类（人物、建筑、其他）'],['description','制作介绍','area'],['image','效果示例图','image'],
    ['prompt','完整提示词','area'],['file','资产模型附件（公开下载）','file']
  ] },
  tools:{ title:'AI 工具分享', item:'工具', fields:[
    ['title','工具或文件标题'],['description','介绍、用途与使用方法','area'],
    ['file','分享文件','file'],['access','获取方式','access']
  ] }
}
const accept = { image:'image/jpeg,image/png,image/webp,image/gif', video:'video/mp4,video/webm', file:'' }
const size = { image:16,video:512,file:256 }
let csrf = ''
let version
let content
let active = 'home'
let dirty = false
let pending = 0
let publishing = false

function element(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}
function button(label, action) {
  const node = element('button','',label)
  node.type = 'button'
  node.addEventListener('click',action)
  return node
}
function status(message) { byId('status').textContent = message }
function changed() {
  dirty = true
  status('有未发布的修改。')
  updateControls()
}
function updateControls() {
  byId('save').disabled = !dirty || pending > 0 || publishing
  byId('logout').disabled = pending > 0 || publishing
}
async function request(path, method = 'GET', data) {
  const headers = {}
  if (method !== 'GET') headers['X-CSRF-Token'] = csrf
  if (data) headers['Content-Type'] = 'application/json'
  if (path === '/api/login') headers['X-Admin-Request'] = '1'
  const response = await fetch(path,{ method, headers, body:data ? JSON.stringify(data) : undefined })
  const result = await response.json().catch(()=>({}))
  if (!response.ok) {
    const error = Error(result.error || '请求失败（HTTP ' + response.status + '）。')
    error.status = response.status
    throw error
  }
  return result
}
function upload(file, kind, progress) {
  return new Promise((resolve,reject)=>{
    const xhr = new XMLHttpRequest()
    xhr.open('PUT','/api/upload?kind=' + kind)
    xhr.setRequestHeader('X-CSRF-Token',csrf)
    xhr.upload.addEventListener('progress',event=>{
      if (event.lengthComputable) progress(Math.min(99,Math.round(event.loaded/event.total*100)) + '%')
    })
    xhr.addEventListener('load',()=>{
      let response = {}
      try { response = JSON.parse(xhr.responseText) } catch {}
      if (xhr.status === 201 && response.url) resolve(response.url)
      else reject(Error(response.error || (xhr.status === 413 ? '服务器拒绝了文件大小。请检查反向代理上传限制。' : '上传失败。')))
    })
    xhr.addEventListener('error',()=>reject(Error('网络中断，请重新上传。')))
    xhr.send(file)
  })
}

function fileField(record, key, label, kind) {
  const box = element('div','file-field')
  const wrap = element('label','',label)
  const input = element('input')
  input.type = 'file'
  if (accept[kind]) input.accept = accept[kind]
  const progress = element('p','hint')
  const fileStatus = element('div','file-status')
  function refresh() {
    fileStatus.replaceChildren()
    if (!record[key]) { fileStatus.append(element('span','hint','尚未上传')); return }
    if (kind === 'image') {
      const image = element('img')
      image.src = record[key]
      image.alt = label + '预览'
      fileStatus.append(image)
    }
    const preview = element('a','',label + ' ↗')
    preview.href = kind === 'file' ? record[key] + '?name=' + encodeURIComponent(record.fileName || 'download') : record[key]
    preview.target = '_blank'
    preview.rel = 'noopener'
    const remove = button('移除',()=>{
      if (pending || publishing) return
      record[key] = ''
      if (kind === 'file') record.fileName = ''
      refresh()
      changed()
    })
    fileStatus.append(preview,remove)
  }
  input.addEventListener('change',async ()=>{
    const file = input.files[0]
    if (!file) return
    if (publishing || file.size > size[kind] * 1024 * 1024 || !file.size) {
      progress.textContent = '文件为空、发布中或超出 ' + size[kind] + ' MB。'
      input.value = ''
      return
    }
    pending++
    updateControls()
    input.disabled = true
    progress.textContent = '正在上传…'
    try {
      record[key] = await upload(file,kind,value=>{ progress.textContent = '上传中 ' + value })
      if (kind === 'file') record.fileName = [...file.name].slice(0,80).join('')
      progress.textContent = '上传完成，保存后生效。'
      refresh()
      changed()
    } catch (error) { progress.textContent = error.message }
    finally { pending--; input.disabled = false; input.value = ''; updateControls() }
  })
  wrap.append(input)
  box.append(wrap,progress,fileStatus)
  refresh()
  return box
}
function field(record, [key,label,kind], onTitle) {
  if (Object.hasOwn(size,kind)) return fileField(record,key,label,kind)
  const wrap = element('label','',label)
  const input = element(kind === 'area' ? 'textarea' : kind === 'access' ? 'select' : 'input')
  if (kind === 'access') {
    for (const [value,name] of [['contact','仅展示介绍，联系获取'],['public','允许公开下载']]) {
      const option = element('option','',name)
      option.value = value
      input.append(option)
    }
  } else if (kind === 'area') {
    input.rows = 3
    input.maxLength = 2500
  } else {
    input.type = kind === 'email' ? 'email' : 'text'
    if (kind === 'url') input.inputMode = 'url'
    input.maxLength = kind === 'email' ? 254 : kind === 'url' ? 2048 : 160
  }
  input.value = record[key] || (kind === 'access' ? 'contact' : '')
  input.addEventListener('input',()=>{
    record[key] = input.value
    if (key === 'title') onTitle?.(input.value)
    changed()
  })
  wrap.append(input)
  return wrap
}
function reorder(list,index,step) {
  if (pending || publishing) return
  const target = index + step
  if (target < 0 || target >= list.length) return
  ;[list[index],list[target]] = [list[target],list[index]]
  changed()
  renderEditor(target)
}
function renderEditor(selected = -1) {
  const container = byId('editor')
  const config = sections[active]
  container.replaceChildren(element('h2','',config.title))
  const help = active === 'home' ? 'AI 订阅跳转地址填写在本页「AI 订阅网站跳转链接」。' : config.help
  if (help) container.append(element('p','hint',help))
  if (!config.item) {
    const group = element('div','surface fields')
    const record = active === 'home' ? content : content.contact
    group.append(...config.fields.map(def=>field(record,def)))
    container.append(group)
    return
  }
  const list = content[active]
  container.append(button('添加' + config.item,()=>{
    if (pending || publishing || list.length >= 80) return
    list.push({})
    changed()
    renderEditor(list.length - 1)
  }))
  if (!list.length) container.append(element('p','hint','尚未添加。'))
  list.forEach((record,index)=>{
    const item = element('details','surface')
    item.open = index === selected
    const summary = element('summary','',record.title || '未命名' + config.item)
    const group = element('div','fields')
    group.append(...config.fields.map(def=>field(record,def,name=>{ summary.textContent = name || '未命名' + config.item })))
    const actions = element('div','item-actions')
    const up = button('上移',()=>reorder(list,index,-1))
    const down = button('下移',()=>reorder(list,index,1))
    up.disabled = index === 0
    down.disabled = index === list.length - 1
    actions.append(up,down,button('删除条目',()=>{
      if (pending || publishing || !confirm('删除此项？保存后将从前台移除。')) return
      list.splice(index,1)
      changed()
      renderEditor()
    }))
    item.append(summary,group,actions)
    container.append(item)
  })
}
function renderNavigation() {
  const nav = byId('sections')
  nav.replaceChildren()
  for (const [key, config] of Object.entries(sections)) {
    const node = button(config.title,()=>{
      if (pending || publishing) return
      active = key
      renderNavigation()
      renderEditor()
    })
    if (active === key) node.setAttribute('aria-current','page')
    nav.append(node)
  }
}
async function start() {
  const data = await request('/api/admin')
  csrf = data.csrf
  version = data.version
  content = data.content
  byId('connection-status').hidden = true
  byId('login').hidden = true
  byId('dashboard').hidden = false
  byId('logout').hidden = false
  renderNavigation()
  renderEditor()
  updateControls()
}
byId('login').addEventListener('submit',async event=>{
  event.preventDefault()
  const form = event.currentTarget
  const submit = form.querySelector('button')
  submit.disabled = true
  byId('login-status').textContent = ''
  try {
    await request('/api/login','POST',Object.fromEntries(new FormData(form)))
    form.elements.password.value = ''
    await start()
  } catch (error) { byId('login-status').textContent = error.message }
  finally { submit.disabled = false }
})
byId('save').addEventListener('click',async ()=>{
  publishing = true
  updateControls()
  const editor = byId('editor')
  editor.inert = true
  status('正在发布…')
  try {
    const result = await request('/api/admin','PUT',{ version,content })
    version = result.version
    dirty = false
    status('已发布，刷新网站即可查看。')
  } catch (error) { status(error.message) }
  finally { publishing = false; editor.inert = false; updateControls() }
})
byId('logout').addEventListener('click',async ()=>{
  if (dirty && !confirm('有未发布的修改，确定退出？')) return
  try { await request('/api/logout','POST'); dirty = false; location.reload() }
  catch (error) { status(error.message) }
})
addEventListener('beforeunload',event=>{
  if (!dirty && !pending) return
  event.preventDefault()
  event.returnValue = true
})
async function connect() {
  try {
    const response = await fetch('/api/health',{ cache:'no-store', signal:globalThis.AbortSignal?.timeout?.(5000) })
    if (!response.ok) throw Error('未接通 Node 后台（HTTP ' + response.status + '）。')
    const health = await response.json().catch(()=>null)
    if (health?.service !== 'xiaoye-portfolio') throw Error('这个域名指向了其他服务，未接通作品集后台。')
    try { await start() }
    catch (error) {
      if (error.status !== 401) throw error
      byId('connection-status').hidden = true
      byId('login').hidden = false
    }
  } catch (error) {
    byId('connection-message').textContent = error.name === 'TimeoutError' || error instanceof TypeError ? '无法连接 Node 后台，请检查站点代理。' : error.message
    byId('connection-help').hidden = false
  }
}
connect()
