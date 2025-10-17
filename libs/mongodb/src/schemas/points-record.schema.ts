import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { WithTimestampSchema } from './timestamp.schema'

export type PointsRecordDocument = PointsRecord & Document

export enum IPointStatus {
  FREE = 0, // 未被过期积分抵扣欧
  PART_DI_KOU = 1, // 部分被过期积分抵扣
  TOTAL_DI_KOU = 2, // 完全被过期积分抵扣
}

@Schema({
  collection: 'pointsRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class PointsRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  amount: number

  @Prop({
    required: true,
  })
  balance: number

  @Prop({
    required: true,
  })
  type: string

  @Prop({
    required: false,
  })
  description?: string

  // 这条积分记录是否已被过期积分抵扣
  @Prop({
    required: false,
    default: IPointStatus.FREE,
  })
  status: IPointStatus

  @Prop({
    required: false,
    default: 0,
  })
  usedForDiKou: number

  @Prop({
    type: Object,
    required: false,
    default: {},
  })
  metadata?: Record<string, any>
}

export const PointsRecordSchema = SchemaFactory.createForClass(PointsRecord)
