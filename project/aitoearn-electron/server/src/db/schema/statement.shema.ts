/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-02-27 15:18:16
 * @LastEditors: nevin
 * @Description: 用户流水
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { Decimal128 } from 'mongodb';

@Schema({
  collection: 'statement',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Statement extends TimeTemp {
  @Prop({
    required: true,
  })
  userId: string;

  @Prop({
    type: Decimal128,
    required: true,
    default: 0,
  })
  balance: Decimal128;
}

export const StatementSchema = SchemaFactory.createForClass(Statement);
