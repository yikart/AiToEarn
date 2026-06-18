import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../channel-db.constants'
import { BaseTemp } from './time.tamp'

export interface ChannelWorkSnapshotData {
  id: string
  url?: string
  title?: string
  description?: string
  mediaType?: string
  coverUrl?: string
  publishedAt?: Date
  status?: string
  author?: string
}

export interface ChannelWorkSnapshotMetrics {
  viewCount?: number
  playCount?: number
  impressionCount?: number
  reachCount?: number
  likeCount?: number
  collectCount?: number
  commentCount?: number
  shareCount?: number
  saveCount?: number
  clickCount?: number
  engagementCount?: number
  watchTimeSeconds?: number
}

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'channelWorkDataSnapshot' })
export class ChannelWorkDataSnapshot extends BaseTemp {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({ required: true, type: String, index: true })
  userId: string

  @Prop({ required: true, enum: AccountType, index: true })
  platform: AccountType

  @Prop({ required: false, type: String, index: true })
  accountId?: string

  @Prop({ required: true, type: String, index: true })
  platformWorkId: string

  @Prop({ required: true, type: Date, index: true })
  snapshotAt: Date

  @Prop({ required: true, type: Date, index: true })
  fetchedAt: Date

  @Prop({ required: false, type: Date })
  periodStartAt?: Date

  @Prop({ required: false, type: Date })
  periodEndAt?: Date

  @Prop({ required: true, type: Object })
  work: ChannelWorkSnapshotData

  @Prop({ required: false, type: Object })
  metrics?: ChannelWorkSnapshotMetrics

  @Prop({ required: false, type: Object })
  extra?: Record<string, unknown>

  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  rawResponse?: unknown
}

export const ChannelWorkDataSnapshotSchema = SchemaFactory.createForClass(ChannelWorkDataSnapshot)
ChannelWorkDataSnapshotSchema.index({ userId: 1, platformWorkId: 1, fetchedAt: -1 })
ChannelWorkDataSnapshotSchema.index({ userId: 1, platformWorkId: 1, snapshotAt: 1, fetchedAt: -1 })
