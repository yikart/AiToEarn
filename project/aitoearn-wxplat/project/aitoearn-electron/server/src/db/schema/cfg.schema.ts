/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-04 15:23:22
 * @LastEditors: nevin
 * @Description: 系统配置模块
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { ONOFF } from 'src/global/enum/all.enum';

export enum CfgType {
  comment = 'comment', // 通用
}

@Schema({
  collection: 'cfg',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Cfg extends TimeTemp {
  id: string;

  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  key: string;

  @Prop({
    required: true,
    type: String,
  })
  title: string;

  @Prop({
    required: true,
    type: Object,
  })
  content: any;

  @Prop({
    required: true,
    enum: CfgType,
    default: CfgType.comment,
  })
  type: CfgType;

  @Prop({
    required: true,
    enum: ONOFF,
    default: ONOFF.ON,
  })
  status: ONOFF;

  @Prop({
    required: false,
    type: String,
    default: '',
  })
  desc?: string;
}

export const CfgSchema = SchemaFactory.createForClass(Cfg);
