// 编辑这个文件即可替换主页内容。上传的图片、封面和视频建议放在 assets 目录。
window.PORTFOLIO = {
  name: '小野',
  topic: '影像、设计与 AI 实验',
  intro: '在这里分享我的影像作品，也接剪辑、设计和 AI 影像创作。',
  avatar: { src: 'assets/avatar.webp', example: true },
  contact: {
    qqUrl: '',        // 自己从 QQ 分享出的官方主页或联系链接，以 https:// 开头
    wechatUrl: '',    // 自己从微信分享出的公开主页链接，以 https:// 开头
    wechatQr: '',     // 没有微信主页链接时可填 assets/wechat-qr.png
    wechat: '',       // 可选，公开微信号。有主页链接时优先跳主页
    email: '',
    phone: ''
  },
  works: [
    {
      type: 'video',
      featured: true,
      title: '赤色通道',
      category: '影像实验',
      example: true,
      cover: 'assets/red.webp',
      media: 'assets/red-study.mp4',
      alt: '红光照亮混凝土长廊，远处站着一个人物剪影',
      description: '一段关于颜色和空间的练习。只留一束红光，让人物的剪影成为镜头的中心。'
    }
  ],
  skillGroups: [
    { title: '创作方向', icon: 'spark', items: ['视频剪辑', '视觉设计', 'AI 影像'] },
    { title: '工具箱 · 示例', icon: 'tool', items: ['剪映', 'DaVinci Resolve', 'Photoshop', '即梦 AI', '豆包 Seedance'] }
  ],
  services: [
    { title: '视频剪辑与包装' },
    { title: '视觉设计' },
    { title: 'AI 影像创作' }
  ]
}
