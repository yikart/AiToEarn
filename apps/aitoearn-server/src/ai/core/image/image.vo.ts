import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 使用情况统计
const usageMetadataSchema = z.object({
  input_tokens: z.number().optional().describe('输入token数'),
  output_tokens: z.number().optional().describe('输出token数'),
  total_tokens: z.number().optional().describe('总token数'),
})

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
  background: z.string().optional(),
  output_format: z.string().optional(),
  quality: z.string().optional(),
  size: z.string().optional(),
})

export class ImageResponseVo extends createZodDto(userImageResponseSchema) {}

// 图片生成模型参数 VO
const imageGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.string().array().default([]),
  mainTag: z.string().optional(),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  qualities: z.array(z.string()).describe('支持的质量选项'),
  styles: z.array(z.string()).describe('支持的风格选项'),
  pricing: z.string(),
  discount: z.string().optional(),
  originPrice: z.string().optional(),
})

export class ImageGenerationModelParamsVo extends createZodDto(imageGenerationModelSchema) {}

// 图片编辑模型参数 VO
const imageEditModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.string().array().default([]),
  mainTag: z.string().optional(),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  pricing: z.string(),
  discount: z.string().optional(),
  originPrice: z.string().optional(),
  maxInputImages: z.number(),
})

export class ImageEditModelParamsVo extends createZodDto(imageEditModelSchema) {}

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

// 异步任务响应
const asyncTaskResponseSchema = z.object({
  logId: z.string().describe('任务日志ID'),
  status: z.string().describe('任务状态'),
  message: z.string().describe('响应消息'),
})

export class AsyncTaskResponseVo extends createZodDto(asyncTaskResponseSchema) {}

// 任务状态响应
const taskStatusResponseSchema = z.object({
  logId: z.string().describe('任务日志ID'),
  status: z.string().describe('任务状态'),
  startedAt: z.date().describe('开始时间'),
  duration: z.number().optional().describe('持续时间(毫秒)'),
  points: z.number().describe('消耗积分'),
  request: z.record(z.string(), z.unknown()).describe('请求参数'),
  response: z.record(z.string(), z.unknown()).optional().describe('响应结果'),
  images: z.array(imageObjectSchema).optional().describe('生成的图片列表'),
  errorMessage: z.string().optional().describe('错误信息'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class TaskStatusResponseVo extends createZodDto(taskStatusResponseSchema) {}
