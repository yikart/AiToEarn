/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-03-24 20:56:59
 * @LastEditors: nevin
 * @Description: 用户钱包
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { Decimal128 } from 'mongodb';

@Schema({
  collection: 'userWallet',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class UserWallet extends TimeTemp {
  @Prop({
    required: true,
  })
  userId: string;

  @Prop({
    type: Decimal128,
    required: true,
    default: 0,
  })
  balance: Decimal128; // 余额

  // 收入
  @Prop({
    type: Decimal128,
    required: true,
    default: 0,
  })
  income: Decimal128;
}

export const UserWalletSchema = SchemaFactory.createForClass(UserWallet);
