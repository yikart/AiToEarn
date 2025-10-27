/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-04 15:23:22
 * @LastEditors: nevin
 * @Description: 跟踪
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { TimeTemp } from './time.tamp';

export enum TracingType {
  EVENT = 'event', // 事件
  ERROR = 'error', // 错误收集
}

@Schema({
  collection: 'tracing',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Tracing extends TimeTemp {
  id: string;

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  userId: string;

  @Prop({
    required: true,
    enum: TracingType,
  })
  type: TracingType;

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  tag: string;

  @Prop({
    required: false,
    type: Number,
  })
  accountId?: number; // 平台账号ID

  @Prop({
    required: false,
  })
  desc?: string;

  @Prop({
    required: false,
  })
  dataId?: string; // 关联数据id

  @Prop({
    required: false,
    type: SchemaTypes.Mixed,
  })
  data?: any; // 支持任意类型
}

export const TracingSchema = SchemaFactory.createForClass(Tracing);
