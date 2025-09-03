import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { config } from '../../config'

// 使用情况统计
const usageMetadataSchema = z.object({
  input_tokens: z.number().describe('输入token数').optional(),
  output_tokens: z.number().describe('输出token数'),
  total_tokens: z.number().describe('总token数'),
})

// 用户AI聊天响应
const userAiChatResponseSchema = z.object({
  content: z.string().or(z.any()).describe('AI回复内容'),
  model: z.string().describe('使用的模型'),
  usage: usageMetadataSchema.optional().describe('token使用情况'),
})

export class UserAiChatResponseVo extends createZodDto(userAiChatResponseSchema) {}

// 用户日志信息
const userLogInfoSchema = z.object({
  id: z.number().describe('日志唯一标识'),
  created_at: z.number().describe('创建时间戳'),
  model_name: z.string().describe('使用的模型名称'),
  prompt_tokens: z.number().describe('输入token数量'),
  completion_tokens: z.number().describe('输出token数量'),
  use_time: z.number().describe('使用时间'),
  quota: z.number().transform(v => (v / (500000 * config.userAi.creditRatio)).toFixed(10)).describe('消耗积分'),
})

// 用户日志响应
const userLogsResponseSchema = z.object({
  items: z.array(userLogInfoSchema).describe('日志列表'),
  total: z.number().describe('总数量'),
  page: z.number().describe('当前页码'),
  page_size: z.number().describe('每页数量'),
})

export class UserLogsResponseVo extends createZodDto(userLogsResponseSchema) {}

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

export class UserImageResponseVo extends createZodDto(userImageResponseSchema) {}

// MJ视频任务提交响应
const mjVideoSubmitResponseSchema = z.object({
  code: z.number().describe('响应代码'),
  description: z.string().describe('响应描述'),
  result: z.string().describe('任务ID'),
  properties: z.object({
    prompt: z.string().describe('处理后的提示词'),
  }).describe('任务属性'),
})

export class MjVideoSubmitResponseVo extends createZodDto(mjVideoSubmitResponseSchema) {}

// MJ任务查询响应
const mjTaskFetchResponseSchema = z.object({
  id: z.string().describe('任务ID'),
  prompt: z.string().describe('任务描述'),
  imageUrl: z.string().describe('图片地址'),
  enqueue_time: z.string().describe('入队时间'),
  width: z.number().describe('宽度'),
  height: z.number().describe('高度'),
  batch_size: z.number().describe('批次大小'),
  status: z.string().describe('任务状态'),
  job_type: z.string().describe('任务类型'),
  video_url: z.string().describe('单条视频URL'),
  video_urls: z.array(z.string()).describe('4条视频URL'),
  progress: z.string().describe('任务进度'),
  action: z.string().describe('任务动作'),
})

export class MjTaskFetchResponseVo extends createZodDto(mjTaskFetchResponseSchema) {}

// 通用视频生成响应
const videoGenerationResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  status: z.string().describe('任务状态'),
  fail_reason: z.string().optional().describe('失败原因或视频 url'),
  action: z.string().describe('任务操作'),
  submit_time: z.number().describe('任务提交时间'),
  start_time: z.number().describe('任务开始时间'),
  finish_time: z.number().describe('任务开始时间'),
  progress: z.string().describe('任务进度'),
  data: z.record(z.string(), z.any()).describe('任务数据'),
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
