/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2024-11-27 13:01:10
 * @LastEditors: nevin
 * @Description: banner Banner
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { ONOFF } from 'src/global/enum/all.enum';

export enum BannerTag {
  HOME = 'home',
}

@Schema({
  collection: 'banner',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Banner extends TimeTemp {
  id: string;

  @Prop({ required: false, comment: '数据ID' })
  dataId: string;

  @Prop({ required: false, comment: '描述' })
  desc: string;

  @Prop({ required: false, comment: '链接' })
  url: string;

  @Prop({ required: true, comment: '图片链接' })
  imgUrl: string;

  @Prop({ required: true, comment: '标识', enum: BannerTag })
  tag: BannerTag;

  @Prop({
    required: true,
    comments: '是否发布',
    enum: ONOFF,
  })
  isPublish: ONOFF;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
