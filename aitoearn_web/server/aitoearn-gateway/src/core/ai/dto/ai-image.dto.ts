import { createZodDto } from '@common/utils/zod-dto.util'
import { z } from 'zod/v4'

// 用户图片生成请求Schema
const userImageGenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(4000).describe('图片描述提示'),
  model: z.string().optional().describe('图片生成模型'),
  n: z.number().int().min(1).max(10).default(1).describe('生成图片数量'),
  quality: z.enum(['standard', 'hd']).default('standard').optional().describe('图片质量'),
  response_format: z.enum(['url', 'b64_json']).default('url').describe('返回格式'),
  size: z.string().default('1024x1024').describe('图片尺寸'),
  style: z.enum(['vivid', 'natural']).default('vivid').optional().describe('图片风格'),
  user: z.string().optional().describe('用户标识符'),
})

export class UserImageGenerationRequestDto extends createZodDto(userImageGenerationRequestSchema) {}

// 用户图片编辑请求Schema
const userImageEditRequestSchema = z.object({
  image: z.string().min(1).describe('原始图片（base64编码）'),
  prompt: z.string().min(1).max(4000).describe('编辑描述'),
  mask: z.string().optional().describe('遮罩图片（base64编码）'),
  model: z.string().optional().describe('图片编辑模型'),
  n: z.number().int().min(1).max(10).default(1).describe('生成图片数量'),
  size: z.string().default('1024x1024').describe('图片尺寸'),
  response_format: z.enum(['url', 'b64_json']).default('url').describe('返回格式'),
  user: z.string().optional().describe('用户标识符'),
})

export class UserImageEditRequestDto extends createZodDto(userImageEditRequestSchema) {}

// 用户图片变体请求Schema
const userImageVariationRequestSchema = z.object({
  image: z.string().min(1).describe('原始图片（base64编码）'),
  model: z.string().optional().describe('图片模型'),
  n: z.number().int().min(1).max(10).default(1).describe('生成图片数量'),
  size: z.string().default('1024x1024').describe('图片尺寸'),
  response_format: z.enum(['url', 'b64_json']).default('url').describe('返回格式'),
  user: z.string().optional().describe('用户标识符'),
})

export class UserImageVariationRequestDto extends createZodDto(userImageVariationRequestSchema) {}
