import { createZodDto, UserType } from '@yikart/common'
import { z } from 'zod'

// 图片生成请求
const AdminImageGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000).describe('图片描述提示'),
  model: z.string().describe('图片生成模型'),
  n: z.number().int().min(1).max(10).optional().describe('生成图片数量'),
  quality: z.string().optional().describe('图片质量'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  size: z.string().optional().describe('图片尺寸'),
  style: z.string().optional().describe('图片风格'),
  user: z.string().optional().describe('用户标识符'),
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
})
export class AdminImageGenerationDto extends createZodDto(AdminImageGenerationSchema) {}
