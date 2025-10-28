/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-04 15:23:22
 * @LastEditors: nevin
 * @Description: 任务处罚
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

export enum TaskPunishStatus {
  WAITING = 0, // 等待处理
  PASS = 1, // 通过
  REJECT = 2, // 拒绝
}

export enum TaskPunishType {
  // 作品删除
  WORK_DELETED = `work_deleted`,
  // 发布内容不合规
  WORK_ILLEGAL = `work_illegal`,
  // 账号违规
  ACCOUNT_ILLEGAL = `account_illegal`,
  // 账号被封禁
  ACCOUNT_BANNED = `account_banned`,
}

@Schema({
  collection: 'taskPunish',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class TaskPunish extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  taskId: string

  @Prop({ required: true, index: true })
  userTaskId: string

  @Prop({ required: true, index: true })
  taskOpportunityId: string

  @Prop({ required: true, index: true })
  title: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true, index: true })
  status: TaskPunishStatus

  @Prop({ required: true, index: true })
  type: TaskPunishType

  @Prop({ required: true, index: true, default: 0 })
  amount: number // 分

  @Prop({ required: true, index: true })
  description: string

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>
}

export const TaskPunishSchema = SchemaFactory.createForClass(TaskPunish)
