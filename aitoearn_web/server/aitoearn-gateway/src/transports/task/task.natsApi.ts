import {
  TaskWithOpportunityDetail,
  TotalAmountResult,
  UserTaskDetail,
} from '@core/task/task.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class TaskNatsApi extends BaseNatsApi {
  async getTaskInfoByOpportunityId(opportunityId: string): Promise<TaskWithOpportunityDetail> {
    return await this.sendMessage<TaskWithOpportunityDetail>(
      NatsApi.task.task.infoByOpportunityId,
      {
        opportunityId,
      },
    )
  }

  async getTotalRewardAmount(userId: string): Promise<TotalAmountResult> {
    return await this.sendMessage<TotalAmountResult>(
      NatsApi.task.task.rewardAmount,
      {
        userId,
      },
    )
  }

  async acceptTask(acceptTaskData: {
    opportunityId: string
    userId: string
  }): Promise<UserTaskDetail> {
    return await this.sendMessage<UserTaskDetail>(
      NatsApi.task.task.accept,
      acceptTaskData,
    )
  }
}
