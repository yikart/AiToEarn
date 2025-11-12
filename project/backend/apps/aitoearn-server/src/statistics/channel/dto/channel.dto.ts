import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const accountIdSchema = z.object({
  accountId: z.string().min(1, { message: 'accountId is required' }),
})

export class AccountIdDto extends createZodDto(accountIdSchema) {}

export const searchTopic = z.object({
  topic: z.string().min(1, { message: 'topic is required' }),
  language: z.string().optional().default('zh-CN').describe('language'),
})
export class searchTopicDto extends createZodDto(searchTopic) {}

export const SetHistoryPostsRecordSchema = z.object({
  accountId: z.string().optional().default('').describe('accountId'),
  platform: z.enum(AccountType).describe('Platform'),
  userId: z.string().min(1, { message: 'userId is required' }).describe('User ID from account table'),
  uid: z.string().min(1, { message: 'uid is required' }).describe('UID from account table'),
  postId: z.string().min(1, { message: 'postId is required' }).describe('Post ID'),
})

export class HistoryPostsRecordDto extends createZodDto(SetHistoryPostsRecordSchema) { }

export const BatchHistoryPostsRecordSchema = z.object({
  records: z.array(SetHistoryPostsRecordSchema).describe('Array of history posts records'),
})

export class BatchHistoryPostsRecordDto extends createZodDto(BatchHistoryPostsRecordSchema) {}

export const userIdSchema = z.object({
  userId: z.string().min(1, { message: 'userId is required' }),
})

export class UserIdDto extends createZodDto(userIdSchema) {}

export const SubmitChannelCrawlingSchema = z.object({
  platform: z.enum(AccountType).describe('Platform type'),
  uid: z.string().min(1, { message: 'uid is required' }).describe('Channel UID'),
})

export class SubmitChannelCrawlingDto extends createZodDto(SubmitChannelCrawlingSchema) {}

export const NewChannelSchema = z.object({
  platform: z.string(),
  uid: z.string(),
})
export type NewChannelDto = z.infer<typeof NewChannelSchema>
