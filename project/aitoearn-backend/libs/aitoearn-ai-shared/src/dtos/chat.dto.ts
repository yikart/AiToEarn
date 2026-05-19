import { createZodDto, CreditsConsumptionSource, UserType } from '@yikart/common'
import { z } from 'zod'
import { AiLogChannel } from '../enums'

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
  type: z.string(),
}))

export const messageContentComplexSchema = z.union([
  messageContentTextSchema,
  messageContentImageUrlSchema,
  complexObjectSchema,
])

export type MessageContent = string | z.infer<typeof messageContentComplexSchema>[]

export const chatMessageSchema = z.object({
  role: z.string().describe('消息角色'),
  content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('消息内容'),
})
export class ChatMessageDto extends createZodDto(chatMessageSchema) {}

export type ChatMessage = z.infer<typeof chatMessageSchema>

export const chatCompletionDtoSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).describe('消息列表'),
  model: z.string().describe('模型'),
  temperature: z.number().min(0).max(2).optional().describe('温度参数'),
  maxTokens: z.number().int().min(1).optional().describe('最大输出token数'),
  maxCompletionTokens: z.number().optional(),
  modalities: z.enum(['text', 'audio', 'image', 'video']).array().optional(),
  topP: z.number().optional(),
  modelKwargs: z.record(z.string(), z.any()).optional(),
  billingGroupId: z.string().min(1).optional().describe('计费分组 ID，相同分组的连续 Chat 调用合并为一条计费日志'),
  source: z.enum([CreditsConsumptionSource.AiChat, CreditsConsumptionSource.Plugin]).optional().describe('消费来源'),
})

export class ChatCompletionDto extends createZodDto(chatCompletionDtoSchema) {}

const userChatCompletionDtoSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...chatCompletionDtoSchema.shape,
})

export class UserChatCompletionDto extends createZodDto(userChatCompletionDtoSchema) {}

const chatModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  channel: z.enum(AiLogChannel).optional().describe('渠道筛选'),
  scene: z.string().optional().describe('场景筛选'),
})

export class ChatModelsQueryDto extends createZodDto(chatModelsQuerySchema) {}
