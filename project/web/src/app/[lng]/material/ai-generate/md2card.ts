// md2card 模板类
export interface Md2CardTemplate {
  id: string
  nameCn: string
  nameEn: string
  preview: string
}

// md2card 模板列表
export const md2CardTemplates: Md2CardTemplate[] = [
  { id: 'apple-notes', nameCn: '苹果备忘录', nameEn: 'Apple Notes', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejygkwd-1755693300269_i3zsr.png' },
  { id: 'coil-notebook', nameCn: '线圈笔记本', nameEn: 'Coil Notebook', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyhp2j-1755693351620_z3qf1a.png' },
  { id: 'pop-art', nameCn: '波普艺术', nameEn: 'Pop Art', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyie9e-1755693384983_ycwt3.png' },
  { id: 'bytedance', nameCn: '字节范', nameEn: 'ByteDance', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyirt6-1755693402547_mf8mrr.png' },
  { id: 'alibaba', nameCn: '阿里橙', nameEn: 'Alibaba', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyj4ss-1755693419439_ymw3gj.png' },
  { id: 'art-deco', nameCn: '艺术装饰', nameEn: 'Art deco', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyjvys-1755693454633_f8pkvz.png' },
  { id: 'glassmorphism', nameCn: '玻璃拟态', nameEn: 'Glass Morphism', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejykeci-1755693478356_hc6yi4.png' },
  { id: 'warm', nameCn: '温暖柔和', nameEn: 'Warm & Soft', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejylfam-1755693526276_5oqzbu.png' },
  { id: 'minimal', nameCn: '简约高级灰', nameEn: 'Minimal Gray', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejym8cz-1755693564011_018x24.png' },
  { id: 'minimalist', nameCn: '极简黑白', nameEn: 'Minimalist B&W', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejymyb5-1755693597658_isxsr.png' },
  { id: 'dreamy', nameCn: '梦幻渐变', nameEn: 'Dreamy Gradient', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejynszl-1755693637391_bh0v2e.png' },
  { id: 'nature', nameCn: '清新自然', nameEn: 'Fresh Nature', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyo6pj-1755693655181_y8gfye.png' },
  { id: 'xiaohongshu', nameCn: '紫色小红书', nameEn: 'Purple Social', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyoksz-1755693673436_ma06wb.png' },
  { id: 'notebook', nameCn: '笔记本', nameEn: 'Notebook', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyp6nx-1755693701774_q9cet.png' },
  { id: 'darktech', nameCn: '暗黑科技', nameEn: 'Dark Tech', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejypk3o-1755693719227_0drm29.png' },
  { id: 'typewriter', nameCn: '复古打字机', nameEn: 'Vintage Typewriter', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejypwo3-1755693735431_19p6s4.png' },
  { id: 'watercolor', nameCn: '水彩艺术', nameEn: 'Watercolor Art', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyqc5i-1755693755298_2kncmc.png' },
  { id: 'traditional-chinese', nameCn: '中国传统', nameEn: 'Traditional Chinese', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyqsuc-1755693777223_oa1j2.png' },
  { id: 'fairytale', nameCn: '儿童童话', nameEn: 'Children\'s Fairy Tale', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyrimw-1755693810619_gm7tdq.png' },
  { id: 'business', nameCn: '商务简报', nameEn: 'Business Brief', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyrzsx-1755693832927_ig6pam.png' },
  { id: 'japanese-magazine', nameCn: '日本杂志', nameEn: 'Japanese Magazine', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyslq2-1755693861264_767tr.png' },
  { id: 'cyberpunk', nameCn: '赛博朋克', nameEn: 'Cyberpunk', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyt0xp-1755693880945_yj6yts.png' },
  { id: 'meadow-dawn', nameCn: '青野晨光', nameEn: 'meadow dawn', preview: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/md2card/mejyte9q-1755693897993_t99xm.png' },
]

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
`
