import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { BaseTemp } from './time.tamp'

export type PointsRecordDocument = PointsRecord & Document

@Schema({
  collection: 'pointsRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class PointsRecord extends BaseTemp {
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

  @Prop({
    type: Object,
    required: false,
    default: {},
  })
  metadata?: Record<string, any>
}

export const PointsRecordSchema = SchemaFactory.createForClass(PointsRecord)
