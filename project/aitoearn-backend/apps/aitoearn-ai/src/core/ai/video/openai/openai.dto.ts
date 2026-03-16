import { createZodDto, UserType } from '@yikart/common'
import { z } from 'zod'

// OpenAI 视频创建请求DTO
const openAIVideoCreateBaseSchema = z.object({
  prompt: z.string().min(1).describe('提示词'),
  input_reference: z.string().optional().describe('参考图片URL或base64'),
  model: z.string().optional().describe('模型名称'),
  seconds: z.string().optional().describe('视频时长（秒）'),
  size: z.enum(['720x1280', '1280x720', '1024x1792', '1792x1024']).optional().describe('视频尺寸'),
})

export class OpenAIVideoCreateRequestDto extends createZodDto(openAIVideoCreateBaseSchema) {}

const userOpenAIVideoCreateRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...openAIVideoCreateBaseSchema.shape,
})

export class UserOpenAIVideoCreateRequestDto extends createZodDto(userOpenAIVideoCreateRequestSchema) {}

// OpenAI Remix 请求DTO
const openAIVideoRemixBaseSchema = z.object({
  prompt: z.string().min(1).describe('新的提示词'),
})

export class OpenAIVideoRemixRequestDto extends createZodDto(openAIVideoRemixBaseSchema) {}

const userOpenAIVideoRemixRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  videoId: z.string(),
  ...openAIVideoRemixBaseSchema.shape,
})

export class UserOpenAIVideoRemixRequestDto extends createZodDto(userOpenAIVideoRemixRequestSchema) {}

// OpenAI 回调 DTO（对应 Video 类型，包含第三方扩展字段）
const openAIVideoCallbackSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'in_progress', 'completed', 'failed']),
  model: z.string(),
  prompt: z.string().nullable(),
  progress: z.number(),
  created_at: z.number(),
  completed_at: z.number().nullable(),
  expires_at: z.number().nullable(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable(),
  remixed_from_video_id: z.string().nullable(),
  seconds: z.string(),
  size: z.string(),
  object: z.literal('video'),
  // 第三方扩展字段（直接返回视频 URL）
  url: z.string().optional(),
  video_url: z.string().optional(),
})

export class OpenAIVideoCallbackDto extends createZodDto(openAIVideoCallbackSchema) {}

// Sora Character 创建请求 DTO
const soraCharacterCreateBaseSchema = z.object({
  prompt: z.string().min(1).describe('角色名称'),
  videoUrl: z.string().optional().describe('通过视频 URL 创建'),
  taskId: z.string().optional().describe('通过任务 ID 创建'),
  timestamps: z.string().regex(/^\d+,\d+$/).describe('两个数字，逗号分隔，间隔 ≤ 3秒，如 "1,3"'),
})

export class SoraCharacterCreateRequestDto extends createZodDto(soraCharacterCreateBaseSchema) {}

const userSoraCharacterCreateRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...soraCharacterCreateBaseSchema.shape,
})

export class UserSoraCharacterCreateRequestDto extends createZodDto(userSoraCharacterCreateRequestSchema) {}

// Sora Character 回调 DTO
const soraCharacterCallbackSchema = z.object({
  id: z.string(),
  object: z.literal('character'),
  model: z.literal('sora-2-character'),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  username: z.string(),
  avatar_url: z.string().optional(),
  video_url: z.string().optional(),
  created_at: z.number(),
  completed_at: z.number().nullable().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
  }).nullable().optional(),
})

export class SoraCharacterCallbackDto extends createZodDto(soraCharacterCallbackSchema) {}
