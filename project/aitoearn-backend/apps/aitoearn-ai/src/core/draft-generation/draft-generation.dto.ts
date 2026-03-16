import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const IMAGE_TEXT_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'] as const

export const GROK_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] as const
export const ALL_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] as const

export const GROK_MAX_DURATION = 15

export const CreateDraftGenerationDtoSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID，为空时使用默认草稿箱'),
  prompt: z.string().max(2000).optional().describe('用户自定义提示词，优先级高于系统内置提示词'),
  imageUrls: z.array(z.url()).max(5).optional().describe('用户传入的图片 URL 数组，传入时作为视频首帧图片源'),
})

export class CreateDraftGenerationDto extends createZodDto(CreateDraftGenerationDtoSchema, 'CreateDraftGenerationDto') { }

export const CreateDraftGenerationV2DtoSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID，为空时使用默认草稿箱'),
  prompt: z.string().max(2000).optional().describe('用户自定义提示词，优先级高于系统内置提示词'),
  imageUrls: z.array(z.url()).max(5).optional().describe('用户传入的图片 URL 数组，传入时作为视频首帧图片源'),
  model: z.string().describe('视频生成模型名称，如 grok-imagine-video'),
  duration: z.number().int().min(1).max(15).optional().describe('视频时长（秒），1-15'),
  aspectRatio: z.enum(ALL_ASPECT_RATIOS).optional().describe('视频比例：1:1/16:9/9:16/4:3/3:4/3:2/2:3'),
  videoUrls: z.array(z.url()).max(3).optional().describe('运动参考视频 URL 数组，最多3个'),
})

export class CreateDraftGenerationV2Dto extends createZodDto(CreateDraftGenerationV2DtoSchema, 'CreateDraftGenerationV2Dto') { }

export const QueryDraftGenerationTasksDtoSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(10).describe('任务 ID 列表'),
})

export class QueryDraftGenerationTasksDto extends createZodDto(QueryDraftGenerationTasksDtoSchema, 'QueryDraftGenerationTasksDto') { }

export const ListDraftGenerationTasksDtoSchema = PaginationDtoSchema

export class ListDraftGenerationTasksDto extends createZodDto(ListDraftGenerationTasksDtoSchema, 'ListDraftGenerationTasksDto') { }

export const CreateImageTextDraftDtoSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1).describe('生成数量'),
  groupId: z.string().optional().describe('素材组 ID，为空时使用默认草稿箱'),
  prompt: z.string().max(2000).describe('用户自定义提示词'),
  imageUrls: z.array(z.url()).max(14).optional().describe('参考图片 URL 数组'),
  imageModel: z.string().describe('图片生成模型名称'),
  imageCount: z.number().int().min(1).max(9).default(3).describe('生成图片数量'),
  imageSize: z.string().optional().describe('图片分辨率：1K、2K 或 4K'),
  aspectRatio: z.enum(IMAGE_TEXT_ASPECT_RATIOS).optional().describe('图片宽高比'),
})

export class CreateImageTextDraftDto extends createZodDto(CreateImageTextDraftDtoSchema, 'CreateImageTextDraftDto') { }
