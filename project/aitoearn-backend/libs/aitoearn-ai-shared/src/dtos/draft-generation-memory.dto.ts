import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export enum DraftGenerationMemoryContentType {
  Video = 'video',
  ImageText = 'image-text',
}

export const ListDraftGenerationMemoryDtoSchema = z.object({
  contentType: z.enum(DraftGenerationMemoryContentType).optional().describe('Memory 类型：video 视频草稿，image-text 图文草稿'),
})
export class ListDraftGenerationMemoryDto extends createZodDto(ListDraftGenerationMemoryDtoSchema, 'ListDraftGenerationMemoryDto') {}

export const RegenerateDraftGenerationMemoryDtoSchema = z.object({
  contentType: z.enum(DraftGenerationMemoryContentType).describe('Memory 类型：video 视频草稿，image-text 图文草稿'),
  plannerModel: z.string().optional().describe('草稿规划模型名称，不传时使用默认规划模型'),
})
export class RegenerateDraftGenerationMemoryDto extends createZodDto(RegenerateDraftGenerationMemoryDtoSchema, 'RegenerateDraftGenerationMemoryDto') {}
