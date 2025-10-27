import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { Types } from 'mongoose';

// 平台类型
export enum AccountType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
  YOUTUBE = 'youtube', // youtube
  TWITTER = 'twitter', // twitter
  TIKTOK = 'tiktok', // tiktok
}

// 账号状态
export enum AccountStatus {
  // 未失效
  USABLE = 0,
  // 失效
  DISABLE = 1,
}

@Schema({
  collection: 'account',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Account extends TimeTemp {
  @Prop({
    required: true,
    unique: true,
    type: Number,
    index: true,
  })
  id: number;

  @Prop({
    required: true,
    type: String,
  })
  userId: string;

  @Prop({
    required: true,
    enum: AccountType,
  })
  type: AccountType;

  @Prop({
    required: true,
    type: String,
  })
  loginCookie: string;

  @Prop({
    required: false,
    type: String,
    default: '',
  })
  token: string; // 其他token 目前抖音用

  @Prop({
    required: false,
    type: Date,
  })
  loginTime?: Date;

  @Prop({
    required: true,
  })
  uid: string;

  @Prop({
    required: true,
  })
  account: string;

  @Prop({
    required: true,
  })
  avatar: string;

  @Prop({
    required: true,
  })
  nickname: string;

  @Prop({
    required: true,
    default: 0,
  })
  fansCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  readCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  likeCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  collectCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  forwardCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  commentCount: number;

  @Prop({
    required: false,
    type: Date,
  })
  lastStatsTime?: Date;

  @Prop({
    required: true,
    default: 0,
  })
  workCount: number;

  @Prop({
    required: true,
    default: 0,
  })
  income: number;

  // 账户关联组，与 accountGroup.id 关联
  @Prop({ type: Number, required: true })
  groupId: number;

  @Prop({
    required: true,
    default: AccountStatus.USABLE,
  })
  status: AccountStatus; // 登录状态，用于判断是否失效

  @Prop({
    required: false,
  })
  googleId: string;

  // @Prop({
  //   required: false,
  // })
  // accessToken: string;

  // @Prop({
  //   required: false,
  // })
  // refreshToken: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
