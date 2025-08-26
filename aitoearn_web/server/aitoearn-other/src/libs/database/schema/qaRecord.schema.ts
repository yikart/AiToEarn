/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-04-14 17:40:15
 * @LastEditors: nevin
 * @Description: 反馈 Feedback feedback
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseTemp } from './time.tamp';

export enum QaRecordType {
  QA = 'qa',
}

@Schema({
  collection: 'qaRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class QaRecord extends BaseTemp {
  id: string;

  @Prop({ comment: '标题', nullable: false })
  title: string;

  @Prop({
    comment: '内容',
    nullable: false,
  })
  content: string;

  @Prop({
    enum: QaRecordType,
    comment: '类型',
    default: QaRecordType.QA,
  })
  type: QaRecordType;

  @Prop({
    comments: '标识数组',
    type: [String],
    default: [],
  })
  tagList: string[];

  @Prop({
    comment: '排序',
    default: 0,
  })
  sort?: number;
}

export const QaRecordSchema = SchemaFactory.createForClass(QaRecord);
