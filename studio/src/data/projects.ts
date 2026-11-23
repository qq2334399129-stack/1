export const categories = ['AI 商业广告', 'AI 漫剧', 'AI 电影短片', '产品宣传', '视觉设计'] as const;
type Category = typeof categories[number];
type Project = {
  title: string; slug: string; category: Category; cover: string; alt: string;
  video?: string; description: string; year: number; featured: boolean;
  tags: string[]; concept: string; process: string[]; tools: string[];
};
export const projects: Project[] = [
  { title: '寂静之门', slug: 'silent-monument', category: 'AI 电影短片', cover: 'images/portal.webp', alt: '海面上雾气环绕的混凝土巨构',
    video: '/videos/demo.mp4', description: '以雾、海面与混凝土为元素的电影感场景练习。', year: 2026, featured: true, tags: ['环境叙事', '气氛'],
    concept: '把主体放在画面中心，利用雾气削弱远景，让微小的人物给建筑提供尺度。',
    process: ['构建场景与尺度参考', '探索光线和空间关系', '用镜头推移制作播放演示'], tools: ['生成式图像', 'FFmpeg'] },
  { title: '余温', slug: 'afterglow', category: 'AI 商业广告', cover: 'images/object.webp', alt: '一束暖光照亮岩石上的深色瓶身',
    description: '一张围绕材质与光线展开的概念广告画面。', year: 2026, featured: true, tags: ['静物', '质感'],
    concept: '让一道暖光勾勒瓶身轮廓，以岩石纹理衬托表面的细腻质地。',
    process: ['确定静物构图', '尝试不同入射光角度', '统一材质与色调'], tools: ['生成式图像'] },
  { title: '雨夜来信', slug: 'letters-in-rain', category: 'AI 漫剧', cover: 'images/city.webp', alt: '雨夜街头站着一道人影，远处窗口亮着暖灯',
    description: '以一扇亮着的窗建立叙事悬念的漫剧分镜样稿。', year: 2026, featured: true, tags: ['分镜', '叙事'],
    concept: '把远处的窗口安排成视线落点，用剪影保留人物身份带来的悬念。',
    process: ['提炼场景的叙事信息', '测试剪影和明暗对比', '确定漫画网点和雨线'], tools: ['生成式图像'] },
  { title: '悬浮体', slug: 'suspended-form', category: '视觉设计', cover: 'images/sphere.webp', alt: '雾气中一颗半透明球体悬浮在水面上',
    description: '探索透明度、空间层次与自然倒影的视觉习作。', year: 2026, featured: false, tags: ['材质', '空间'],
    concept: '通过球体的反射与倒影，把画面分成空气、物体和水面三层。',
    process: ['确定空间与主体关系', '尝试透明材质', '调整倒影与色调'], tools: ['生成式图像'] },
  { title: '物的轮廓', slug: 'object-study', category: '产品宣传', cover: 'images/product.webp', alt: '瓶身与岩石接触面的近景',
    description: '从静物画面中提取局部，研究产品轮廓的特写构图。', year: 2026, featured: false, tags: ['产品', '特写'],
    concept: '缩小取景范围，把识别重点放在瓶身转折与光泽上。',
    process: ['选择产品识别点', '比较近景构图', '制作横版预览'], tools: ['生成式图像', '图像裁切'] },
];
