import { createPaginationVo, createZodDto, FileUtil, zodI18nString } from '@yikart/common'
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
  videoUrl: FileUtil.zodBuildUrl().nullable().optional().describe('生成的视频 URL'),
  coverUrl: FileUtil.zodBuildUrl().nullable().optional().describe('生成视频的封面 URL'),
  mediaId: z.string().optional().describe('保存后的素材 ID'),
  groupId: z.string().optional().describe('保存到的素材组 ID'),
  error: z.object({
    message: z.string().describe('错误信息'),
  }).optional().describe('错误信息'),
  submittedAt: z.coerce.date().describe('提交时间'),
  startedAt: z.coerce.date().describe('开始时间'),
  finishedAt: z.coerce.date().optional().describe('完成时间'),
})

export class VideoTaskStatusResponseVo extends createZodDto(videoTaskStatusResponseSchema) {}

export class ListVideoTasksResponseVo extends createPaginationVo(videoTaskStatusResponseSchema) {}

const videoModelInputConstraintSchema = z.object({
  maxCount: z.number().optional().describe('最大输入数量'),
  formats: z.array(z.string()).optional().describe('支持的文件格式'),
  minDuration: z.number().optional().describe('最小时长（秒）'),
  maxDuration: z.number().optional().describe('单个文件最大时长（秒）'),
  maxTotalDuration: z.number().optional().describe('总最大时长（秒）'),
  maxSizeMb: z.number().optional().describe('单个文件最大大小（MB）'),
  minAspectRatio: z.number().optional().describe('最小宽高比'),
  maxAspectRatio: z.number().optional().describe('最大宽高比'),
  minWidth: z.number().optional().describe('最小宽度'),
  maxWidth: z.number().optional().describe('最大宽度'),
  minPixels: z.number().optional().describe('最小像素数'),
  maxPixels: z.number().optional().describe('最大像素数'),
  minFps: z.number().optional().describe('最小帧率'),
  maxFps: z.number().optional().describe('最大帧率'),
})

const videoModelInputConstraintsSchema = z.object({
  images: videoModelInputConstraintSchema.optional().describe('图片输入约束'),
  videos: videoModelInputConstraintSchema.optional().describe('视频输入约束'),
  audios: videoModelInputConstraintSchema.optional().describe('音频输入约束'),
}).optional().describe('多模态输入约束')

// 视频生成模型参数 VO
export const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.array(zodI18nString()).default([]),
  mainTag: z.string().optional(),
  channel: z.enum(AiLogChannel).describe('渠道'),
  modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video', 'multi-image2video', 'multi-ref', 'video2video'])).describe('支持的模式'),
  resolutions: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
  maxInputImages: z.number().describe('最大输入图片数'),
  inputConstraints: videoModelInputConstraintsSchema,
  aspectRatios: z.array(z.string()).describe('支持的宽高比列表'),
  defaults: z.object({
    resolution: z.string().optional(),
    aspectRatio: z.string().optional(),
    duration: z.number().optional(),
  }).describe('默认值'),
})

export class VideoGenerationModelParamsVo extends createZodDto(videoGenerationModelSchema) {}
