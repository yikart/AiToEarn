import { Injectable } from '@nestjs/common'
import { TaskNatsApi } from '@transports/task/task.natsApi'
import { AcceptTaskDto } from './task.dto'

@Injectable()
export class TaskService {
  constructor(private readonly taskNatsApi: TaskNatsApi) {}

  async getTaskInfoByOpportunityId(opportunityId: string) {
    return await this.taskNatsApi.getTaskInfoByOpportunityId(opportunityId)
  }

  async getTotalRewardAmount(userId: string) {
    return await this.taskNatsApi.getTotalRewardAmount(userId)
  }

  async acceptTask(userId: string, acceptTaskDto: AcceptTaskDto) {
    return await this.taskNatsApi.acceptTask({
      opportunityId: acceptTaskDto.opportunityId,
      userId,
    })
  }
}
