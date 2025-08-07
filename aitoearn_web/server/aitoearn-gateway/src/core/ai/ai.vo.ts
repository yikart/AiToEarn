import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

// 用户AI聊天响应VO
const userAiChatResponseSchema = z.object({
  content: z.union([z.string(), z.any()]).describe('AI回复内容'),
  model: z.string().describe('使用的模型'),
  usage: z.object({
    input_tokens: z.number().describe('输入token数'),
    output_tokens: z.number().describe('输出token数'),
    total_tokens: z.number().describe('总token数'),
  }).optional().describe('使用情况'),
})

export class UserAiChatResponseVo extends createZodDto(userAiChatResponseSchema) {}

// 用户日志响应VO
const userLogsResponseSchema = z.object({
  items: z.array(z.object({
    id: z.number().describe('日志ID'),
    created_at: z.number().describe('创建时间'),
    content: z.string().describe('内容'),
    model_name: z.string().describe('模型名称'),
    prompt_tokens: z.number().describe('提示token数'),
    completion_tokens: z.number().describe('完成token数'),
    use_time: z.number().describe('使用时间'),
  })).describe('日志列表'),
  total: z.number().describe('总数'),
  page: z.number().describe('页码'),
  page_size: z.number().describe('每页大小'),
})

export class UserLogsResponseVo extends createZodDto(userLogsResponseSchema) {}

const userImageResponseSchema = z.object({
  created: z.number().describe('创建时间'),
  list: z.array(z.object({
    url: z.string().optional().describe('图片URL'),
    b64_json: z.string().optional().describe('Base64编码的图片'),
    revised_prompt: z.string().optional().describe('修订后的提示'),
  })).describe('图片数据'),
  usage: z.object({
    input_tokens: z.number().optional().describe('输入token数'),
    output_tokens: z.number().describe('输出token数'),
    total_tokens: z.number().describe('总token数'),
  }).optional().describe('使用情况'),
})

export class UserImageResponseVo extends createZodDto(userImageResponseSchema) {}

const mjVideoSubmitResponseSchema = z.object({
  code: z.number().describe('响应代码'),
  description: z.string().describe('响应描述'),
  result: z.string().describe('任务ID'),
  properties: z.object({
    prompt: z.string().describe('处理后的提示词'),
  }).describe('任务属性'),
})

export class MjVideoSubmitResponseVo extends createZodDto(mjVideoSubmitResponseSchema) {}

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

const videoGenerationResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  status: z.string().describe('任务状态'),
  message: z.string().optional().describe('响应消息'),
})

export class VideoGenerationResponseVo extends createZodDto(videoGenerationResponseSchema) {}

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

const md2CardResponseSchema = z.object({
  images: z.array(z.object({
    url: z.string().describe('图片URL'),
    fileName: z.string().describe('文件名'),
  })).describe('生成的卡片图片'),
})

export class Md2CardResponseVo extends createZodDto(md2CardResponseSchema) {}

const fireflycardResponseSchema = z.object({
  image: z.string().describe('生成的卡片图片base64数据'),
})

export class FireflycardResponseVo extends createZodDto(fireflycardResponseSchema) {}
// 图片生成模型参数VO
const imageGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  qualities: z.array(z.string()).describe('支持的质量选项'),
  styles: z.array(z.string()).describe('支持的风格选项'),
})

export class ImageGenerationModelVo extends createZodDto(imageGenerationModelSchema) {}

// 图片编辑模型参数VO
const imageEditModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
})

export class ImageEditModelVo extends createZodDto(imageEditModelSchema) {}

// 视频生成模型参数VO
const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  modes: z.array(z.string()).describe('支持的模式'),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
})

export class VideoGenerationModelVo extends createZodDto(videoGenerationModelSchema) {}
