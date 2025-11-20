import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'
import { fireflycardStyleSchema, fireflycardSwitchConfigSchema, fireflycardTempSchema } from '../../ai/image/image.dto'
import { FireflycardTempTypes } from '../../ai/libs/fireflycard'

// 图片生成请求
const AdminImageGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000).describe('图片描述提示'),
  model: z.string().describe('图片生成模型'),
  n: z.number().int().min(1).max(10).optional().describe('生成图片数量'),
  quality: z.string().optional().describe('图片质量'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  size: z.string().optional().describe('图片尺寸'),
  style: z.string().optional().describe('图片风格'),
  user: z.string().optional().describe('用户标识符'),
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
})
export class AdminImageGenerationDto extends createZodDto(AdminImageGenerationSchema) { }

// 通用视频生成请求
const videoGenerationRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().or(z.string().array()).optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.any()).optional().describe('其他参数'),
})
export class AdminVideoGenerationRequestDto extends createZodDto(videoGenerationRequestSchema) { }

const AdminVideoGenerationStatusSchema = z.object({
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
  taskId: z.string().describe('任务ID'),
})
export class AdminVideoGenerationStatusSchemaDto extends createZodDto(AdminVideoGenerationStatusSchema) { }

// 通用视频任务状态查询
const adminListUserVideoTasksQuerySchema = z.object({
  ...PaginationDtoSchema.shape,
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
})

export class AdminUserListVideoTasksQueryDto extends createZodDto(adminListUserVideoTasksQuerySchema) {}

const adminFireflyCardSchema = z.object({
  content: z.string().min(1).describe('卡片内容'),
  temp: fireflycardTempSchema.default(FireflycardTempTypes.A).describe('模板类型'),
  title: z.string().optional().describe('标题'),
  style: fireflycardStyleSchema.describe('样式配置'),
  switchConfig: fireflycardSwitchConfigSchema.describe('开关配置'),
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
})

export class AdminFireflyCardDto extends createZodDto(adminFireflyCardSchema) {}

const dashscopeText2VideoRequestSchema = z.object({
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
  model: z.string().min(1).describe('模型名称'),
  input: z.object({
    prompt: z.string().min(1).describe('正向文本提示词'),
    negative_prompt: z.string().optional().describe('负向文本提示词'),
  }),
  parameters: z.object({
    size: z.string().optional().describe('视频尺寸'),
    duration: z.number().optional().describe('视频时长（秒）'),
    prompt_extend: z.boolean().optional().describe('是否扩展提示词'),
  }).optional(),
})
export class DashscopeText2VideoRequestDto extends createZodDto(dashscopeText2VideoRequestSchema) {}

const dashscopeStatusRequestSchema = z.object({
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
  taskId: z.string().describe('任务ID'),
})
export class DashscopeStatusRequestDto extends createZodDto(dashscopeStatusRequestSchema) {}

const imageEditSchema = z.object({
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
  model: z.string().describe('图片编辑模型'),
  image: z.string().or(z.string().array()).describe('原始图片'),
  prompt: z.string().min(1).max(4000).describe('编辑描述'),
  mask: z.string().optional().describe('遮罩图片'),
  n: z.int().min(1).max(100).optional().describe('生成图片数量'),
  size: z.string().optional().describe('图片尺寸'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  user: z.string().optional().describe('用户标识符'),
})

export class AdminImageEditDto extends createZodDto(imageEditSchema) {}
