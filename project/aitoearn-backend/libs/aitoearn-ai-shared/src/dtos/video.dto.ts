import { createZodDto, CreditsConsumptionSource, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'

const volcengineToolSchema = z.object({
  type: z.literal('web_search'),
})

// 通用视频生成请求
const videoGenerationRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  groupId: z.string().optional().describe('素材组 ID，传入后生成成功时保存到该素材组'),
  image: z.string().or(z.string().array()).optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  video_url: z.string().optional().describe('视频URL（用于视频编辑模式）'),
  images: z.string().array().optional().describe('参考图片URL或base64列表'),
  videos: z.string().array().optional().describe('参考视频URL列表'),
  audios: z.string().array().optional().describe('参考音频URL或base64列表'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  resolution: z.string().optional().describe('分辨率'),
  ratio: z.string().optional().describe('宽高比'),
  duration: z.number().optional().describe('时长'),
  seed: z.number().int().optional().describe('随机种子'),
  watermark: z.boolean().optional().describe('是否带水印'),
  tools: z.array(volcengineToolSchema).optional().describe('供应商工具配置'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('其他参数'),
  source: z.enum([CreditsConsumptionSource.AiVideo, CreditsConsumptionSource.AiDraftGeneration, CreditsConsumptionSource.Plugin]).optional().describe('消费来源'),
})

export class VideoGenerationRequestDto extends createZodDto(videoGenerationRequestSchema) {}

// 通用视频任务状态查询
const videoTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class VideoTaskQueryDto extends createZodDto(videoTaskQuerySchema) {}

// 通用视频生成请求（内部使用）
const userVideoGenerationRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...videoGenerationRequestSchema.shape,
})

export class UserVideoGenerationRequestDto extends createZodDto(userVideoGenerationRequestSchema) {}

// 通用视频任务状态查询（内部使用）
const userVideoTaskQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...videoTaskQuerySchema.shape,
})

export class UserVideoTaskQueryDto extends createZodDto(userVideoTaskQuerySchema) {}

// 视频任务列表查询
const listVideoTasksQuerySchema = z.object({
  ...PaginationDtoSchema.shape,
})

export class ListVideoTasksQueryDto extends createZodDto(listVideoTasksQuerySchema) {}

// 视频任务列表查询（内部使用）
const userListVideoTasksQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...listVideoTasksQuerySchema.shape,
})

export class UserListVideoTasksQueryDto extends createZodDto(userListVideoTasksQuerySchema) {}

// 视频生成模型查询DTO
const videoGenerationModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class VideoGenerationModelsQueryDto extends createZodDto(videoGenerationModelsQuerySchema) {}
