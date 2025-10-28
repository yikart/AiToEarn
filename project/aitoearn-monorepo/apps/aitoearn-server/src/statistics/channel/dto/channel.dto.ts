import { createZodDto } from '@yikart/common'
import { AccountType } from '@yikart/statistics-db'
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
  platform: z.enum(AccountType).describe('平台'),
  userId: z.string().min(1, { message: 'userId is required' }).describe('userId, account表中的userId字段'),
  uid: z.string().min(1, { message: 'uid is required' }).describe('userId, account表中的uid字段'),
  postId: z.string().min(1, { message: 'postId is required' }).describe('作品ID'),
})

export class HistoryPostsRecordDto extends createZodDto(SetHistoryPostsRecordSchema) { }

export const BatchHistoryPostsRecordSchema = z.object({
  records: z.array(SetHistoryPostsRecordSchema).describe('历史发布记录数组'),
})

export class BatchHistoryPostsRecordDto extends createZodDto(BatchHistoryPostsRecordSchema) {}

export const userIdSchema = z.object({
  userId: z.string().min(1, { message: 'userId is required' }),
})

export class UserIdDto extends createZodDto(userIdSchema) {}
