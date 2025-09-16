import { createZodDto } from '@yikart/common'
import { AiLogChannel } from '@yikart/mongodb'

import { z } from 'zod'

// Kling视频生成响应
const klingVideoGenerationResponseSchema = z.object({
  task_id: z.string(),
  task_status: z.string().optional(),
})

// Volcengine视频生成响应
const volcengineVideoGenerationResponseSchema = z.object({
  id: z.string(),
})

// 通用视频生成响应
const videoGenerationResponseSchema = z.object({
  task_id: z.string(),
  status: z.string(),
})

export class KlingVideoGenerationResponseVo extends createZodDto(klingVideoGenerationResponseSchema) {}
export class VolcengineVideoGenerationResponseVo extends createZodDto(volcengineVideoGenerationResponseSchema) {}
export class VideoGenerationResponseVo extends createZodDto(videoGenerationResponseSchema) {}
// Kling 任务状态响应 VO
const klingTaskStatusResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  task_status: z.string().describe('任务状态'),
  task_status_msg: z.string().describe('任务状态信息'),
  task_info: z.object({
    parent_video: z.object({
      id: z.string(),
      url: z.string(),
      duration: z.string(),
    }).optional(),
    external_task_id: z.string().optional(),
  }).optional().describe('任务信息'),
  task_result: z.object({
    images: z.array(z.object({
      index: z.number(),
      url: z.string(),
    })).optional(),
    videos: z.array(z.object({
      id: z.string(),
      url: z.string(),
      duration: z.string(),
    })).optional(),
  }).optional().describe('任务结果'),
  created_at: z.number().describe('创建时间'),
  updated_at: z.number().describe('更新时间'),
})

export class KlingTaskStatusResponseVo extends createZodDto(klingTaskStatusResponseSchema) {}

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

// 通用视频任务状态响应
const videoTaskStatusResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  action: z.string().describe('任务动作'),
  status: z.string().describe('任务状态'),
  fail_reason: z.string().optional().describe('失败原因或视频URL'),
  submit_time: z.number().describe('提交时间'),
  start_time: z.number().describe('开始时间'),
  finish_time: z.number().describe('完成时间'),
  progress: z.string().describe('任务进度'),
  data: z.any(),
})

export class VideoTaskStatusResponseVo extends createZodDto(videoTaskStatusResponseSchema) {}

// 视频生成模型参数 VO
const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  channel: z.enum(AiLogChannel),
  modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video'])),
  resolutions: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
  supportedParameters: z.array(z.string()).describe('支持的参数'),
  defaults: z.object({
    resolution: z.string().optional(),
    aspectRatio: z.string().optional(),
    mode: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
  pricing: z.object({
    resolution: z.string().optional(),
    aspectRatio: z.string().optional(),
    mode: z.string().optional(),
    duration: z.number().optional(),
    price: z.number(),
  }).array(),
})

export class VideoGenerationModelParamsVo extends createZodDto(videoGenerationModelSchema) {}
