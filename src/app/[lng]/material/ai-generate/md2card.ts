// md2card 模板类
export interface Md2CardTemplate {
  id: string;
  nameCn: string;
  nameEn: string;
}

// md2card 模板列表
export const md2CardTemplates: Md2CardTemplate[] = [
  { id: 'apple-notes', nameCn: '苹果备忘录', nameEn: 'Apple Notes' },
  { id: 'coil-notebook', nameCn: '线圈笔记本', nameEn: 'Coil Notebook' },
  { id: 'pop-art', nameCn: '波普艺术', nameEn: 'Pop Art' },
  { id: 'bytedance', nameCn: '字节范', nameEn: 'ByteDance' },
  { id: 'alibaba', nameCn: '阿里橙', nameEn: 'Alibaba' },
  { id: 'art-deco', nameCn: '艺术装饰', nameEn: 'Art deco' },
  { id: 'glassmorphism', nameCn: '玻璃拟态', nameEn: 'Glass Morphism' },
  { id: 'warm', nameCn: '温暖柔和', nameEn: 'Warm & Soft' },
  { id: 'minimal', nameCn: '简约高级灰', nameEn: 'Minimal Gray' },
  { id: 'minimalist', nameCn: '极简黑白', nameEn: 'Minimalist B&W' },
  { id: 'dreamy', nameCn: '梦幻渐变', nameEn: 'Dreamy Gradient' },
  { id: 'nature', nameCn: '清新自然', nameEn: 'Fresh Nature' },
  { id: 'xiaohongshu', nameCn: '紫色小红书', nameEn: 'Purple Social' },
  { id: 'notebook', nameCn: '笔记本', nameEn: 'Notebook' },
  { id: 'darktech', nameCn: '暗黑科技', nameEn: 'Dark Tech' },
  { id: 'typewriter', nameCn: '复古打字机', nameEn: 'Vintage Typewriter' },
  { id: 'watercolor', nameCn: '水彩艺术', nameEn: 'Watercolor Art' },
  { id: 'traditional-chinese', nameCn: '中国传统', nameEn: 'Traditional Chinese' },
  { id: 'fairytale', nameCn: '儿童童话', nameEn: "Children's Fairy Tale" },
  { id: 'business', nameCn: '商务简报', nameEn: 'Business Brief' },
  { id: 'japanese-magazine', nameCn: '日本杂志', nameEn: 'Japanese Magazine' },
  { id: 'cyberpunk', nameCn: '赛博朋克', nameEn: 'Cyberpunk' },
  { id: 'meadow-dawn', nameCn: '青野晨光', nameEn: 'meadow dawn' },
];

// 默认的Markdown内容
export const defaultMarkdown = `# Default Markdown

This is a sample Markdown content. You can type the content you want to convert here.

## Features

- Supports multiple theme styles
- Customizable size
- Split mode supported
- MDX mode supported

## How to Use

1. Enter your Markdown content
2. Choose a suitable theme
3. Adjust parameter settings
4. Click the generate button
`;

