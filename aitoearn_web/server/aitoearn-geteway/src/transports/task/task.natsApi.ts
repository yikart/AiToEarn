import {
  TaskDetail,
  TotalAmountResult,
  UserTaskDetail,
} from '@core/task/task.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { NatsService } from '@transports/nats.service'

@Injectable()
export class TaskNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async getTaskInfo(taskId: string): Promise<TaskDetail> {
    return await this.natsService.sendMessage<TaskDetail>(
      NatsApi.task.task.info,
      {
        id: taskId,
      },
    )
  }

  async getTotalRewardAmount(userId: string): Promise<TotalAmountResult> {
    return await this.natsService.sendMessage<TotalAmountResult>(
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
    return await this.natsService.sendMessage<UserTaskDetail>(
      NatsApi.task.task.accept,
      acceptTaskData,
    )
  }
}
