import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

export type CreditsBalanceDocument = CreditsBalance & Document

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'creditsBalance' })
export class CreditsBalance extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    default: 0,
  })
  balance: number // 当前余额（美分）
}

export const CreditsBalanceSchema = SchemaFactory.createForClass(CreditsBalance)
