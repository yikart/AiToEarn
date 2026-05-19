import { z } from 'zod'

export const twitterReplySettingsValues = [
  'following',
  'mentionedUsers',
  'subscribers',
  'verified',
] as const

export const TwitterReplySettingsSchema = z.enum(twitterReplySettingsValues)

export const TwitterMediaMetadataItemSchema = z.object({
  altText: z.string().trim().min(1).max(1000).optional().describe('媒体无障碍描述文本'),
})

export const TwitterPollSchema = z.object({
  options: z.array(z.string().trim().min(1).max(25)).min(2).max(4).describe('投票选项，2-4 项，每项 1-25 个字符'),
  durationMinutes: z.number().int().min(5).max(10080).describe('投票持续时间（分钟），范围 5-10080'),
  replySettings: TwitterReplySettingsSchema.optional().describe('投票帖回复权限'),
})

export const TwitterPublishOptionSchema = z.object({
  replySettings: TwitterReplySettingsSchema.optional().describe('帖子回复权限'),
  madeWithAi: z.boolean().optional().describe('是否包含 AI 生成媒体'),
  poll: TwitterPollSchema.optional().describe('投票配置'),
  mediaTaggedUserIds: z.array(z.string().min(1)).max(10).optional().describe('媒体标记的用户 ID 列表，仅图片帖支持'),
  mediaMetadata: z.array(TwitterMediaMetadataItemSchema).optional().describe('媒体元数据列表，顺序需与媒体上传顺序保持一致'),
})

export type TwitterMediaMetadataItem = z.infer<typeof TwitterMediaMetadataItemSchema>
export type TwitterPollOption = z.infer<typeof TwitterPollSchema>
export type TwitterPublishOption = z.infer<typeof TwitterPublishOptionSchema>
