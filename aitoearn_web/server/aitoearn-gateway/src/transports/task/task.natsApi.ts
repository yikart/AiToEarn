import {
  TaskDetail,
  TotalAmountResult,
  UserTaskDetail,
} from '@core/task/task.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class TaskNatsApi extends BaseNatsApi {
  async getTaskInfo(taskId: string): Promise<TaskDetail> {
    return await this.sendMessage<TaskDetail>(
      NatsApi.task.task.info,
      {
        id: taskId,
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
    taskId: string
    userId: string
    accountType: string
    uid: string
    account: string
  }): Promise<UserTaskDetail> {
    return await this.sendMessage<UserTaskDetail>(
      NatsApi.task.task.accept,
      acceptTaskData,
    )
  }
}
