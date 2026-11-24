// 编辑这个文件即可替换主页内容。上传的图片、封面和视频建议放在 assets 目录。
window.PORTFOLIO = {
  name: '小野',
  topic: '影像、设计与 AI 实验',
  intro: '这里放我的视频、图片和最近在学的工具。喜欢把一个念头，慢慢试成一段看得见的画面。',
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
    },
    {
      type: 'image',
      title: '琥珀质地',
      category: '静物',
      example: true,
      cover: 'assets/amber.webp',
      media: 'assets/amber.webp',
      alt: '放在粗粝深色石面上的琥珀色玻璃瓶',
      description: '试着把玻璃、暖色折射和粗糙岩面放在同一张图里。'
    },
    {
      type: 'image',
      title: '雾中结构',
      category: '空间',
      example: true,
      cover: 'assets/moss.webp',
      media: 'assets/moss.webp',
      alt: '薄雾中的深绿色石质建筑和长阶梯',
      description: '用建筑线条、薄雾和散射光表现安静的空间。'
    }
  ],
  skillGroups: [
    { title: '创作方向', icon: 'spark', items: ['视频剪辑', '视觉设计', 'AI 影像'] },
    { title: '工具箱 · 示例', icon: 'tool', items: ['剪映', 'DaVinci Resolve', 'Photoshop', '即梦 AI', '豆包 Seedance'] }
  ],
  services: [
    { title: '视频剪辑与包装', description: '短片剪辑、字幕、配乐和节奏整理。' },
    { title: '视觉设计', description: '封面、海报和社交媒体视觉。' },
    { title: 'AI 影像创作', description: '概念图、分镜和短片的前期试做。' }
  ]
}
