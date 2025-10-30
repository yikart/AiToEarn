/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-05-06 15:50:05
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
export enum UserStatus {
  STOP = 0,
  OPEN = 1,
  DELETE = -1,
}

export enum EarnInfoStatus {
  CLOSE = 0,
  OPEN = 1,
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserBackData {
  @Prop({
    required: false,
  })
  phone?: string;

  @Prop({ required: false })
  wxOpenid?: string;

  @Prop({ required: false })
  wxUnionid?: string;
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserEarnInfo {
  @Prop({
    required: true,
    enum: EarnInfoStatus,
    default: EarnInfoStatus.OPEN,
  })
  status: EarnInfoStatus;

  @Prop({ required: true })
  cycleInterval: number;
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class GoogleAccount {
  @Prop({ required: true })
  googleId: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  refreshToken: string;

  @Prop()
  expiresAt?: number;
}

@Schema({
  collection: 'user',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class User extends TimeTemp {
  id: string;

  @Prop({
    required: true,
    default: '',
  })
  name: string;

  @Prop({
    required: false,
    index: true,
    unique: true,
  })
  mail?: string;

  @Prop({ type: Object, required: false, default: {} })
  googleAccount?: GoogleAccount;

  @Prop({
    required: false,
    index: true,
    unique: true,
  })
  googleId?: string;

  @Prop({
    required: false,
  })
  phone?: string;

  @Prop({
    required: false,
  })
  password?: string;

  @Prop({
    required: false,
  })
  salt?: string;

  @Prop({
    required: true,
    enum: UserStatus,
    default: UserStatus.OPEN,
  })
  status: UserStatus;

  @Prop({ required: false })
  wxOpenid?: string;

  @Prop({ required: false })
  wxUnionid?: string;

  @Prop({ required: false })
  popularizeCode?: string; // 我的推广码

  @Prop({ required: false })
  inviteUserId?: string; // 邀请人用户ID

  @Prop({ required: false })
  inviteCode?: string; // 我填写的邀请码

  @Prop({ type: Object, required: false, default: {} })
  backData?: UserBackData;

  @Prop({ type: Object, required: false, default: {} })
  earnInfo?: UserEarnInfo;
}

export const UserSchema = SchemaFactory.createForClass(User);
