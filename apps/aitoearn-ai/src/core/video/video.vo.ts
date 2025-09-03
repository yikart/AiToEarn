import { z } from 'zod'

// 通用视频生成响应
const videoGenerationResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  status: z.string().describe('任务状态'),
  message: z.string().optional().describe('响应消息'),
})

export class VideoGenerationResponseVo extends createZodDto(videoGenerationResponseSchema) {}

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
  data: z.record(z.string(), z.any()).describe('任务数据'),
})

export class VideoTaskStatusResponseVo extends createZodDto(videoTaskStatusResponseSchema) {}

// 视频生成模型参数 VO
const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  modes: z.array(z.string()).describe('支持的模式'),
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
