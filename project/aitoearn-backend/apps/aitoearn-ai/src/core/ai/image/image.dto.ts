import { createZodDto, UserType } from '@yikart/common'
import { z } from 'zod'

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

// Gemini 图片生成请求
const geminiImageGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000).describe('图片描述提示'),
  imageUrls: z.array(z.string()).optional().describe('参考图片 URL 列表'),
  imageSize: z.enum(['1K', '2K', '4K']).optional().describe('图片尺寸'),
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).optional().describe('图片宽高比'),
  model: z.enum(['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview']).optional().describe('Gemini 图片模型'),
})

export class GeminiImageGenerationDto extends createZodDto(geminiImageGenerationSchema) {}

// 用户 Gemini 图片生成请求
const userGeminiImageGenerationSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...geminiImageGenerationSchema.shape,
})

export class UserGeminiImageGenerationDto extends createZodDto(userGeminiImageGenerationSchema) {}

// 二维码艺术图生成请求
const qrCodeArtSchema = z.object({
  content: z.string().min(1).max(2000).describe('二维码扫码后的内容'),
  referenceImageUrl: z.string().url().optional().describe('参考样式图 URL'),
  prompt: z.string().min(1).max(4000).describe('文字描述（提示词）'),
  model: z.string().default('gpt-image-1').describe('图片生成模型'),
  size: z.string().optional().describe('图片尺寸'),
})

export class QrCodeArtDto extends createZodDto(qrCodeArtSchema) {}

// 用户二维码艺术图生成请求
const userQrCodeArtSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...qrCodeArtSchema.shape,
})

export class UserQrCodeArtDto extends createZodDto(userQrCodeArtSchema) {}
