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

// 图片编辑模型参数 VO
const chatModelSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
  outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
  pricing: z.union([
    z.object({
      prompt: z.string(),
      completion: z.string(),
      image: z.string().optional(),
      audio: z.string().optional(),
    }),
    z.object({
      price: z.string(),
    }),
  ]),
})

export class ChatModelConfigVo extends createZodDto(chatModelSchema) {}
