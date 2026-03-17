import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'

// 通用视频生成请求
const videoGenerationRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().or(z.string().array()).optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  video_url: z.string().optional().describe('视频URL（用于视频编辑模式）'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('其他参数'),
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
