import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MaterialService } from '../content/material.service'
import { TaskNatsApi } from '../transports/task/api/task.natsApi'

@Injectable()
export class TaskService {
  constructor(
    private readonly taskNatsApi: TaskNatsApi,
    private readonly materialService: MaterialService,
  ) { }

  async getTaskOpportunityList(page: { pageNo: number, pageSize: number }, userId: string) {
    return await this.taskNatsApi.getTaskOpportunityList(page, userId)
  }

  async getTaskInfoByOpportunityId(opportunityId: string) {
    return await this.taskNatsApi.getTaskInfoByOpportunityId(opportunityId)
  }

  async doView(userId: string, opportunityId: string) {
    return await this.taskNatsApi.doView(userId, opportunityId)
  }

  async doViewAll(userId: string) {
    return await this.taskNatsApi.doViewAll(userId)
  }

  async getNotViewCount(userId: string) {
    return await this.taskNatsApi.getNotViewCount(userId)
  }

  async getTotalRewardAmount(userId: string) {
    return await this.taskNatsApi.getTotalRewardAmount(userId)
  }

  async acceptTask(userId: string, opportunityId: string, accountId?: string) {
    return await this.taskNatsApi.acceptTask({
      opportunityId,
      userId,
      accountId,
    })
  }

  async submitTask(userId: string, userTaskId: string, materialId?: string) {
    const res = await this.taskNatsApi.submitTask(
      userTaskId,
      userId,
      materialId,
    )

    // 素材计数
    if (materialId) {
      this.materialService.addUseCount(materialId)
    }

    return res
  }

  @OnEvent('task.push.withUserCreate')
  pushTaskWithUserCreate(payload: { userId: string }) {
    return this.taskNatsApi.pushTaskWithUserCreate(payload.userId)
  }
}
