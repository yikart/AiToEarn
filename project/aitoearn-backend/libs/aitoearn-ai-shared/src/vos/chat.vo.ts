import { createZodDto, zodI18nString } from '@yikart/common'
import { z } from 'zod'
import { messageContentComplexSchema } from '../dtos/chat.dto'
import { AiLogChannel } from '../enums'

const modalitiesTokenDetails = z.object({
  text: z.number().optional(),
  image: z.number().optional(),
  audio: z.number().optional(),
  video: z.number().optional(),
  document: z.number().optional(),
})

const chatInputTokenDetailsSchema = z.object({
  ...modalitiesTokenDetails.shape,
  cache_read: z.number().optional(),
  cache_creation_5m: z.number().optional(),
  cache_creation_1h: z.number().optional(),
}).optional()

const chatOutputTokenDetailsSchema = z.object({
  ...modalitiesTokenDetails.shape,
  reasoning: z.number().optional(),
}).optional()

const chatCompletionVoSchema = z.object({
  content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('生成内容'),
  model: z.string().optional().describe('使用的模型'),
  usage: z.object({
    input_tokens: z.number().optional().describe('输入token数'),
    output_tokens: z.number().optional().describe('输出token数'),
    total_tokens: z.number().optional().describe('总token数'),
    input_token_details: chatInputTokenDetailsSchema,
    output_token_details: chatOutputTokenDetailsSchema,
  }).optional().describe('token 使用情况'),
})

export class ChatCompletionVo extends createZodDto(chatCompletionVoSchema) {}

// 流式响应 Chunk VO
export const chatCompletionChunkVoSchema = z.union([
  z.object({
    type: z.literal('content'),
    content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('流式内容'),
  }),
  z.object({
    type: z.literal('complete'),
    content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('完整内容'),
    usage: z.object({
      input_tokens: z.number().optional().describe('输入token数'),
      output_tokens: z.number().optional().describe('输出token数'),
      total_tokens: z.number().optional().describe('总token数'),
      input_token_details: chatInputTokenDetailsSchema,
      output_token_details: chatOutputTokenDetailsSchema,
    }).describe('token 使用情况'),
  }),
])

export type ChatCompletionChunkVo = z.infer<typeof chatCompletionChunkVoSchema>

// 对话模型参数 VO
export const chatModelSchema = z.object({
  name: z.string(),
  description: z.string(),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.array(zodI18nString()).default([]),
  mainTag: z.string().optional(),
  channel: z.enum(AiLogChannel).describe('渠道'),
  scenes: z.string().array().optional().describe('适用场景'),
  inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
  outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
})

export class ChatModelConfigVo extends createZodDto(chatModelSchema) {}
