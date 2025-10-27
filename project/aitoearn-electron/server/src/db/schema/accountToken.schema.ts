import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { Types } from 'mongoose';

// 平台类型
export enum TokenPlatform {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
  YOUTUBE = "youtube",  // youtube
  TWITTER = "twitter",  // twitter
  TIKTOK = "tiktok",  // tiktok
}

// 账号状态
export enum TokenStatus {
  // 未失效
  USABLE = 0,
  // 失效
  DISABLE = 1,
}

@Schema({
  collection: 'accountToken',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class AccountToken extends TimeTemp {

  @Prop({
    required: true,
    type: String,
  })
  userId: string;

  @Prop({
    required: true,
    enum: TokenPlatform,
  })
  platform: TokenPlatform;

  @Prop({
    required: true,
    type: String,
    default: '',
  })
  refreshToken: string;

  @Prop({
    required: true,
    unique: true,
  })
  accountId: string;

  @Prop({
    required: true,
    default: TokenStatus.USABLE,
  })
  status: TokenStatus;

  @Prop({
    required: true,
    type: Date,
  })
  createTime: Date;

  @Prop({
    required: true,
    type: Date,
  })
  expiresAt: Date;

  @Prop({
    required: true,
    type: Date,
  })
  updateTime: Date;
}

export const AccountTokenSchema = SchemaFactory.createForClass(AccountToken);
