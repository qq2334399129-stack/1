小野个人主页 · 宝塔部署说明

主页顺序
进场先显示个人名片，约 1.6 秒后淡出，可随时跳过。主页顶部展示头像、
自我介绍、服务和联系方式。往下依次是文档作品集、视频、图片和技能工具。
手机和电脑共用一个网址，自动切换布局。开启系统的「减少动态效果」会跳过动画。

替换内容
1. 打开 site-content.js，修改 name、topic 和 intro。把头像文件放到 assets，
   修改 avatar.src，并将 avatar.example 改为 false。清空 src 将使用名字的末字作头像。
2. 在 documents 中添加文档。sections 中可填写站内阅读的正文，每节含 title 和 text。
   可同时填写 file 作为文件链接，也可只填 file，点击卡片会直接打开。
   例如 assets/my-work.pdf，或者公开的 HTTPS 地址。删去 example: true 即可去掉示例标识。
3. works 中可以增删视频与图片。每项填写 cover 和 media 的文件路径。视频建议使用
   H.264 编码的 MP4 文件。把主推视频标为 featured: true。
4. 在 services 和 skillGroups 中修改服务和技能说明。
5. 在 contact.qqUrl 填 QQ 的 HTTPS 分享链接，在 contact.wechatUrl 填微信公开主页链接。
   有微信二维码时，也可上传图片并将路径填入 contact.wechatQr。没有主页和二维码时，
   contact.wechat 可提供可复制的微信号。邮箱和电话按需填写。

在宝塔发布
1. 在宝塔「网站」中添加静态站点并填写域名。
2. 将 xiaoye-portfolio.zip 上传到网站根目录解压。确认 index.html 直接位于根目录，
   同级可见 assets、style.css、site-content.js 和 app.js。
3. 域名解析到服务器后为站点申请 SSL 并开启 HTTPS。
4. 用手机和电脑打开网页，检查作品及真实联系方式。
