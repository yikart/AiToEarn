import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { EngagementSubTask, EngagementTaskStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class EngagementSubTaskRepository extends BaseRepository<EngagementSubTask> {
  constructor(
    @InjectModel(EngagementSubTask.name, DB_CONNECTION_NAME) private engagementSubTaskModel: Model<EngagementSubTask>,
  ) {
    super(engagementSubTaskModel)
  }

  async saveNewData(data: Partial<EngagementSubTask>) {
    const subPublishTask = new this.engagementSubTaskModel(data)
    const saved = await subPublishTask.save()
    return saved.toObject()
  }

  async searchEngagementSubTasksByCommentId(postId: string, commentId: string, status: EngagementTaskStatus): Promise<EngagementSubTask[] | null> {
    return this.engagementSubTaskModel.find({ postId, commentId, status: { $ne: status } }).lean({ virtuals: true })
  }

  async queryEngagementSubTasksByTaskId(taskId: string): Promise<EngagementSubTask[]> {
    return this.engagementSubTaskModel.find({ taskId, status: { $ne: EngagementTaskStatus.COMPLETED } }).lean({ virtuals: true })
  }

  async findById(subTaskId: string): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskModel.findById(subTaskId).lean({ virtuals: true })
  }

  async updateInfo(subTaskId: string, updateData: Partial<EngagementSubTask>): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskModel.findByIdAndUpdate(subTaskId, updateData).lean({ virtuals: true })
  }

  async updateStatus(subTaskId: string, status: EngagementTaskStatus): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskModel.findByIdAndUpdate(subTaskId, { status }).lean({ virtuals: true })
  }
}
