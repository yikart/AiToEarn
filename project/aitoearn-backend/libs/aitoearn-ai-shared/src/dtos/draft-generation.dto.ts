import { AccountType, createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'

export const IMAGE_TEXT_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'] as const

export const ALL_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] as const

/** 视频草稿生成类型：draft 完整草稿（含标题/描述/话题），video 仅生成视频 */
export const DRAFT_TYPES = ['draft', 'video'] as const
export type DraftType = (typeof DRAFT_TYPES)[number]

/** 图文草稿生成类型：draft 完整草稿（含标题/描述/话题），image 仅生成图片 */
export const IMAGE_TEXT_DRAFT_TYPES = ['draft', 'image'] as const
export type ImageTextDraftType = (typeof IMAGE_TEXT_DRAFT_TYPES)[number]

export const CreateDraftGenerationV2DtoSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID，为空时使用默认草稿箱'),
  prompt: z.string().max(2000).optional().describe('视频生成提示词；draftType=video 时作为纯视频提示词'),
  captionPrompt: z.string().max(2000).optional().describe('文案生成提示词，用于标题、描述和话题；draftType=video 时忽略'),
  imageUrls: z.array(z.url()).max(9).optional().describe('用户传入的图片 URL 数组，传入时作为视频首帧图片源'),
  model: z.string().describe('视频生成模型名称，如 grok-imagine-video'),
  duration: z.number().int().min(1).max(15).optional().describe('视频时长（秒），1-15'),
  resolution: z.string().optional().describe('视频分辨率'),
  aspectRatio: z.enum(ALL_ASPECT_RATIOS).optional().describe('视频比例：1:1/16:9/9:16/4:3/3:4/3:2/2:3'),
  videoUrls: z.array(z.url()).max(3).optional().describe('运动参考视频 URL 数组，最多3个'),
  draftType: z.enum(DRAFT_TYPES).default('draft').describe('草稿类型：draft 完整草稿，video 仅生成视频且不生成文案'),
  platforms: z.array(z.enum(AccountType)).optional().describe('目标平台列表，如 ["tiktok", "youtube"]'),
  plannerModel: z.string().optional().describe('草稿规划模型名称，仅 draftType=draft 时生效'),
  disableMemory: z.boolean().optional().default(true).describe('是否禁用用户记忆'),
})
export class CreateDraftGenerationV2Dto extends createZodDto(CreateDraftGenerationV2DtoSchema, 'CreateDraftGenerationV2Dto') {}

export const QueryDraftGenerationTasksDtoSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(10).describe('任务 ID 列表'),
})

export class QueryDraftGenerationTasksDto extends createZodDto(QueryDraftGenerationTasksDtoSchema, 'QueryDraftGenerationTasksDto') {}

export const ListDraftGenerationTasksDtoSchema = PaginationDtoSchema

export class ListDraftGenerationTasksDto extends createZodDto(ListDraftGenerationTasksDtoSchema, 'ListDraftGenerationTasksDto') {}

export const CreateImageTextDraftDtoSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID，为空时使用默认草稿箱'),
  prompt: z.string().max(2000).describe('图片生成提示词；draftType=image 时作为纯图片提示词'),
  captionPrompt: z.string().max(2000).optional().describe('文案生成提示词，用于标题、描述和话题；draftType=image 时忽略'),
  imageUrls: z.array(z.url()).max(14).optional().describe('参考图片 URL 数组'),
  imageModel: z.string().describe('图片生成模型名称'),
  imageCount: z.number().int().min(1).max(9).default(3).describe('生成图片数量'),
  imageSize: z.string().optional().describe('图片分辨率：1K、2K 或 4K'),
  aspectRatio: z.enum(IMAGE_TEXT_ASPECT_RATIOS).optional().describe('图片宽高比'),
  draftType: z.enum(IMAGE_TEXT_DRAFT_TYPES).default('draft').describe('草稿类型：draft 完整草稿，image 仅生成图片且不生成文案'),
  platforms: z.array(z.enum(AccountType)).optional().describe('目标平台列表，如 ["tiktok", "xhs"]'),
  plannerModel: z.string().optional().describe('草稿规划模型名称，仅 draftType=draft 时生效'),
  disableMemory: z.boolean().optional().default(true).describe('是否禁用用户记忆'),
})

export class CreateImageTextDraftDto extends createZodDto(CreateImageTextDraftDtoSchema, 'CreateImageTextDraftDto') {}

export const CreateDraftFromVideoUrlDtoSchema = z.object({
  videoUrl: z.url().describe('视频 URL，Gemini 将分析视频内容并生成草稿文案'),
  groupId: z.string().optional().describe('素材组 ID，为空时使用默认草稿箱'),
  platforms: z.array(z.enum(AccountType)).optional().describe('目标平台列表，如 ["tiktok", "youtube"]'),
})

export class CreateDraftFromVideoUrlDto extends createZodDto(CreateDraftFromVideoUrlDtoSchema, 'CreateDraftFromVideoUrlDto') {}

// Internal DTOs (used by ai-client for internal API calls)

const InternalCreateDraftV2Schema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.enum(UserType).describe('用户类型'),
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID'),
  prompt: z.string().max(2000).optional().describe('视频生成提示词；draftType=video 时作为纯视频提示词'),
  captionPrompt: z.string().max(2000).optional().describe('文案生成提示词，用于标题、描述和话题；draftType=video 时忽略'),
  imageUrls: z.array(z.url()).max(9).optional().describe('图片 URL 数组'),
  model: z.string().describe('视频生成模型名称'),
  duration: z.number().int().min(1).max(15).optional().describe('视频时长（秒）'),
  resolution: z.string().optional().describe('视频分辨率'),
  aspectRatio: z.enum(ALL_ASPECT_RATIOS).optional().describe('视频比例'),
  videoUrls: z.array(z.url()).max(3).optional().describe('运动参考视频 URL 数组'),
  draftType: z.enum(DRAFT_TYPES).default('draft').describe('草稿类型'),
  platforms: z.array(z.enum(AccountType)).optional().describe('目标平台列表'),
  plannerModel: z.string().optional().describe('草稿规划模型名称，仅 draftType=draft 时生效'),
  disableMemory: z.boolean().optional().default(true).describe('是否禁用用户记忆'),
})
export class InternalCreateDraftV2Dto extends createZodDto(InternalCreateDraftV2Schema, 'InternalCreateDraftV2Dto') {}

const InternalCreateImageTextDraftSchema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.enum(UserType).describe('用户类型'),
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID'),
  prompt: z.string().max(2000).describe('图片生成提示词；draftType=image 时作为纯图片提示词'),
  captionPrompt: z.string().max(2000).optional().describe('文案生成提示词，用于标题、描述和话题；draftType=image 时忽略'),
  imageUrls: z.array(z.url()).max(14).optional().describe('参考图片 URL 数组'),
  imageModel: z.string().describe('图片生成模型名称'),
  imageCount: z.number().int().min(1).max(9).default(3).describe('生成图片数量'),
  imageSize: z.string().optional().describe('图片分辨率'),
  aspectRatio: z.enum(IMAGE_TEXT_ASPECT_RATIOS).optional().describe('图片宽高比'),
  draftType: z.enum(IMAGE_TEXT_DRAFT_TYPES).default('draft').describe('草稿类型'),
  platforms: z.array(z.enum(AccountType)).optional().describe('目标平台列表'),
  plannerModel: z.string().optional().describe('草稿规划模型名称，仅 draftType=draft 时生效'),
  disableMemory: z.boolean().optional().default(true).describe('是否禁用用户记忆'),
})
export class InternalCreateImageTextDraftDto extends createZodDto(InternalCreateImageTextDraftSchema, 'InternalCreateImageTextDraftDto') {}

const InternalGetDraftTaskSchema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.enum(UserType).describe('用户类型'),
  taskId: z.string().describe('任务 ID'),
})
export class InternalGetDraftTaskDto extends createZodDto(InternalGetDraftTaskSchema, 'InternalGetDraftTaskDto') {}

const InternalListDraftTasksSchema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.enum(UserType).describe('用户类型'),
  page: z.coerce.number().default(1).describe('页码'),
  pageSize: z.coerce.number().default(10).describe('每页数量'),
})
export class InternalListDraftTasksDto extends createZodDto(InternalListDraftTasksSchema, 'InternalListDraftTasksDto') {}

const InternalQueryDraftTasksSchema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.enum(UserType).describe('用户类型'),
  taskIds: z.array(z.string()).min(1).max(10).describe('任务 ID 列表'),
})
export class InternalQueryDraftTasksDto extends createZodDto(InternalQueryDraftTasksSchema, 'InternalQueryDraftTasksDto') {}
