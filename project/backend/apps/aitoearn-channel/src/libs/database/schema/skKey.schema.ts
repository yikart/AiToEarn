import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

export enum SkKeyStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

@Schema({
  collection: 'skKey',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class SkKey extends BaseTemp {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  key: string

  @Prop({
    required: false,
  })
  desc?: string

  @Prop({
    required: true,
    default: SkKeyStatus.NORMAL,
  })
  status: SkKeyStatus // 登录状态，用于判断是否失效
}

export const SkKeySchema = SchemaFactory.createForClass(SkKey)
