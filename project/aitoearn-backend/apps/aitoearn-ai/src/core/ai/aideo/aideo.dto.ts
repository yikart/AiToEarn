import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'
import { SkillType } from '../libs/volcengine'

// 视频输入项（URL 或 Stream）
const videoInputSchema = z.union([
  z.string().describe('视频 URL'),
  z.object({
    type: z.literal('url'),
    url: z.string(),
    fileName: z.string().optional(),
    fileExtension: z.string().optional(),
  }),
  z.object({
    type: z.literal('stream'),
    stream: z.custom<Buffer | NodeJS.ReadableStream>(),
    fileSize: z.number(),
    fileName: z.string().optional(),
    fileExtension: z.string().optional(),
  }),
])

// 提交 Aideo 任务请求（Prompt 方式）
const submitAideoTaskPromptSchema = z.object({
  prompt: z.string().min(1).describe('自然语言提示词'),
  multiInputs: z.array(videoInputSchema).min(1).describe('输入文件列表'),
  spaceName: z.string().optional().describe('点播空间名'),
})

// 提交 Aideo 任务请求（SkillType 方式）
const submitAideoTaskSkillSchema = z.object({
  skillType: z.enum(SkillType).describe('AI 技能类型'),
  skillParams: z.record(z.string(), z.unknown()).optional().describe('技能参数（JSON 对象）'),
  multiInputs: z.array(videoInputSchema).min(1).describe('输入文件列表'),
  spaceName: z.string().optional().describe('点播空间名'),
})

// 提交 Aideo 任务请求（Union 类型）
export const submitAideoTaskRequestSchema = z.union([
  submitAideoTaskPromptSchema,
  submitAideoTaskSkillSchema,
])

// 导出类型
export type SubmitAideoTaskRequest = z.infer<typeof submitAideoTaskRequestSchema>

// 用户提交 Aideo 任务请求基础 Schema
const userSubmitAideoTaskBaseSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  multiInputs: z.array(videoInputSchema).min(1).describe('输入文件列表'),
  spaceName: z.string().optional().describe('点播空间名'),
})

// 用户提交 Aideo 任务请求（Prompt 方式）
const userSubmitAideoTaskPromptSchema = userSubmitAideoTaskBaseSchema.extend({
  prompt: z.string().min(1).describe('自然语言提示词'),
})

// 用户提交 Aideo 任务请求（SkillType 方式）
const userSubmitAideoTaskSkillSchema = userSubmitAideoTaskBaseSchema.extend({
  skillType: z.enum(SkillType).describe('AI 技能类型'),
  skillParams: z.record(z.string(), z.unknown()).optional().describe('技能参数（JSON 对象）'),
})

export const userSubmitAideoTaskRequestSchema = z.union([
  userSubmitAideoTaskPromptSchema,
  userSubmitAideoTaskSkillSchema,
])

// 导出类型
export type UserSubmitAideoTaskRequest = z.infer<typeof userSubmitAideoTaskRequestSchema>

// 查询 Aideo 任务状态请求
const getAideoTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class GetAideoTaskQueryDto extends createZodDto(
  getAideoTaskQuerySchema,
  'GetAideoTaskQueryDto',
) {}

// 用户查询 Aideo 任务状态请求
const userGetAideoTaskQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...getAideoTaskQuerySchema.shape,
})

export class UserGetAideoTaskQueryDto extends createZodDto(
  userGetAideoTaskQuerySchema,
  'UserGetAideoTaskQueryDto',
) {}

// 列表查询 Aideo 任务请求
const listAideoTasksQuerySchema = z.object({
  ...PaginationDtoSchema.shape,
})

export class ListAideoTasksQueryDto extends createZodDto(
  listAideoTasksQuerySchema,
  'ListAideoTasksQueryDto',
) {}

// 用户列表查询 Aideo 任务请求
const userListAideoTasksQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...listAideoTasksQuerySchema.shape,
})

export class UserListAideoTasksQueryDto extends createZodDto(
  userListAideoTasksQuerySchema,
  'UserListAideoTasksQueryDto',
) {}

// 视频风格转换相关 DTO
export interface UserSubmitVideoStyleTransferRequest {
  userId: string
  userType: UserType[keyof UserType]
  /** 输入视频 URL 或 VID */
  videoInput: string
  /** 转绘风格，例如："漫画风"、"3D卡通风格"、"日漫风格" */
  style?: string
  /** 输出视频分辨率 */
  resolution: '480p' | '720p' | '1080p'
}

export interface UserGetVideoStyleTransferTaskRequest {
  userId: string
  userType: UserType[keyof UserType]
  taskId: string
}

// 短剧解说相关 DTO
export interface UserSubmitDramaRecapTaskRequest {
  userId: string
  userType: UserType[keyof UserType]
  /** 视频 VID 列表 */
  vids: string[]
  /** 剧本还原任务 ID（可选） */
  dramaScriptTaskId?: string
  /** 自定义解说词（可选） */
  recapText?: string
  /** 说话人配置 */
  speakerConfig?: {
    appId: string
    cluster: string
    voiceType: string
  }
  /** 是否擦除字幕 */
  isEraseSubtitle?: boolean
  /** 字体配置 */
  fontConfig?: {
    color?: string
    size?: number
    name?: string
  }
  /** AI 生成解说词的风格指令 */
  recapStyle?: string
  /** 期望的解说词语速 */
  recapTextSpeed?: number
  /** 期望 AI 生成的解说词长度 */
  recapTextLength?: number
  /** AI 配音时句间停顿的时长 */
  pauseTime?: number
  /** 是否允许解说词匹配重复的视频画面 */
  allowRepeatMatch?: boolean
}

export interface UserGetDramaRecapTaskRequest {
  userId: string
  userType: UserType[keyof UserType]
  taskId: string
}
