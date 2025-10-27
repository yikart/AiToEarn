import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';

export enum PubType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
  ImageText = 'image-text', // 图文
}

export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
  PartSuccess = 3, // 部分成功
}

@Schema({
  collection: 'pubRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class PubRecord extends TimeTemp {
  @Prop({
    required: true,
    unique: true,
    type: Number,
  })
  id: number;

  @Prop({
    required: true,
  })
  userId: string;

  @Prop({
    required: true,
    enum: PubType,
  })
  type: PubType;

  @Prop({
    required: true,
    default: '',
  })
  title: string;

  @Prop({
    required: true,
    default: '',
  })
  desc: string;

  @Prop({
    required: true,
  })
  accountId: number;

  @Prop({
    required: false,
  })
  videoPath?: string;

  @Prop({
    required: false,
    type: Date,
  })
  timingTime?: Date; // 定时发布日期

  @Prop({
    required: false,
  })
  coverPath?: string; // '封面路径，展示给前台用

  @Prop({
    required: false,
  })
  commonCoverPath?: string; // 通用封面路径

  @Prop({
    required: true,
    type: Date,
  })
  publishTime: Date;

  @Prop({
    required: true,
    enum: PubStatus,
    default: PubStatus.UNPUBLISH,
  })
  status: PubStatus;
}

export const PubRecordSchema = SchemaFactory.createForClass(PubRecord);
