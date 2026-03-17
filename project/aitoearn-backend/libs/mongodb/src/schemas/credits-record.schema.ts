import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CreditsType } from '@yikart/common'
import { Document } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

export type CreditsRecordDocument = CreditsRecord & Document

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'creditsRecord' })
export class CreditsRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  amount: number // 美分，原始金额，创建后不变，用于统计

  @Prop({
    required: true,
  })
  balance: number // 美分，该记录剩余的可用余额。新增记录时等于amount，扣减时从balance中扣除，过期时设为0。总余额由CreditsBalance表维护

  @Prop({
    required: true,
    enum: CreditsType,
  })
  type: CreditsType

  @Prop({
    required: false,
  })
  description?: string

  @Prop({
    type: Object,
    required: false,
    default: {},
  })
  metadata?: Record<string, unknown>

  @Prop({
    required: false,
    index: true,
  })
  expiredAt?: Date // 过期时间，null表示永久有效，有具体日期表示会过期
}

export const CreditsRecordSchema = SchemaFactory.createForClass(CreditsRecord)
