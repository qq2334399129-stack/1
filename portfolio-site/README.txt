个人主页 · 宝塔静态站部署说明

页面顺序
首页与个人介绍 → 视频放映室 → 图片随记 → 技能与工具 → 服务与联系。
手机和电脑共用同一个网址。电脑显示宽幅山景和并排版式，手机显示竖幅山景和单列版式。首页有短开场，向下滚动时画面会缓慢收边。系统开启「减少动态效果」时会跳过开场和随滚动变化的动画。

编辑正式内容
1. 打开 site-content.js，改 name、topic 和 intro。
2. 通过 works 增删视频和图片。替换成自己的素材时，可删除 example: true。给要主推的视频设置 featured: true。媒体和封面文件放在 assets 文件夹，再填写路径。
3. 通过 skillGroups 和 services 改技能、软件和服务说明。站名、图片、视频、技能和服务目前均为展示示例。
4. 在 contact.qqUrl 填自己从 QQ 分享出的 HTTPS 主页或联系链接；在 contact.wechatUrl 填自己从微信分享出的 HTTPS 主页链接。访客点击后会直接打开所填链接。
5. 如果无法分享微信个人主页，可以上传自己的二维码，填写 contact.wechatQr，例如 assets/wechat-qr.png。也可以通过 contact.wechat 提供可复制的微信号。邮箱和电话按需填写。
6. 如要换首页视觉封面，用自己的图片替换 assets/ridge.webp，同时更新 index.html 中对应图片的 alt 文本和示例标注。

视频可用 MP4，建议采用 H.264 视频和 AAC 音频。首页只请求封面，打开作品后才加载视频。随包短片用于演示播放。

在宝塔发布
1. 登录宝塔，在「网站」中添加静态站点并填写域名。
2. 在「文件」中将 xiaoye-portfolio.zip 上传到网站根目录并解压。解压后 index.html 应直接位于根目录，旁边有 assets、style.css、site-content.js 和 app.js。
3. 域名解析成功后为站点申请 SSL，启用 HTTPS。
4. 用手机和电脑打开网站，检查视频和 QQ、微信链接。
