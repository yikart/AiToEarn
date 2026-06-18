import { z } from 'zod'
import { TwitterReplySettings } from './twitter.enum'

export const TwitterOptionSchema = z.object({
  reply_to_tweet_id: z.string().optional().describe('回复的推文 ID'),
  reply_settings: z.enum(TwitterReplySettings).optional().describe('回复设置'),
  poll: z.object({
    options: z.array(z.string().min(1).max(25)).min(2).max(4).describe('投票选项'),
    duration_minutes: z.number().int().min(5).max(10080).describe('投票持续分钟数'),
  }).optional().describe('投票'),
  quote_tweet_id: z.string().optional().describe('引用推文 ID'),
  made_with_ai: z.boolean().optional().describe('是否为 AI 生成内容'),
  paid_partnership: z.boolean().optional().describe('是否为付费合作'),
  alt_text: z.string().max(1000).optional().describe('媒体替代文本'),
})

export type TwitterOption = z.infer<typeof TwitterOptionSchema>
