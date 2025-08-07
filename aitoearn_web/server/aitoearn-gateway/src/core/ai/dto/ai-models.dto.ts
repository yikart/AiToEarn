import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

// 获取模型参数请求DTO
const getModelParamsRequestSchema = z.object({
  userId: z.string().describe('用户ID'),
})

export class GetModelParamsRequestDto extends createZodDto(getModelParamsRequestSchema) {}

// 图片生成模型参数DTO
const imageGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  qualities: z.array(z.string()).describe('支持的质量选项'),
  styles: z.array(z.string()).describe('支持的风格选项'),
})

export class ImageGenerationModelDto extends createZodDto(imageGenerationModelSchema) {}

// 图片编辑模型参数DTO
const imageEditModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
})

export class ImageEditModelDto extends createZodDto(imageEditModelSchema) {}

// 视频生成模型参数DTO
const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  modes: z.array(z.string()).describe('支持的模式'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
})

export class VideoGenerationModelDto extends createZodDto(videoGenerationModelSchema) {}
