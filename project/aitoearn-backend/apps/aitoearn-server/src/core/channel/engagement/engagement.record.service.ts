import { Injectable, Logger } from '@nestjs/common'
import { EngagementSubTask, EngagementSubTaskRepository, EngagementTask, EngagementTaskRepository, EngagementTaskStatus, EngagementTaskType } from '@yikart/channel-db'
import { CreateEngagementSubTaskDto, CreateEngagementTaskDto } from './task.dto'

export interface ListAvailableEngagementTasksParams {
  limit: number
  taskType?: EngagementTaskType
  platform?: string
  excludeUserId?: string
}

export interface GetEngagementTasksByUserIdParams {
  status?: EngagementTaskStatus
  limit: number
}

@Injectable()
export class EngagementRecordService {
  private readonly logger = new Logger(EngagementRecordService.name)

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

  async listAvailableEngagementTasks(params: ListAvailableEngagementTasksParams): Promise<EngagementTask[]> {
    const { limit, taskType, platform, excludeUserId } = params
    const filter: Record<string, unknown> = {
      status: EngagementTaskStatus.CREATED,
    }
    if (taskType) {
      filter['taskType'] = taskType
    }
    if (platform) {
      filter['platform'] = platform
    }
    if (excludeUserId) {
      filter['userId'] = { $ne: excludeUserId }
    }
    const [tasks] = await this.engagementTaskRepository.listWithPagination({
      filter,
      page: 1,
      pageSize: limit,
    })
    return tasks
  }

  async claimEngagementTask(taskId: string, data: { accountId: string; userId: string }): Promise<EngagementTask | null> {
    const task = await this.engagementTaskRepository.findById(taskId)
    if (!task || task.status !== EngagementTaskStatus.CREATED) {
      return null
    }
    return this.engagementTaskRepository.updateInfo(taskId, {
      status: EngagementTaskStatus.IN_PROGRESS,
      accountId: data.accountId,
      userId: data.userId,
    })
  }

  async getEngagementTasksByUserId(userId: string, params: GetEngagementTasksByUserIdParams): Promise<EngagementTask[]> {
    const { status, limit } = params
    const filter: Record<string, unknown> = { userId }
    if (status) {
      filter['status'] = status
    }
    const [tasks] = await this.engagementTaskRepository.listWithPagination({
      filter,
      page: 1,
      pageSize: limit,
    })
    return tasks
  }
}
