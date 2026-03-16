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
  type: z.string(),
}))

export const messageContentComplexSchema = z.union([
  messageContentTextSchema,
  messageContentImageUrlSchema,
  complexObjectSchema,
])

const chatMessageSchema = z.object({
  role: z.string().describe('消息角色'),
  content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('消息内容'),
})
export class ChatMessageDto extends createZodDto(chatMessageSchema) {}

export const chatCompletionDtoSchema = z.object({
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

const chatModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class ChatModelsQueryDto extends createZodDto(chatModelsQuerySchema) {}

// Claude 透传 DTO - 仅校验必要字段，其余透传
export const claudeChatProxyDtoSchema = z.looseObject({
  messages: z.array(z.looseObject({
    role: z.enum(['user', 'assistant']),
    content: z.any(),
  })).min(1),
  model: z.string(),
  max_tokens: z.number().int().min(1).default(32000),
})

export class ClaudeChatProxyDto extends createZodDto(claudeChatProxyDtoSchema, 'ClaudeChatProxyDto') {}

const userClaudeChatProxyDtoSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
}).extend(claudeChatProxyDtoSchema.shape)

export class UserClaudeChatProxyDto extends createZodDto(userClaudeChatProxyDtoSchema, 'UserClaudeChatProxyDto') {}

export const chatStreamProxyDtoSchema = z.looseObject({
  messages: z.array(z.looseObject({
    role: z.string(),
    content: z.any(),
  })).min(1),
  model: z.string(),
})

export class ChatStreamProxyDto extends createZodDto(chatStreamProxyDtoSchema, 'ChatStreamProxyDto') {}

// Gemini generateContent DTO
export const geminiContentPartSchema = z.union([
  z.object({ text: z.string() }),
  z.object({
    inlineData: z.object({
      mimeType: z.string(),
      data: z.string(),
    }),
  }),
  z.object({
    fileData: z.object({
      mimeType: z.string().optional(),
      fileUri: z.string(),
    }),
  }),
])

export const geminiContentSchema = z.object({
  role: z.enum(['user', 'model']).optional(),
  parts: z.array(geminiContentPartSchema),
})

export const geminiGenerateContentDtoSchema = z.object({
  model: z.string().describe('Gemini 模型名称'),
  contents: z.array(geminiContentSchema).describe('内容列表'),
  config: z.looseObject({
    temperature: z.number().optional(),
    topP: z.number().optional(),
    topK: z.number().optional(),
    candidateCount: z.number().optional(),
    maxOutputTokens: z.number().optional(),
    responseLogprobs: z.boolean().optional(),
    logprobs: z.number().optional(),
    presencePenalty: z.number().optional(),
    frequencyPenalty: z.number().optional(),
    seed: z.number().optional(),
    responseMimeType: z.string().optional(),
    responseJsonSchema: z.any().optional(),
  }).optional().describe('生成配置'),
})

export class GeminiGenerateContentDto extends createZodDto(geminiGenerateContentDtoSchema) {}

const userGeminiGenerateContentDtoSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
}).extend(geminiGenerateContentDtoSchema.shape)

export class UserGeminiGenerateContentDto extends createZodDto(userGeminiGenerateContentDtoSchema) {}
