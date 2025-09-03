import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 通用视频生成请求
const videoGenerationRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.any()).optional().describe('其他参数'),
})

export class VideoGenerationRequestDto extends createZodDto(videoGenerationRequestSchema) {}

// 通用视频任务状态查询
const videoTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class VideoTaskQueryDto extends createZodDto(videoTaskQuerySchema) {}

// 通用视频生成请求
const userVideoGenerationRequestSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  ...videoGenerationRequestSchema.shape,
})

export class UserVideoGenerationRequestDto extends createZodDto(userVideoGenerationRequestSchema) {}

// 通用视频任务状态查询
const userVideoTaskQuerySchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  ...videoTaskQuerySchema.shape,
})

export class UserVideoTaskQueryDto extends createZodDto(userVideoTaskQuerySchema) {}
