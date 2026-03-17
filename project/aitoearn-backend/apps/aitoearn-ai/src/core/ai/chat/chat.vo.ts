import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { messageContentComplexSchema } from './chat.dto'

const modalitiesTokenDetails = z.object({
  text: z.number().optional(),
  image: z.number().optional(),
  audio: z.number().optional(),
  video: z.number().optional(),
  document: z.number().optional(),
})

const chatPricingModalitySchema = z.object({
  text: z.string(),
  image: z.string().optional(),
  video: z.string().optional(),
  audio: z.string().optional(),
})

const chatPricingTierSchema = z.object({
  maxInputTokens: z.number().int().positive().optional(),
  input: chatPricingModalitySchema,
  output: chatPricingModalitySchema,
})

const chatCompletionVoSchema = z.object({
  content: z.union([z.string(), z.array(messageContentComplexSchema)]).describe('生成内容'),
  model: z.string().optional().describe('使用的模型'),
  usage: z.object({
    points: z.number().optional(),
    input_tokens: z.number().optional().describe('输入token数'),
    output_tokens: z.number().optional().describe('输出token数'),
    total_tokens: z.number().optional().describe('总token数'),
    input_token_details: z.object({
      ...modalitiesTokenDetails.shape,
      cache_read: z.number().optional(),
      cache_creation: z.number().optional(),
    }).optional(),
    output_token_details: z.object({
      ...modalitiesTokenDetails.shape,
      reasoning: z.number().optional(),
    }).optional(),
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
      points: z.number().optional(),
      input_tokens: z.number().optional().describe('输入token数'),
      output_tokens: z.number().optional().describe('输出token数'),
      total_tokens: z.number().optional().describe('总token数'),
      input_token_details: z.object({
        ...modalitiesTokenDetails.shape,
        cache_read: z.number().optional(),
        cache_creation: z.number().optional(),
      }).optional(),
      output_token_details: z.object({
        ...modalitiesTokenDetails.shape,
        reasoning: z.number().optional(),
      }).optional(),
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
  tags: z.string().array().default([]),
  mainTag: z.string().optional(),
  inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
  outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
  pricing: z.union([
    z.object({
      price: z.string(),
    }).strict(),
    z.object({
      tiers: z.array(chatPricingTierSchema).min(1),
    }).strict(),
  ]),
})

export class ChatModelConfigVo extends createZodDto(chatModelSchema) {}
