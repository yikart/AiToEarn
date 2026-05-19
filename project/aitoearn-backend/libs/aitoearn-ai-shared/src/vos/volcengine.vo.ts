import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// Volcengine视频生成响应
const volcengineVideoGenerationResponseSchema = z.object({
  id: z.string(),
})

export class VolcengineVideoGenerationResponseVo extends createZodDto(volcengineVideoGenerationResponseSchema) {}

// Volcengine 任务状态响应 VO
const volcengineTaskStatusResponseSchema = z.object({
  id: z.string().describe('任务ID'),
  model: z.string().describe('模型名称'),
  status: z.string().describe('任务状态'),
  error: z.object({
    message: z.string(),
    code: z.string(),
  }).nullable().describe('错误信息'),
  created_at: z.number().describe('创建时间'),
  updated_at: z.number().describe('更新时间'),
  content: z.object({
    video_url: z.string().optional(),
    last_frame_url: z.string().optional(),
  }).optional().describe('视频内容'),
  seed: z.number().optional().describe('种子值'),
  resolution: z.string().optional().describe('分辨率'),
  ratio: z.string().optional().describe('宽高比'),
  duration: z.number().optional().describe('时长'),
  framespersecond: z.number().optional().describe('帧率'),
  usage: z.object({
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional().describe('使用量统计'),
})

export class VolcengineTaskStatusResponseVo extends createZodDto(volcengineTaskStatusResponseSchema) {}
