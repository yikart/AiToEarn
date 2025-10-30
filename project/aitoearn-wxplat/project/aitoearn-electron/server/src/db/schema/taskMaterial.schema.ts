/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-04 15:23:22
 * @LastEditors: nevin
 * @Description: 任务-素材
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { TaskType } from './task.schema';

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskArticleImg {
  @Prop({ required: false, default: '' })
  content?: string; // 内容

  @Prop({ required: true })
  imageUrl: string;
}

@Schema({
  collection: 'taskMaterial',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class TaskMaterial extends TimeTemp {
  id: string;

  @Prop({ required: true, index: true })
  taskId: string;

  @Prop({ required: true, enum: TaskType })
  type: TaskType;

  @Prop({ required: false })
  title?: string; // 标题

  @Prop({ required: false })
  coverUrl?: string; // 封面图

  @Prop({ required: false })
  temp?: string; // 模板字符

  @Prop({
    required: false,
  })
  desc?: string;

  // 图片列表
  @Prop({ required: true, type: [TaskArticleImg], default: [] })
  imageList: TaskArticleImg[];

  // 已使用次数
  @Prop({ required: true, default: 0 })
  usedCount: number;
}

export const TaskMaterialSchema = SchemaFactory.createForClass(TaskMaterial);
