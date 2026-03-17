import { createZodDto, UserType } from '@yikart/common'
import { AiLogStatus } from '@yikart/mongodb'
import { z } from 'zod'

const geminiVeoVideoCreateBaseSchema = z.object({
  prompt: z.string().min(1).describe('提示词'),
  seed: z.number().optional().describe('随机种子'),
  negativePrompt: z.string().optional().describe('否定提示词'),
  duration: z.number().default(8).describe('视频时长 (秒)'),
  resolution: z.enum(['720p', '1080p', '4000']).default('720p').describe('视频分辨率'),
})

const geminiVeoTIToVideoSchema = z.object({
  model: z.enum([
    'veo-3.1-generate-001',
    'veo-3.1-fast-generate-001',
    'veo-3.1-generate-preview',
    'veo-3.1-fast-generate-preview',
  ]).describe('Veo 模型名称'),
  ...geminiVeoVideoCreateBaseSchema.shape,
  aspectRatio: z.enum(['16:9', '9:16']).default('9:16').describe('视频比例，默认竖屏'),
  image: z.string().optional().describe('图片或首帧图片 URL'),
  lastFrame: z.string().optional().describe('末帧图片 URL'),
})

const geminiVeoRefToVideoSchema = z.object({
  model: z.enum([
    'veo-3.1-generate-preview',
  ]).describe('Veo 模型名称'),
  ...geminiVeoVideoCreateBaseSchema.shape,
  duration: z.literal(8).describe('视频时长 (秒)'),
  aspectRatio: z.enum(['16:9', '9:16']).default('9:16').describe('视频比例，默认竖屏'),
  referenceImages: z.array(z.string()).max(3).describe('参考图片 URL 数组 (仅 preview 模型，最多3张)'),
})

const geminiVeoExtendVideoSchema = z.object({
  model: z.enum([
    'veo-3.1-generate-preview',
    'veo-3.1-fast-generate-preview',
  ]).describe('Veo 模型名称'),
  ...geminiVeoVideoCreateBaseSchema.shape,
  duration: z.literal(7).describe('视频时长 (秒)'),
  video: z.string().describe('延长视频源 URL 或 GCS URI (gs://bucket/path)'),
})

export const geminiVeoVideoCreateRequestSchema = z.union([
  geminiVeoExtendVideoSchema,
  geminiVeoRefToVideoSchema,
  geminiVeoTIToVideoSchema,
])

export type GeminiVeoVideoCreateRequestDto = z.infer<typeof geminiVeoVideoCreateRequestSchema>

const userIdSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
})

export const userGeminiVeoVideoCreateRequestSchema = z.union([
  geminiVeoExtendVideoSchema.extend(userIdSchema.shape),
  geminiVeoRefToVideoSchema.extend(userIdSchema.shape),
  geminiVeoTIToVideoSchema.extend(userIdSchema.shape),
])

export type UserGeminiVeoVideoCreateRequestDto = z.infer<typeof userGeminiVeoVideoCreateRequestSchema>

const generatedVideoSchema = z.object({
  url: z.string().describe('S3 视频 URL'),
  gcsUrl: z.string().nullable().describe('GCS 视频 URI (gs://bucket/path)'),
})

export type GeneratedVideo = z.infer<typeof generatedVideoSchema>

const geminiVeoVideoCallbackSchema = z.object({
  name: z.string(),
  status: z.enum(AiLogStatus),
  model: z.string(),
  prompt: z.string().nullable(),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  error: z.record(z.string(), z.any()).nullable().optional(),
  generatedVideos: z.array(generatedVideoSchema).describe('生成的视频列表，包含 S3 和 GCS URL'),
})

export class GeminiVeoVideoCallbackDto extends createZodDto(geminiVeoVideoCallbackSchema) { }
