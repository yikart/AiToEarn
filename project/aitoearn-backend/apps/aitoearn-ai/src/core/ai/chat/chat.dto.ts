import { createZodDto, CreditsConsumptionSource, UserType } from '@yikart/common'
import { z } from 'zod'

export {
  ChatCompletionDto,
  chatCompletionDtoSchema,
  ChatMessageDto,
  chatMessageSchema,
  ChatModelsQueryDto,
  messageContentComplexSchema,
  messageContentImageUrlSchema,
  messageContentTextSchema,
  UserChatCompletionDto,
} from '@yikart/aitoearn-ai-shared'

// Claude 透传 DTO - 仅校验必要字段，其余透传
export const claudeChatProxyDtoSchema = z.looseObject({
  messages: z.array(z.looseObject({
    role: z.enum(['user', 'assistant']),
    content: z.any(),
  })).min(1),
  model: z.string(),
  max_tokens: z.number().int().min(1).default(32000),
  billingGroupId: z.string().min(1).optional().describe('计费分组 ID，相同分组的连续 Chat 调用合并扣费日志'),
  source: z.enum([CreditsConsumptionSource.AiChat, CreditsConsumptionSource.Plugin]).optional().describe('消费来源'),
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
  billingGroupId: z.string().min(1).optional().describe('计费分组 ID，相同分组的连续 Chat 调用合并扣费日志'),
  source: z.enum([CreditsConsumptionSource.AiChat, CreditsConsumptionSource.Plugin]).optional().describe('消费来源'),
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
