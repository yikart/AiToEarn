import { Account, AccountSchema, AuthorDatas, AuthorDatasSchema, ChannelCookie, ChannelCookieSchema, NewChannel, NewChannelSchema } from './account.schema'
import { PostDatas, PostDatasSchema, PostsRecord, PostsRecordSchema } from './posts.schema'
import { TaskSettlementLog, TaskSettlementLogSchema } from './settlement-log.schema'
import { UserTaskPosts, UserTaskPostsSchema } from './task.schema'

export * from './account.schema'
export * from './posts.schema'
export * from './settlement-log.schema'
export * from './task.schema'

export const schemas = [
  { name: Account.name, schema: AccountSchema },
  { name: AuthorDatas.name, schema: AuthorDatasSchema },
  { name: PostDatas.name, schema: PostDatasSchema },
  { name: PostsRecord.name, schema: PostsRecordSchema },
  { name: UserTaskPosts.name, schema: UserTaskPostsSchema },
  { name: NewChannel.name, schema: NewChannelSchema, collection: 'new_channels' },
  { name: ChannelCookie.name, schema: ChannelCookieSchema, collection: 'channel_cookie' },
  { name: TaskSettlementLog.name, schema: TaskSettlementLogSchema },
] as const
