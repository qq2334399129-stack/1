# STILLFRAME · 留帧工作室

基于 Astro、TypeScript、Tailwind CSS 和 Markdown 的静态个人品牌站。站内项目均为演示概念样稿。个人资料、品牌、邮箱与域名使用可替换的初始配置。

## 本地运行

建议使用 Node.js 22.22.0（见 `.nvmrc`，最低 22.12.0）。

```bash
npm install
cp .env.example .env
npm run dev
```

默认地址为 http://localhost:4321/ 。Windows PowerShell 可用 `Copy-Item .env.example .env`。使用锁文件的干净安装可执行 `npm ci`。

```bash
npm run check
npm run build
npm run test:links
npm run preview
```

`dist/` 是构建产物。链接检查在构建后运行，覆盖本地资源、内部页面和页内锚点。

## 更新内容

- 个人资料、品牌、简介、邮件地址和社交链接在 `src/data/site.ts`。在 `socials` 中填入真实的 `{ label, url }`。首页标题和专题文案位于 `src/pages/index.astro`。
- 在 `src/data/projects.ts` 添加项目对象和唯一英文 `slug`。分类使用 `categories` 中的值。`featured: true` 会让项目进入首页精选。首页主图默认取列表首项。
- 标题、描述、客户类型和服务流程在 `src/data/services.ts`。服务页会自动显示详情和咨询入口。
- 在 `src/content/journal/` 新建英文文件名的 Markdown，沿用现有文章的 `title`、`description`、`category`、`tags`、`date`、`cover`、`alt`。正文从二级标题开始。文件名决定 URL，站点自动更新日志列表、相关推荐与 RSS。
- 把 WebP 封面放进 `public/images/`，填写 `cover` 路径和对应 `alt`。样稿附有 480w 版本。替换同名样稿时需同步更新两个尺寸，或给新文件使用不同的路径。
- 测试视频可以放在 `public/videos/`，在作品中配置 `video: '/videos/文件名.mp4'`。正式视频建议使用 H.264/AAC MP4 和 faststart，上传 R2 后填写相对路径。移除 `video` 会隐藏播放入口。演示视频自带合成环境音且无对白。
- 相对媒体路径（如 `images/cover.webp`）使用 `PUBLIC_MEDIA_BASE_URL`。以 `/` 开头的路径始终走站内资源。完整的 HTTPS 地址直接使用。

```text
public/            静态图像、演示视频、图标和缓存配置
src/components/    卡片、视频、筛选、合作入口
src/layouts/       导航、页尾、全站 SEO 和过渡
src/pages/         页面与静态 XML/TXT 端点
src/content/       Markdown 日志
src/data/          个人、作品与服务配置
src/styles/        Tailwind 和响应式视觉系统
src/utils/         媒体与日志工具
scripts/           静态产物链接检查
```

## GitHub 与 Cloudflare Pages

1. 从源码目录初始化 Git，提交源码、锁文件和 `.env.example`。在 GitHub 创建空仓库，添加远程地址并推送。大型视频、实际环境文件、依赖和构建产物由 `.gitignore` 排除。
2. 确认要上线后，在 Cloudflare 控制台打开 Workers & Pages，选择 Pages 并连接 GitHub 仓库，选择生产分支。框架选 Astro，构建命令填 `npm run build`，输出目录填 `dist`。若仓库根目录就是本项目，根目录留空。
3. 在构建环境设置 `NODE_VERSION=22.22.0` 与 `SITE_URL=https://你的正式域名`。设置 `PUBLIC_MEDIA_BASE_URL` 后重新构建。生产分支的提交可触发自动部署，其他分支可配置为预览部署。
4. 在 Pages 项目的自定义域中添加域名并按提示校验。根域需要接入同一 Cloudflare 账号下的 DNS 区域。子域可按面板提示配置指向 Pages 项目的 CNAME。等待证书和 DNS 生效后检查 canonical、robots、sitemap 和 RSS。发布前替换示例邮箱、资料和作品。

## Cloudflare R2 媒体接入

1. 上线准备完成后，在自有账号创建 R2 bucket，使用单独的正式媒体子域，例如 `media.example.com`。在 bucket 设置中绑定该自定义域。
2. 按 `images/<slug>-v1.webp` 和 `videos/<slug>-v1.mp4` 上传公开交付文件，分别确认响应类型 `image/webp` 与 `video/mp4`。上传管理凭据留在管理端，前端环境变量只放公开媒体域。
3. 将 `PUBLIC_MEDIA_BASE_URL` 设为 `https://media.example.com`，项目配置使用与对象键对应的相对路径。启用此变量后也需上传相对路径引用的示例素材，或把保留在站内的文件路径改为以 `/` 开头。示例封面的 480w 衍生文件需要一起迁移。
4. 通过正式媒体域检查文件、MP4 Range 请求及浏览器播放。使用带版本的对象键后可设置长期缓存。覆盖同名对象时使用短缓存或清理对应 URL 缓存。Pages 的 `public/_headers` 只管理站内资源，R2 资源在其媒体域单独配置缓存。
