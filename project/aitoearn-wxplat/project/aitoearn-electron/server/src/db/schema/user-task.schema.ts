/*
 * @Author: nevin
 * @Date: 2024-09-02 14:45:57
 * @LastEditTime: 2025-05-06 14:15:29
 * @LastEditors: nevin
 * @Description: 用户的任务
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TimeTemp } from './time.tamp';
import { AccountType } from './account.schema';

export enum UserTaskStatus {
  DODING = 'doing', // 进行中
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已删除或回退
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class AutoData {
  @Prop({
    required: true,
  })
  status: -1 | 0 | 1;

  @Prop({ required: false })
  message?: string;
}

@Schema({
  collection: 'user_task',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class UserTask extends TimeTemp {
  id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({
    type: String,
    enum: UserTaskStatus,
    default: UserTaskStatus.DODING,
    index: true,
  })
  status: UserTaskStatus;

  @Prop({
    required: true,
    enum: AccountType,
  })
  accountType: AccountType;

  @Prop({
    required: true,
  })
  uid: string; // 平台的用户ID

  @Prop({
    required: true,
  })
  account: string; // 平台的账号

  @Prop({ required: true, default: 0 })
  keepTime: number; // 保持时间(秒)

  @Prop()
  submissionUrl?: string; // 提交的视频、文章或截图URL

  @Prop({
    required: false,
  })
  taskMaterialId?: string; // 任务的素材ID

  @Prop({ type: [String] })
  screenshotUrls?: string[]; // 任务完成截图

  @Prop()
  qrCodeScanResult?: string; // 二维码扫描结果

  @Prop()
  submissionTime?: Date; // 提交时间

  @Prop()
  completionTime?: Date; // 完成时间

  @Prop()
  rejectionReason?: string; // 拒绝原因

  @Prop({ type: Object })
  metadata?: Record<string, any>; // 额外信息，如审核反馈等

  @Prop({ default: false })
  isFirstTimeSubmission: boolean; // 是否首次提交，用于确定是否给予首次奖励

  @Prop()
  verificationNote?: string; // 人工核查备注

  @Prop({
    required: true,
    default: 0,
  })
  reward: number; // 奖励金额

  @Prop()
  rewardTime?: Date; // 奖励发放时间

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId; // 核查人员ID

  @Prop({ type: Object, required: false, default: {} })
  autoData?: AutoData;
}

export const UserTaskSchema = SchemaFactory.createForClass(UserTask);
