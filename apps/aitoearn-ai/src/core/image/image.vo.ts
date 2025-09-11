import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 使用情况统计
const usageMetadataSchema = z.object({
  input_tokens: z.number().optional().describe('输入token数'),
  output_tokens: z.number().optional().describe('输出token数'),
  total_tokens: z.number().optional().describe('总token数'),
})

// 图片对象
const imageObjectSchema = z.object({
  url: z.string().optional().describe('图片URL'),
  b64_json: z.string().optional().describe('base64编码的图片'),
  revised_prompt: z.string().optional().describe('修订后的提示词'),
})

// 用户图片响应
const userImageResponseSchema = z.object({
  created: z.number().describe('创建时间戳'),
  list: z.array(imageObjectSchema).describe('生成的图片列表'),
  usage: usageMetadataSchema.optional().describe('token使用情况'),
})

export class ImageResponseVo extends createZodDto(userImageResponseSchema) {}

// 图片生成模型参数 VO
const imageGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  qualities: z.array(z.string()).describe('支持的质量选项'),
  styles: z.array(z.string()).describe('支持的风格选项'),
  pricing: z.string(),
})

export class ImageGenerationModelParamsVo extends createZodDto(imageGenerationModelSchema) {}

// 图片编辑模型参数 VO
const imageEditModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  pricing: z.string(),
})

export class ImageEditModelParamsVo extends createZodDto(imageEditModelSchema) {}

// MD2Card生成响应
const md2CardResponseSchema = z.object({
  images: z.array(z.object({
    url: z.string().describe('图片URL'),
    fileName: z.string().describe('文件名'),
  })).describe('生成的卡片图片'),
})

export class Md2CardResponseVo extends createZodDto(md2CardResponseSchema) {}

// Fireflycard生成响应
const fireflycardResponseSchema = z.object({
  image: z.string().describe('生成的卡片图片base64数据'),
})

export class FireflycardResponseVo extends createZodDto(fireflycardResponseSchema) {}
