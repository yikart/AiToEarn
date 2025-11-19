import { createZodDto, UserType } from '@yikart/common'
import { z } from 'zod'

export const messageContentTextSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

export const messageContentImageUrlSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.url(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
})
const complexObjectSchema = z.record(z.string(), z.any()).and(z.object({
  type: z.string().optional(),
}))

const genericObjectSchema = z.record(z.string(), z.any()).and(z.object({
  type: z.undefined(),
}))

export const messageContentComplexSchema = z.union([
  messageContentTextSchema,
  messageContentImageUrlSchema,
  complexObjectSchema,
  genericObjectSchema,
])

const chatMessageSchema = z.object({
  role: z.string().describe('消息角色'),
  content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('消息内容'),
})
export class ChatMessageDto extends createZodDto(chatMessageSchema) {}

const chatCompletionDtoSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).describe('消息列表'),
  model: z.string().describe('模型'),
  temperature: z.number().min(0).max(2).optional().describe('温度参数'),
  maxTokens: z.number().int().min(1).optional().describe('最大输出token数'),
  maxCompletionTokens: z.number().optional(),
  modalities: z.enum(['text', 'audio', 'image', 'video']).array().optional(),
  topP: z.number().optional(),
  modelKwargs: z.record(z.string(), z.any()).optional(),
})

export class ChatCompletionDto extends createZodDto(chatCompletionDtoSchema) {}

const userChatCompletionDtoSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...chatCompletionDtoSchema.shape,
})

export class UserChatCompletionDto extends createZodDto(userChatCompletionDtoSchema) {}

// 聊天模型查询DTO
const chatModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class ChatModelsQueryDto extends createZodDto(chatModelsQuerySchema) {}
