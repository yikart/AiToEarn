import { createZodDto, UserType } from '@yikart/common'
import { z } from 'zod'
import { FireflycardTempTypes } from '../libs/fireflycard'

// 图片生成请求
const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000).describe('图片描述提示'),
  model: z.string().describe('图片生成模型'),
  n: z.number().int().min(1).max(10).optional().describe('生成图片数量'),
  quality: z.string().optional().describe('图片质量'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  size: z.string().optional().describe('图片尺寸'),
  style: z.string().optional().describe('图片风格'),
  user: z.string().optional().describe('用户标识符'),
})

export class ImageGenerationDto extends createZodDto(imageGenerationSchema) {}

// 图片编辑请求
const imageEditSchema = z.object({
  model: z.string().describe('图片编辑模型'),
  image: z.string().or(z.string().array()).describe('原始图片'),
  prompt: z.string().min(1).max(4000).describe('编辑描述'),
  mask: z.string().optional().describe('遮罩图片'),
  n: z.int().min(1).max(1).optional().describe('生成图片数量'),
  size: z.string().optional().describe('图片尺寸'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  user: z.string().optional().describe('用户标识符'),
})

export class ImageEditDto extends createZodDto(imageEditSchema) {}

// MD2Card生成请求
const md2CardSchema = z.object({
  markdown: z.string().describe('要转换的 Markdown 文本'),
  theme: z.string().default('apple-notes').optional().describe('卡片主题样式 ID'),
  themeMode: z.string().optional().describe('主题的模式 ID'),
  width: z.int().min(100).max(2000).default(440).optional().describe('卡片宽度（像素）'),
  height: z.int().min(100).max(3000).default(586).optional().describe('卡片高度（像素）'),
  splitMode: z.string().default('noSplit').optional().describe('分割模式'),
  mdxMode: z.boolean().default(false).optional().describe('是否启用 MDX 模式'),
  overHiddenMode: z.boolean().default(false).optional().describe('是否启用溢出隐藏模式'),
})

export class Md2CardDto extends createZodDto(md2CardSchema) {}

// Fireflycard模板类型枚举
const fireflycardTempSchema = z.enum(FireflycardTempTypes)

// Fireflycard样式配置
const fireflycardStyleSchema = z.object({
  align: z.string().optional().describe('对齐方式'),
  backgroundName: z.string().optional().describe('背景名称'),
  backShadow: z.string().optional().describe('背景阴影'),
  font: z.string().optional().describe('字体'),
  width: z.number().optional().describe('宽度'),
  ratio: z.string().optional().describe('比例'),
  height: z.number().optional().describe('高度'),
  fontScale: z.number().optional().describe('字体缩放'),
  padding: z.string().optional().describe('内边距'),
  borderRadius: z.string().optional().describe('边框圆角'),
  color: z.string().optional().describe('颜色'),
  opacity: z.number().optional().describe('透明度'),
  blur: z.number().optional().describe('模糊度'),
  backgroundAngle: z.string().optional().describe('背景角度'),
  lineHeights: z.object({
    content: z.string().optional().describe('内容行高'),
  }).optional().describe('行高设置'),
  letterSpacings: z.object({
    content: z.string().optional().describe('内容字间距'),
  }).optional().describe('字间距设置'),
}).optional()

// Fireflycard开关配置
const fireflycardSwitchConfigSchema = z.object({
  showIcon: z.boolean().optional().describe('显示图标'),
  showDate: z.boolean().optional().describe('显示日期'),
  showTitle: z.boolean().optional().describe('显示标题'),
  showContent: z.boolean().optional().describe('显示内容'),
  showAuthor: z.boolean().optional().describe('显示作者'),
  showTextCount: z.boolean().optional().describe('显示文字计数'),
  showQRCode: z.boolean().optional().describe('显示二维码'),
  showPageNum: z.boolean().optional().describe('显示页码'),
  showWatermark: z.boolean().optional().describe('显示水印'),
}).optional()

// Fireflycard生成请求
const fireflyCardSchema = z.object({
  content: z.string().min(1).describe('卡片内容'),
  temp: fireflycardTempSchema.default(FireflycardTempTypes.A).describe('模板类型'),
  title: z.string().optional().describe('标题'),
  style: fireflycardStyleSchema.describe('样式配置'),
  switchConfig: fireflycardSwitchConfigSchema.describe('开关配置'),
})

export class FireflyCardDto extends createZodDto(fireflyCardSchema) {}

// 用户图片生成请求
const userImageGenerationSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...imageGenerationSchema.shape,
})

export class UserImageGenerationDto extends createZodDto(userImageGenerationSchema) {}

// 用户图片编辑请求
const userImageEditSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...imageEditSchema.shape,
})

export class UserImageEditDto extends createZodDto(userImageEditSchema) {}

// 用户Md2Card
const userMd2CardSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...md2CardSchema.shape,
})
export class UserMd2CardDto extends createZodDto(userMd2CardSchema) {}

// Fireflycard生成请求
const userFireflyCardSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...fireflyCardSchema.shape,
})

export class UserFireflyCardDto extends createZodDto(userFireflyCardSchema) {}

// 图片生成模型查询DTO
const imageGenerationModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class ImageGenerationModelsQueryDto extends createZodDto(imageGenerationModelsQuerySchema) {}

// 图片编辑模型查询DTO
const imageEditModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class ImageEditModelsQueryDto extends createZodDto(imageEditModelsQuerySchema) {}
