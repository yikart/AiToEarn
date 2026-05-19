import { createPaginationVo, createZodDto, zodI18nString } from '@yikart/common'
import { z } from 'zod'
import { AiLogChannel } from '../enums'

// 通用视频生成响应
const videoGenerationResponseSchema = z.object({
  id: z.string().describe('任务 ID'),
  status: z.string().describe('任务状态'),
})

export class VideoGenerationResponseVo extends createZodDto(videoGenerationResponseSchema) {}

// 视频任务输入参数
const videoTaskInputSchema = z.object({
  prompt: z.string().describe('提示词'),
  groupId: z.string().optional().describe('素材组 ID'),
  image: z.string().or(z.string().array()).optional().describe('图片 URL'),
  images: z.array(z.string()).optional().describe('参考图片 URL 列表'),
  audios: z.array(z.string()).optional().describe('参考音频 URL 列表'),
  duration: z.number().optional().describe('时长（秒）'),
  aspectRatio: z.string().optional().describe('宽高比'),
  resolution: z.string().optional().describe('分辨率'),
  videoUrl: z.string().optional().describe('视频 URL（视频编辑模式）'),
  videos: z.array(z.string()).optional().describe('参考视频 URL 列表'),
  watermark: z.boolean().optional().describe('是否带水印'),
})

export type VideoTaskInput = z.infer<typeof videoTaskInputSchema>

// 通用视频任务状态响应
const videoTaskStatusResponseSchema = z.object({
  id: z.string().describe('任务 ID'),
  model: z.string().describe('模型名称'),
  status: z.string().describe('任务状态'),
  input: videoTaskInputSchema.describe('输入参数'),
  videoUrl: z.string().optional().describe('生成的视频 URL'),
  coverUrl: z.string().optional().describe('生成视频的封面 URL'),
  mediaId: z.string().optional().describe('保存后的素材 ID'),
  groupId: z.string().optional().describe('保存到的素材组 ID'),
  error: z.object({
    message: z.string().describe('错误信息'),
  }).optional().describe('错误信息'),
  submittedAt: z.date().describe('提交时间'),
  startedAt: z.date().describe('开始时间'),
  finishedAt: z.date().optional().describe('完成时间'),
})

export class VideoTaskStatusResponseVo extends createZodDto(videoTaskStatusResponseSchema) {}

export class ListVideoTasksResponseVo extends createPaginationVo(videoTaskStatusResponseSchema) {}

// 视频生成模型参数 VO
export const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.array(zodI18nString()).default([]),
  mainTag: z.string().optional(),
  channel: z.enum(AiLogChannel).describe('渠道'),
  modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video', 'multi-image2video', 'video2video'])).describe('支持的模式'),
  resolutions: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
  maxInputImages: z.number().describe('最大输入图片数'),
  aspectRatios: z.array(z.string()).describe('支持的宽高比列表'),
  defaults: z.object({
    resolution: z.string().optional(),
    aspectRatio: z.string().optional(),
    duration: z.number().optional(),
  }).describe('默认值'),
  pricing: z.object({
    resolution: z.string().optional(),
    aspectRatio: z.string().optional(),
    mode: z.string().optional(),
    duration: z.number().optional(),
    price: z.number(),
    discount: z.string().optional(),
    originPrice: z.number().optional(),
  }).array().describe('价格表'),
})

export class VideoGenerationModelParamsVo extends createZodDto(videoGenerationModelSchema) {}
