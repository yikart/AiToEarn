import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { EngagementTask, EngagementTaskStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class EngagementTaskRepository extends BaseRepository<EngagementTask> {
  constructor(
    @InjectModel(EngagementTask.name, DB_CONNECTION_NAME) private engagementTaskModel: Model<EngagementTask>,
  ) {
    super(engagementTaskModel)
  }

  async createEngagementTask(data: Partial<EngagementTask>): Promise<EngagementTask> {
    return this.engagementTaskModel.create(data)
  }

  async findById(taskId: string): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findById(taskId).lean({ virtuals: true })
  }

  async searchEngagementTaskInProgress(postId: string, status: EngagementTaskStatus): Promise<EngagementTask[] | null> {
    return this.engagementTaskModel.find({ postId, status: { $ne: status } }).lean({ virtuals: true })
  }

  async updateInfo(taskId: string, updateData: Partial<EngagementTask>): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, updateData).lean({ virtuals: true })
  }

  async updateStatus(taskId: string, status: EngagementTaskStatus): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { status }).lean({ virtuals: true })
  }

  async updateFailedSubTaskCount(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { $inc: { failedSubTaskCount: count } }, { new: true }).lean({ virtuals: true })
  }

  async updateSubTaskCount(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { $inc: { subTaskCount: count } }, { new: true }).lean({ virtuals: true })
  }

  async updateCompletedSubTaskCount(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { $inc: { completedSubTaskCount: count } }, { new: true }).lean({ virtuals: true })
  }
}
