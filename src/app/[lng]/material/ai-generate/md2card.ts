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
export const defaultMarkdown = `# 默认 markdown

这是一个示例的Markdown内容，您可以在这里输入您想要转换的内容。

## 功能特点

- 支持多种主题样式
- 可自定义尺寸
- 支持分割模式
- 支持MDX模式

## 使用方法

1. 输入您的Markdown内容
2. 选择合适的主题
3. 调整参数设置
4. 点击生成按钮

> 这是一个引用示例

\`\`\`javascript
// 代码示例
console.log('Hello, World!');
\`\`\`
`;

