小野个人主页 · 宝塔部署说明

这是一个手机优先的 H5 主页，同一个网址在电脑上也可打开。
开场会短暂展示名片。首页将头像、介绍、联系方式和服务放在同一张名片内。
「浏览作品」会跳到视频作品集，视频封面可点开播放。下方是技能和工具集。
系统开启「减少动态效果」时会跳过开场和滚动动画。

替换内容
1. 修改 site-content.js 里的 name、topic 和 intro。把头像放到 assets，修改 avatar.src，
   并把 avatar.example 改为 false。清空 src 会显示名字的末字。
2. 在 contact.qqUrl 与 contact.wechatUrl 分别填 QQ、微信的 HTTPS 分享链接。
   微信也可填写 contact.wechatQr（二维码图片路径）或 contact.wechat（可复制微信号）。
   邮箱和电话按需填写。
3. 在 services 中修改服务名称，在 skillGroups 中修改技能和工具名称。
4. 在 works 中增删视频，type 保持 video。cover 和 media 分别填写封面和视频路径。
   手机竖版作品可设置 aspect: 'portrait'，主推作品可设置 featured: true。
   视频建议用 H.264 MP4。换成真实作品后删掉 example: true。

在宝塔发布
1. 将 xiaoye-portfolio.zip 上传到站点根目录并解压覆盖。
2. 确认 index.html、style.css、app.js、site-content.js 和 assets 在同一级目录。
3. 绑定域名和 HTTPS 后，用手机打开网站，检查视频播放和真实联系方式。
