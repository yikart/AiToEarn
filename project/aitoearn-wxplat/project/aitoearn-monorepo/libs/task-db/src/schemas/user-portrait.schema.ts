import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'userPortraits',
  versionKey: false,
  timestamps: true,
})
export class UserPortrait extends WithTimestampSchema {
  id: string

  @Prop({ required: true })
  userId: string

  @Prop({ required: false })
  name?: string

  @Prop({ required: false })
  avatar?: string

  @Prop({ required: false })
  status?: number

  @Prop({ required: false })
  lastLoginTime?: Date

  @Prop({ type: Object, default: {} })
  contentTags: Record<string, number>

  @Prop({ required: true, default: 0 })
  totalFollowers: number

  @Prop({ required: true, default: 0 })
  totalWorks: number

  @Prop({ required: true, default: 0 })
  totalViews: number

  @Prop({ required: true, default: 0 })
  totalLikes: number

  @Prop({ required: true, default: 0 })
  totalCollects: number

  @Prop({ default: 0 })
  totalViolations: number // 违约次数
}

export const UserPortraitSchema = SchemaFactory.createForClass(UserPortrait)

UserPortraitSchema.index({ userId: 1 }, { unique: true })
UserPortraitSchema.index({ totalFollowers: -1 })
UserPortraitSchema.index({ contentTags: 1 })
