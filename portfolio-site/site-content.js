// 编辑这个文件即可替换主页内容。上传的图片、封面和视频建议放在 assets 目录。
window.PORTFOLIO = {
  name: '小野',
  topic: '影像、设计与 AI 实验',
  intro: '在这里分享我的影像作品，也提供 AI 内容与个人网站定制。',
  avatar: { src: 'assets/avatar.webp', example: true },
  contact: {
    qqUrl: '',        // 填写 QQ 官方 HTTPS 分享链接或有效的 QQ App 跳转链接
    wechatUrl: '',    // 填写微信官方 HTTPS 分享链接或有效的微信 App 跳转链接
    wechatQr: '',     // 没有微信主页链接时可填 assets/wechat-qr.png
    wechat: '',       // 可选，公开微信号。有主页链接时优先跳主页
    email: ''       // 填公开邮箱，页面会直接显示地址
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
  services: [
    { title: 'AI 订阅会员', description: '按使用需求选择合适的 AI 会员方案。' },
    { title: 'AI 视频定制', description: '根据脚本、风格与使用场景制作视频。' },
    { title: 'AI 图片定制', description: '按主题与尺寸制作封面、海报或视觉素材。' },
    { title: '个人网站定制', description: '设计适合手机和电脑的个人主页与作品集。' }
  ]
}
