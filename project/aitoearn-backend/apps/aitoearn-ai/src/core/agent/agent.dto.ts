import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

// 文本内容块
const TextContentBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string().min(1),
})

// URL 图片源
const URLImageSourceSchema = z.object({
  type: z.literal('url'),
  url: z.url(),
})

// 图片内容块
const ImageContentBlockSchema = z.object({
  type: z.literal('image'),
  source: URLImageSourceSchema,
})

// URL 视频源
const URLVideoSourceSchema = z.object({
  type: z.literal('url'),
  url: z.url(),
})

// 视频内容块
const VideoContentBlockSchema = z.object({
  type: z.literal('video'),
  source: URLVideoSourceSchema,
})

// URL PDF 源
const URLPDFSourceSchema = z.object({
  type: z.literal('url'),
  url: z.url(),
})

// Plain Text 源
const PlainTextSourceSchema = z.object({
  type: z.literal('text'),
  media_type: z.literal('text/plain'),
  data: z.string(),
})

// Content Block 源（递归引用）
const ContentBlockSourceSchema = z.object({
  type: z.literal('content'),
  content: z.union([
    z.string(),
    z.array(z.union([TextContentBlockSchema, ImageContentBlockSchema])),
  ]),
})

// 文档内容块
const DocumentBlockSchema = z.object({
  type: z.literal('document'),
  source: z.union([
    PlainTextSourceSchema,
    ContentBlockSourceSchema,
    URLPDFSourceSchema,
  ]),
  cache_control: z.object({ type: z.literal('ephemeral') }).optional(),
})

// 联合类型：文本、图片、视频或文档
const ContentBlockSchema = z.discriminatedUnion('type', [
  TextContentBlockSchema,
  ImageContentBlockSchema,
  VideoContentBlockSchema,
  DocumentBlockSchema,
])

// 导出 ContentBlock 类型供其他模块使用
export type ContentBlock = z.infer<typeof ContentBlockSchema>

// Prompt 可以是字符串或内容块数组
const PromptSchema = z.union([
  z.string().min(1).max(4000),
  z.array(ContentBlockSchema).min(1).max(20),
])

// 允许的模型列表
export const AllowedModelSchema = z.enum([
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001-thinking',
  'claude-opus-4-5-20251101-thinking',
  'claude-opus-4-5-20251101',
  'claude-sonnet-4-5-20250929-thinking',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-1-20250805',
  'claude-opus-4-1-20250805-thinking',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-6',
  'claude-opus-4-6-thinking',
])
  .default('claude-opus-4-6')

// 创建内容生成任务 DTO
export const CreateContentGenerationTaskSchema = z.object({
  prompt: PromptSchema.describe('提示词（字符串或内容块数组）'),
  model: AllowedModelSchema.describe('使用的模型'),
  includePartialMessages: z.boolean().optional().default(false).describe('是否包含部分消息（流式）'),
  taskId: z.string().transform(val => val.trim() === '' ? undefined : val).optional().describe('任务ID（恢复对话时使用）'),
})
export class CreateContentGenerationTaskDto extends createZodDto(CreateContentGenerationTaskSchema, 'CreateContentGenerationTaskDto') { }

export const GetContentGenerationTaskSchema = z.object({
  taskId: z.string().min(1).max(50).describe('任务ID'),
})
export class GetContentGenerationTaskDto extends createZodDto(GetContentGenerationTaskSchema) { }

export const ListContentGenerationTaskDtoSchema = PaginationDtoSchema.extend({
  keyword: z.string().max(100).optional().describe('搜索关键词（匹配标题和对话内容）'),
  favoriteOnly: z.coerce.boolean().optional().default(false).describe('仅显示收藏的任务'),
})
export class ListContentGenerationTaskDto extends createZodDto(ListContentGenerationTaskDtoSchema, 'ListContentGenerationTaskDto') { }

export const UpdateContentGenerationTaskTitleDtoSchema = z.object({
  title: z.string().min(1).max(200).describe('对话标题'),
})
export class UpdateContentGenerationTaskTitleDto extends createZodDto(UpdateContentGenerationTaskTitleDtoSchema, 'UpdateContentGenerationTaskTitleDto') { }

export const GetTaskMessagesQueryDtoSchema = z.object({
  lastMessageId: z.string().optional().describe('上次获取的最后一条消息 UUID'),
})
export class GetTaskMessagesQueryDto extends createZodDto(GetTaskMessagesQueryDtoSchema, 'GetTaskMessagesQueryDto') { }

export const CreateContentGenerationTaskRatingDtoSchema = z.object({
  rating: z.number().int().min(1).max(5).describe('评分 (1-5)'),
  comment: z.string().max(1000).optional().describe('评论文本'),
})
export class CreateContentGenerationTaskRatingDto extends createZodDto(CreateContentGenerationTaskRatingDtoSchema, 'CreateContentGenerationTaskRatingDto') { }

// DTO: 转发任务到另一个用户
export const ForwardContentGenerationTaskDtoSchema = z.object({
  targetUserId: z.string().min(1).describe('接收转发的用户ID'),
})
export class ForwardContentGenerationTaskDto extends createZodDto(ForwardContentGenerationTaskDtoSchema, 'ForwardContentGenerationTaskDto') { }

// DTO: 创建公开分享链接
export const CreatePublicShareDtoSchema = z.object({
  ttlSeconds: z.number().int().min(60).max(60 * 60 * 24 * 30).optional().describe('分享链接有效期（秒），最小60秒，最大30天'),
})
export class CreatePublicShareDto extends createZodDto(CreatePublicShareDtoSchema, 'CreatePublicShareDto') { }
