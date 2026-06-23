import { z } from 'zod'
import { ThreadsMediaType } from './threads.interface'

export enum ThreadsReplyControl {
  Everyone = 'everyone',
  AccountsYouFollow = 'accounts_you_follow',
  MentionedOnly = 'mentioned_only',
  ParentPostAuthorOnly = 'parent_post_author_only',
  FollowersOnly = 'followers_only',
}

export const ThreadsOptionSchema = z.object({
  reply_control: z.enum(ThreadsReplyControl).optional().describe('回复控制'),
  location_id: z.string().min(1).optional().describe('位置 ID'),
  allowlisted_country_codes: z.array(z.string()).optional().describe('允许的国家代码'),
  alt_text: z.string().max(1000).optional().describe('替代文本'),
  auto_publish_text: z.boolean().optional().describe('是否自动发布文本'),
  link_attachment: z.httpUrl().optional().describe('链接附件 URL'),
  reply_to_id: z.string().optional().describe('回复的 Threads 帖子 ID'),
  quote_post_id: z.string().optional().describe('引用的 Threads 帖子 ID'),
})

export type ThreadsOption = z.infer<typeof ThreadsOptionSchema>

export const ThreadsPublishDataOptionSchema = z.object({
  containerId: z.string().min(1).optional().describe('Threads 临时 creation/container ID'),
  childContainerIds: z.array(z.string().min(1)).optional().describe('Threads carousel 子 container ID'),
  mediaType: z.enum(ThreadsMediaType).optional().describe('Threads 发布媒体类型'),
  text: z.string().optional().describe('Threads carousel 总 container 正文'),
  topicTag: z.string().min(1).optional().describe('Threads topic_tag'),
  locationId: z.string().min(1).optional().describe('Threads location_id'),
  replyToId: z.string().min(1).optional().describe('Threads reply_to_id'),
  replyControl: z.enum(ThreadsReplyControl).optional().describe('Threads reply_control'),
  allowlistedCountryCodes: z.array(z.string().min(1)).optional().describe('Threads allowlisted_country_codes'),
  altText: z.string().min(1).optional().describe('Threads alt_text'),
  linkAttachmentUrl: z.httpUrl().optional().describe('Threads link_attachment'),
  quotePostId: z.string().min(1).optional().describe('Threads quote_post_id'),
})

export type ThreadsPublishDataOption = z.infer<typeof ThreadsPublishDataOptionSchema>
