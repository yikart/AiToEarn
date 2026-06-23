import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../channel-db.constants'
import { BaseTemp } from './time.tamp'

export interface ChannelAccountSnapshotProfile {
  displayName?: string
  username?: string
  avatarUrl?: string
  accountType?: string
}

export interface ChannelAccountSnapshotMetrics {
  fansCount?: number
  followingCount?: number
  workCount?: number
  readCount?: number
  viewCount?: number
  impressionCount?: number
  reachCount?: number
  likeCount?: number
  collectCount?: number
  forwardCount?: number
  commentCount?: number
  clickCount?: number
  engagementCount?: number
}

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'channelAccountDataSnapshot' })
export class ChannelAccountDataSnapshot extends BaseTemp {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, enum: AccountType, index: true })
  platform: AccountType

  @Prop({ required: true, type: String, index: true })
  accountId: string

  @Prop({ required: false, type: String, index: true })
  platformUid?: string

  @Prop({ required: true, type: Date, index: true })
  snapshotAt: Date

  @Prop({ required: true, type: Date, index: true })
  fetchedAt: Date

  @Prop({ required: false, type: Date })
  periodStartAt?: Date

  @Prop({ required: false, type: Date })
  periodEndAt?: Date

  @Prop({ required: false, type: Object })
  profile?: ChannelAccountSnapshotProfile

  @Prop({ required: false, type: Object })
  metrics?: ChannelAccountSnapshotMetrics

  @Prop({ required: false, type: Object })
  extra?: Record<string, unknown>

  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  rawResponse?: unknown
}

export const ChannelAccountDataSnapshotSchema = SchemaFactory.createForClass(ChannelAccountDataSnapshot)
ChannelAccountDataSnapshotSchema.index({ userId: 1, accountId: 1, fetchedAt: -1 })
ChannelAccountDataSnapshotSchema.index({ userId: 1, accountId: 1, snapshotAt: 1, fetchedAt: -1 })
