小野个人主页 · 宝塔部署说明

手机和电脑使用同一个网址，手机采用单列卡片，电脑采用横排视频和双列服务卡。
首屏名片淡入后显示联系方式。「浏览作品」直接前往视频区，点视频卡即可预览。
页底展示 AI 订阅会员、AI 视频定制、AI 图片定制与个人网站定制四项服务。
系统开启「减少动态效果」时会跳过开场和滚动动效。

替换内容
1. 在 site-content.js 修改 name、topic 和 intro。把头像放到 assets，修改 avatar.src。
   换成真实照片后，把 avatar.example 改为 false。清空 src 会显示名字的末字。
2. 在 contact.qqUrl 与 contact.wechatUrl 填各自官方分享链接或可用的 App 跳转链接。
   App 是否直接打开由设备、浏览器和所填链接决定。没有微信链接时也可填写
   contact.wechatQr（二维码图片路径）或 contact.wechat（可复制微信号）。
   contact.email 填公开邮箱地址，它会显示在名片上，访客可以点击写信。
3. 在 services 修改服务名称和说明。
4. 在 works 增删视频。cover 和 media 分别填封面与视频路径。竖版作品可设置
   aspect: 'portrait'，主推作品可设置 featured: true。视频建议用 H.264 MP4。
   封面按页面风格以灰度展示，视频播放保留原色。正式作品可删掉 example: true。

在宝塔发布
1. 将 xiaoye-portfolio.zip 上传到站点根目录并解压覆盖。
2. 确认 index.html、style.css、app.js、site-content.js 和 assets 在同一级目录。
3. 绑定域名和 HTTPS 后，用手机打开网站，检查视频播放和真实联系方式。
