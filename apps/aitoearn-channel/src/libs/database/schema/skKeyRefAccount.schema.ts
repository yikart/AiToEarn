import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/aitoearn-server-client'
import { BaseTemp } from './time.tamp'

@Schema({
  collection: 'skKeyRefAccount',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class SkKeyRefAccount extends BaseTemp {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  key: string

  @Prop({
    required: true,
    index: true,
  })
  accountId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  accountType: AccountType

  // 联合唯一索引定义
  static get indexes() {
    return [{ key: 1, accountId: 1 }]
  }
}

export const SkKeyRefAccountSchema = SchemaFactory.createForClass(SkKeyRefAccount)
