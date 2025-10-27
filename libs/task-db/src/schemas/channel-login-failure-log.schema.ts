import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '..'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'channelLoginFailureLogs',
  versionKey: false,
  timestamps: true,
})
export class ChannelLoginFailureLog extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string // 用户ID

  @Prop({ required: true, index: true })
  channelAccountId: string // 渠道账号ID

  @Prop({ required: true, enum: AccountType, index: true })
  accountType: AccountType // 账号类型

  @Prop({ required: true })
  loginDuration: number // 登录时长（分钟）

  @Prop({ required: true, index: true })
  reason: string // 失效原因

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any> // 额外的元数据信息
}

export const ChannelLoginFailureLogSchema = SchemaFactory.createForClass(ChannelLoginFailureLog)

// 渠道登录失效日志索引
ChannelLoginFailureLogSchema.index({ createdAt: -1 })
