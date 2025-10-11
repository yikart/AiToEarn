/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2024-11-27 13:01:10
 * @LastEditors: nevin
 * @Description: realAuth RealAuth
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';

export enum SceneType {
  Login = 'login',
  UserWallet = 'userWallet',
  Register = 'register',
}

@Schema({
  collection: 'realAuth',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class RealAuth extends TimeTemp {
  id: string;

  @Prop({ required: true, comment: '用户ID' })
  userId: string;

  @Prop({ required: true, comment: '姓名' })
  userName: string;

  @Prop({ required: true, comment: '身份证号' })
  identifyNum: string;

  @Prop({ required: false, comment: '数据ID' })
  dataId?: string;

  @Prop({ required: false, comment: '场景类型', enum: SceneType })
  sceneType?: SceneType;
}

export const RealAuthSchema = SchemaFactory.createForClass(RealAuth);
