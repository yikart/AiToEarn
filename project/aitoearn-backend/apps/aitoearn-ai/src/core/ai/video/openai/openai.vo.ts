import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// OpenAI 视频响应 VO
const openAIVideoResponseSchema = z.object({
  id: z.string().describe('视频任务ID'),
  status: z.enum(['queued', 'in_progress', 'completed', 'failed']).describe('任务状态'),
  model: z.string().describe('模型名称'),
  prompt: z.string().nullable().describe('提示词'),
  progress: z.number().describe('进度'),
  created_at: z.number().describe('创建时间'),
  completed_at: z.number().nullable().describe('完成时间'),
  expires_at: z.number().nullable().describe('过期时间'),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable().describe('错误信息'),
  remixed_from_video_id: z.string().nullable().describe('源视频ID'),
  seconds: z.string().describe('视频时长'),
  size: z.string().describe('视频尺寸'),
  object: z.literal('video').describe('对象类型'),
})

export class OpenAIVideoResponseVo extends createZodDto(openAIVideoResponseSchema) {}
