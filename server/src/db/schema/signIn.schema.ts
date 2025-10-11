/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-04-27 17:34:58
 * @LastEditors: nevin
 * @Description: signIn SignIn
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';

export enum SignInType {
  PUL_VIDEO = 'pul_video',
}

@Schema({
  collection: 'signIn',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class SignIn extends TimeTemp {
  id: string;

  @Prop({ required: true, comment: '用户ID', index: true })
  userId: string;

  @Prop({ required: true, comment: '类型', enum: SignInType })
  type: SignInType;

  @Prop({ required: false, comment: '触发时的数据ID' })
  dataId?: string;

  @Prop({ required: false, comment: '描述' })
  desc?: string;
}

export const SignInSchema = SchemaFactory.createForClass(SignIn);
