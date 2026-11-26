// 编辑这个文件即可替换主页内容。上传的图片、封面和视频建议放在 assets 目录。
window.PORTFOLIO = {
  name: '小野',
  topic: '影像、设计与 AI 实验',
  intro: '这里放我的影像作品和创作笔记。喜欢把一个念头，慢慢试成一段看得见的画面。',
  avatar: { src: 'assets/avatar.webp', example: true },
  documents: [
    {
      title: '赤色通道 · 创作手记',
      category: '项目复盘',
      description: '从一束红光和一个人物剪影出发，记录短片的构思、构图与剪辑。',
      example: true,
      sections: [
        { title: '构思', text: '把人物放到长廊远处，用重复的门框引导视线，让红光成为画面的方向。整段只保留一个明显的动作，留出时间让观众先感受到空间。' },
        { title: '构图与节奏', text: '开场压暗两侧墙体，在画面中央留出最亮的区域。镜头尽量慢，等近景细节看清后再切到人物剪影，结尾比动作多留半秒。' },
        { title: '剪辑复盘', text: '把两版分别静音看一遍，检查画面本身能不能讲清注意力的变化。保留更简洁的一版，再将音乐的重拍对齐最后一次切换。' }
      ]
    },
    {
      title: '短片制作流程',
      category: '工作笔记',
      description: '从确定创作目标、整理镜头，到检查成片的简明清单。',
      example: true,
      sections: [
        { title: '开拍前', text: '用一句话写下希望观众看完记住的东西。确认用途、时长、横竖版，再给每个镜头分配拍摄地点与素材来源。' },
        { title: '初剪', text: '先理顺故事和镜头之间的关系，再处理字幕、音乐和调色。为需要的竖版单独检查人物站位和字幕安全区。' },
        { title: '交付', text: '分别用手机和电脑复看，检查首尾空帧、字幕错字、音量和画面裁切。给成片、封面与源文件按版本命名。' }
      ]
    }
  ],
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
    { title: '视频剪辑与包装', icon: 'play', description: '短片剪辑、字幕、配乐和节奏整理。' },
    { title: '视觉设计', icon: 'document', description: '封面、海报和社交媒体视觉。' },
    { title: 'AI 影像创作', icon: 'spark', description: '概念图、分镜和短片的前期试做。' }
  ]
}
