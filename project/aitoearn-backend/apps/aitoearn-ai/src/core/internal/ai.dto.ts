import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'

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

// 二维码艺术图生成请求
const adminQrCodeArtSchema = z.object({
  userId: z.string().describe('用户Id'),
  userType: z.enum(UserType).describe('用户类型'),
  content: z.string().min(1).max(2000).describe('二维码扫码后的内容'),
  referenceImageUrl: z.string().url().optional().describe('参考样式图 URL'),
  prompt: z.string().min(1).max(4000).describe('文字描述（提示词）'),
  model: z.string().default('gpt-image-1').describe('图片生成模型'),
  size: z.string().optional().describe('图片尺寸'),
})

export class AdminQrCodeArtDto extends createZodDto(adminQrCodeArtSchema) {}
