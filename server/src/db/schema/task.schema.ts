/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-04 15:23:22
 * @LastEditors: nevin
 * @Description: 任务
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeTemp } from './time.tamp';
import { AccountType } from './account.schema';

export enum TaskType {
  PRODUCT = 'product', // 商品任务
  VIDEO = 'video', // 视频任务
  ARTICLE = 'article', // 文章任务
  PROMOTION = 'promotion', // 拉新任务
  INTERACTION = 'interaction', // 互动任务
}

export enum TaskStatus {
  ACTIVE = 'active', // 进行中
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已删除
}

export interface TaskFile {
  name: string;
  url: string;
}

export class TaskFileSchema implements TaskFile {
  @Prop({
    required: true,
    comment: '指标名称',
  })
  name: string;

  @Prop({
    required: true,
    comment: '指标值',
  })
  url: string;
}

@Schema({ toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class TaskData {
  @Prop({ required: false })
  title?: string;

  @Prop({ required: false })
  desc?: string;
}
// 视频
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskVideo extends TaskData {
  @Prop({ required: false })
  coverUrl?: string; // 封面图

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: false, type: [String], default: [] })
  topicList: string[];
}

// 文章
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskArticleImg {
  @Prop({ required: true, default: '' })
  content: string; // 内容

  @Prop({ required: true })
  imageUrl: string;
}
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskArticleMaterial {
  @Prop({ required: false })
  coverUrl?: string; // 封面图

  @Prop({ required: false })
  title?: string; // 标题

  @Prop({ required: true })
  temp: string; // 模板字符

  // 图片列表
  @Prop({ required: true, type: [TaskArticleImg], default: [] })
  imageList: TaskArticleImg[];
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskArticle extends TaskData {
  @Prop({ required: true, type: [TaskArticleMaterial], default: [] })
  materialList: TaskArticleMaterial[]; // 素材列表

  @Prop({ required: false, type: [String], default: [] })
  topicList: string[];

  // 图片列表
  @Prop({ required: true, type: [String], default: [] })
  imageList: string[];
}

// 推广
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskPromotion extends TaskData {}

// 商品
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskProduct extends TaskData {
  @Prop({ required: true }) // 商品价格
  price: number;

  // 销量
  @Prop({ required: false })
  sales?: number;
}

// 互动
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskInteraction extends TaskData {
  @Prop({ required: true, enum: AccountType })
  accountType: AccountType; // 平台类型

  @Prop({ required: true, type: String })
  worksId: string; // 作品ID

  @Prop({ required: false, type: String })
  authorId?: string; // 作者ID

  @Prop({ required: false, type: String })
  commentContent?: string; // 评论内容,不填则使用AI
}

@Schema({
  collection: 'task',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Task extends TimeTemp {
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({
    required: true,
  })
  description: string; // md文档

  @Prop({ required: true, enum: TaskType })
  type: TaskType;

  @Prop({
    required: false,
  })
  imageUrl: string; // 配图

  @Prop({ type: Object, required: false })
  dataInfo:
    | TaskVideo
    | TaskPromotion
    | TaskProduct
    | TaskInteraction
    | TaskArticle;

  @Prop({ type: [TaskFileSchema], default: [] })
  fileList: TaskFileSchema[]; // 附件地址列表

  @Prop({ required: true, default: 0 })
  keepTime: number; // 保持时间(秒)

  @Prop({ default: false })
  requiresShoppingCart: boolean; // 是否需要挂购物车

  @Prop({ required: true })
  maxRecruits: number; // 最大招募人数

  @Prop({ default: 0 })
  currentRecruits: number; // 当前招募人数

  @Prop({ required: true })
  deadline: Date; // 任务截止时间

  @Prop({ required: true, type: Number })
  reward: number; // 任务奖励金额

  @Prop({ default: TaskStatus.CANCELLED, enum: TaskStatus })
  status: TaskStatus;

  @Prop({ type: Array<AccountType>, required: true })
  accountTypes: AccountType[]; // 支持的平台tag列表
}

export const TaskSchema = SchemaFactory.createForClass(Task);
