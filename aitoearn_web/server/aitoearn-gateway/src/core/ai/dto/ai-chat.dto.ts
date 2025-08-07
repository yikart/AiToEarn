import { createZodDto } from '@common/utils/zod-dto.util'
import { z } from 'zod/v4'

// 消息内容类型Schema
const messageContentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().describe('文本内容'),
  }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({
      url: z.string().url().describe('图片链接'),
      detail: z.enum(['auto', 'low', 'high']).optional().describe('图片处理质量'),
    }),
  }),
])

// 聊天消息Schema
const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']).describe('消息角色'),
  content: z.union([z.string(), z.array(messageContentSchema)]).describe('消息内容'),
})

// 用户AI聊天请求Schema
const userAiChatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).describe('消息列表'),
  model: z.string().default('qwen-plus').describe('AI模型'),
  temperature: z.number().min(0).max(2).optional().describe('温度参数'),
  maxTokens: z.number().int().min(1).optional().describe('最大输出token数'),
})

export class UserAiChatRequestDto extends createZodDto(userAiChatRequestSchema) {}
