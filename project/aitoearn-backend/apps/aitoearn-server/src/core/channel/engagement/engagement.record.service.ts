import { Injectable } from '@nestjs/common'
import { EngagementSubTask, EngagementSubTaskRepository, EngagementTask, EngagementTaskRepository, EngagementTaskStatus } from '@yikart/channel-db'
import { CreateEngagementSubTaskDto, CreateEngagementTaskDto } from './task.dto'

@Injectable()
export class EngagementRecordService {
  constructor(
    private readonly engagementTaskRepository: EngagementTaskRepository,
    private readonly engagementSubTaskRepository: EngagementSubTaskRepository,
  ) {}

  async createEngagementTask(
    data: CreateEngagementTaskDto,
  ): Promise<EngagementTask> {
    return this.engagementTaskRepository.createEngagementTask({
      ...data,
      targetIds: data.targetIds ?? [],
    })
  }

  async getEngagementTask(taskId: string): Promise<EngagementTask | null> {
    return this.engagementTaskRepository.findById(taskId)
  }

  async searchEngagementTaskInProgress(postId: string, status: EngagementTaskStatus): Promise<EngagementTask[] | null> {
    return this.engagementTaskRepository.searchEngagementTaskInProgress(postId, status)
  }

  async createEngagementSubTask(data: CreateEngagementSubTaskDto): Promise<EngagementSubTask> {
    const subPublishTask = await this.engagementSubTaskRepository.saveNewData(data)
    return subPublishTask
  }

  async searchEngagementSubTasksByCommentId(postId: string, commentId: string, status: EngagementTaskStatus): Promise<EngagementSubTask[] | null> {
    return this.engagementSubTaskRepository.searchEngagementSubTasksByCommentId(postId, commentId, status)
  }

  async queryEngagementSubTasksByTaskId(taskId: string): Promise<EngagementSubTask[]> {
    return this.engagementSubTaskRepository.queryEngagementSubTasksByTaskId(taskId)
  }

  async getEngagementSubTask(subTaskId: string): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskRepository.findById(subTaskId)
  }

  async updateEngagementTask(taskId: string, updateData: Partial<CreateEngagementTaskDto>): Promise<EngagementTask | null> {
    const { targetIds, ...rest } = updateData
    return this.engagementTaskRepository.updateInfo(taskId, {
      ...rest,
      ...(targetIds !== undefined && { targetIds: targetIds ?? [] }),
    })
  }

  async updateEngagementSubTask(subTaskId: string, updateData: Partial<CreateEngagementSubTaskDto>): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskRepository.updateInfo(subTaskId, updateData)
  }

  async updateEngagementTaskStatus(taskId: string, status: EngagementTaskStatus): Promise<EngagementTask | null> {
    return this.engagementTaskRepository.updateStatus(taskId, status)
  }

  async updateEngagementSubTaskStatus(subTaskId: string, status: EngagementTaskStatus): Promise<EngagementSubTask | null> {
    return this.engagementSubTaskRepository.updateStatus(subTaskId, status)
  }

  async incrementEngagementTaskFailedCounters(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskRepository.updateFailedSubTaskCount(taskId, count)
  }

  async incrementEngagementTaskTotalSubTasks(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskRepository.updateSubTaskCount(taskId, count)
  }

  async incrementEngagementTaskCompletedSubTasks(taskId: string, count: number): Promise<EngagementTask | null> {
    return this.engagementTaskRepository.updateCompletedSubTaskCount(taskId, count)
  }
}
