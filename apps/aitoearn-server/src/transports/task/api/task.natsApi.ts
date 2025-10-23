import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../../taskBase.api'
import { TaskOpportunity } from './common'
import { TaskWithOpportunityDetail, TotalAmountResult, UserTaskDetail } from './task.interface'

@Injectable()
export class TaskNatsApi extends TaskBaseApi {
  async getTaskOpportunityList(page: { pageNo: number, pageSize: number }, userId: string): Promise<TaskWithOpportunityDetail> {
    const res = await this.sendMessage<TaskWithOpportunityDetail>(
      `task/taskOpportunity/list`,
      {
        page,
        filter: { userId },
      },
    )
    return res
  }

  async getTaskInfoByOpportunityId(opportunityId: string): Promise<TaskWithOpportunityDetail> {
    const res = await this.sendMessage<TaskWithOpportunityDetail>(
      `task/task/infoByOpportunityId`,
      {
        opportunityId,
      },
    )
    return res
  }

  async doView(userId: string, id: string) {
    const res = await this.sendMessage<TaskOpportunity>(
      `task/taskOpportunity/doView`,
      {
        userId,
        id,
      },
    )
    return res
  }

  async doViewAll(userId: string) {
    const res = await this.sendMessage<boolean>(
      `task/taskOpportunity/doViewAll`,
      {
        userId,
      },
    )
    return res
  }

  async getNotViewCount(userId: string) {
    const res = await this.sendMessage<number>(
      `task/taskOpportunity/notViewCount`,
      {
        userId,
      },
    )
    return res
  }

  async getTotalRewardAmount(userId: string): Promise<TotalAmountResult> {
    const res = await this.sendMessage<TotalAmountResult>(
      `task/task/rewardAmount`,
      {
        userId,
      },
    )
    return res
  }

  async acceptTask(acceptTaskData: {
    opportunityId: string
    userId: string
    accountId?: string
  }): Promise<UserTaskDetail> {
    const res = await this.sendMessage<UserTaskDetail>(
      `task/userTask/accept`,
      acceptTaskData,
    )
    return res
  }

  async submitTask(
    userTaskId: string,
    userId: string,
    materialId?: string,
  ): Promise<UserTaskDetail> {
    const res = await this.sendMessage<UserTaskDetail>(
      `task/userTask/submit`,
      { id: userTaskId, userId, materialId },
    )
    return res
  }
}
