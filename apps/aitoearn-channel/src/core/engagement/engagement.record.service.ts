import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { EngagementSubTask, EngagementTask, EngagementTaskStatus } from '../../libs/database/schema/engagement.task.schema'
import { CreateEngagementSubTaskDto, CreateEngagementTaskDto } from './dto/task.dto'

@Injectable()
export class EngagementRecordService {
  constructor(
    @InjectModel(EngagementTask.name)
    private readonly engagementTaskModel: Model<EngagementTask>,
    @InjectModel(EngagementSubTask.name)
    private readonly engagementSubTaskModel: Model<EngagementSubTask>,
  ) {}

  async createEngagementTask(
    data: CreateEngagementTaskDto,
  ): Promise<EngagementTask> {
    const subPublishTask = new this.engagementTaskModel(data)
    return subPublishTask.save()
  }

  async getEngagementTask(taskId: string): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findById(taskId)
  }

  async searchEngagementTaskInProgress(postId: string, status: EngagementTaskStatus): Promise<EngagementTask[] | null> {
    return this.engagementTaskModel.find({ postId, status: { $ne: status } })
  }

  async createEngagementSubTask(data: CreateEngagementSubTaskDto): Promise<EngagementSubTask> {
    const subPublishTask = new this.engagementSubTaskModel(data)
    return subPublishTask.save()
  }

  async searchEngagementSubTasksByCommentId(postId: string, commentId: string, status: EngagementTaskStatus): Promise<EngagementSubTask[] | null> {
    return this.engagementSubTaskModel.find({ postId, commentId, status })
  }

  async queryEngagementSubTasksByTaskId(taskId: string): Promise<EngagementSubTask[]> {
    return this.engagementSubTaskModel.find({ taskId, status: { $ne: EngagementTaskStatus.COMPLETED } })
  }

  async getEngagementSubTask(subTaskId: string): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskModel.findById(subTaskId)
  }

  async updateEngagementTask(taskId: string, updateData: Partial<CreateEngagementTaskDto>): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, updateData)
  }

  async updateEngagementSubTask(subTaskId: string, updateData: Partial<CreateEngagementSubTaskDto>): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskModel.findByIdAndUpdate(subTaskId, updateData)
  }

  async updateEngagementTaskStatus(taskId: string, status: EngagementTaskStatus): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { status })
  }

  async updateEngagementSubTaskStatus(subTaskId: string, status: EngagementTaskStatus): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskModel.findByIdAndUpdate(subTaskId, { status })
  }

  async incrementEngagementTaskFailedCounters(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { $inc: { failedSubTaskCount: count } })
  }

  async incrementEngagementTaskTotalSubTasks(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { $inc: { subTaskCount: count } })
  }

  async incrementEngagementTaskCompletedSubTasks(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskModel.findByIdAndUpdate(taskId, { $inc: { completedSubTaskCount: count } })
  }
}
